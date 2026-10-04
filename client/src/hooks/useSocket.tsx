import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { usePresenceStore } from '@/stores/presenceStore';
import type {
  ConversationSummary,
  Message,
  AppNotification,
  AiUsage,
  AiErrorCode,
} from '@/types/chat';
import type { MessagesPage } from '@/queries/useMessagesQuery';
import { useTranslation } from 'react-i18next';
import { getDisplayName } from '@/lib/displayName';
import { AI_USAGE_QUERY_KEY } from '@/queries/useAiUsageQuery';
import { AI_ERROR_KEY } from '@/lib/aiErrors';

type SocketContextValue = {
  isConnected: boolean;
  sendMessage: (conversationId: string, content: string) => void;
  joinConversation: (conversationId: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  markAsRead: (conversationId: string) => void;
  retryAiReply: (conversationId: string) => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

const TYPING_SAFETY_TIMEOUT_MS = 5000;

const aiStreamId = (conversationId: string) => `ai-stream-${conversationId}`;

export function SocketProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('chat');
  const tRef = useRef(t);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const setOnline = usePresenceStore((state) => state.setOnline);
  const setTypingState = usePresenceStore((state) => state.setTyping);
  const setAiError = usePresenceStore((state) => state.setAiError);
  const setAiRetry = usePresenceStore((state) => state.setAiRetry);
  const incrementUnread = usePresenceStore((state) => state.incrementUnread);
  const { conversationId: routeConversationId } = useParams<{
    conversationId: string;
  }>();
  const setOnlineSnapshot = usePresenceStore(
    (state) => state.setOnlineSnapshot,
  );

  const socketRef = useRef<Socket | null>(null);
  const activeConversationIdRef = useRef<string | undefined>(
    routeConversationId,
  );
  const typingTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    activeConversationIdRef.current = routeConversationId;
  }, [routeConversationId]);

  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
    });
    socketRef.current = socket;

    function updateNewestPage(
      conversationId: string,
      update: (messages: Message[]) => Message[],
    ) {
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        ['messages', conversationId],
        (prev) => {
          if (!prev) return prev;
          const [firstPage, ...rest] = prev.pages;
          return {
            ...prev,
            pages: [
              { ...firstPage, messages: update(firstPage.messages) },
              ...rest,
            ],
          };
        },
      );
    }

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on(
      'user-status',
      ({ userId, online }: { userId: string; online: boolean }) => {
        setOnline(userId, online);
      },
    );

    socket.on(
      'presence-snapshot',
      ({ onlineUserIds }: { onlineUserIds: string[] }) => {
        setOnlineSnapshot(onlineUserIds);
      },
    );

    socket.on('new-message', (message: Message) => {
      if (message.senderType === 'AI') {
        setAiError(message.conversationId, null);
        setAiRetry(message.conversationId, null);
      }

      const streamId = aiStreamId(message.conversationId);
      updateNewestPage(message.conversationId, (messages) => [
        ...messages.filter((m) => m.id !== streamId),
        message,
      ]);

      queryClient.setQueryData<ConversationSummary[]>(
        ['conversations'],
        (prev) => {
          if (!prev) return prev;
          const exists = prev.some((c) => c.id === message.conversationId);
          if (!exists) {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            return prev;
          }
          return prev.map((conversation) =>
            conversation.id === message.conversationId
              ? { ...conversation, lastMessage: message }
              : conversation,
          );
        },
      );

      const isActiveConversation =
        activeConversationIdRef.current === message.conversationId;
      if (!isActiveConversation && message.senderId !== currentUserId) {
        incrementUnread(message.conversationId);
      }
    });

    socket.on(
      'messages-read',
      ({
        conversationId,
        messageIds,
        readAt,
      }: {
        conversationId: string;
        messageIds: string[];
        readAt: string;
      }) => {
        queryClient.setQueryData<InfiniteData<MessagesPage>>(
          ['messages', conversationId],
          (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              pages: prev.pages.map((page) => ({
                ...page,
                messages: page.messages.map((m) =>
                  messageIds.includes(m.id) ? { ...m, readAt } : m,
                ),
              })),
            };
          },
        );
      },
    );

    socket.on(
      'typing',
      ({
        conversationId,
        isTyping,
      }: {
        conversationId: string;
        isTyping: boolean;
      }) => {
        setTypingState(conversationId, isTyping);
        if (typingTimeoutsRef.current[conversationId]) {
          clearTimeout(typingTimeoutsRef.current[conversationId]);
        }
        if (isTyping) {
          typingTimeoutsRef.current[conversationId] = setTimeout(() => {
            setTypingState(conversationId, false);
          }, TYPING_SAFETY_TIMEOUT_MS);
        }
      },
    );

    socket.on('contact-request', () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', 'pending'] });
    });

    socket.on('contact-request-response', () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    socket.on('contact-removed', () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'accepted'] });
    });

    socket.on('notification', (notification: AppNotification) => {
      queryClient.setQueryData<AppNotification[]>(['notifications'], (prev) =>
        prev ? [notification, ...prev] : [notification],
      );

      const name = notification.actor ? getDisplayName(notification.actor) : '';
      const key =
        notification.type === 'CONTACT_REQUEST'
          ? 'notifications.toast.contactRequest'
          : notification.type === 'CONTACT_ACCEPTED'
            ? 'notifications.toast.contactAccepted'
            : 'notifications.toast.contactRejected';

      toast(tRef.current(key, { name }));
    });

    socket.on(
      'ai-error',
      ({
        conversationId,
        code,
      }: {
        conversationId: string;
        code: AiErrorCode;
      }) => {
        updateNewestPage(conversationId, (messages) =>
          messages.filter((m) => m.id !== aiStreamId(conversationId)),
        );
        setAiError(conversationId, code);
        setAiRetry(conversationId, null);
        toast.error(tRef.current(AI_ERROR_KEY[code]));
      },
    );

    socket.on(
      'ai-stream',
      ({ conversationId, text }: { conversationId: string; text: string }) => {
        const streamId = aiStreamId(conversationId);
        const streaming: Message = {
          id: streamId,
          conversationId,
          senderType: 'AI',
          senderId: null,
          content: text,
          attachmentUrl: null,
          attachmentType: null,
          createdAt: new Date().toISOString(),
          readAt: null,
          isStreaming: true,
        };
        updateNewestPage(conversationId, (messages) => [
          ...messages.filter((m) => m.id !== streamId),
          streaming,
        ]);
      },
    );

    socket.on(
      'ai-retrying',
      ({
        conversationId,
        retry,
        maxRetries,
      }: {
        conversationId: string;
        retry: number;
        maxRetries: number;
      }) => {
        setAiRetry(conversationId, { retry, maxRetries });
      },
    );

    socket.on('ai-usage', (usage: AiUsage) => {
      queryClient.setQueryData(AI_USAGE_QUERY_KEY, usage);
    });

    socket.on(
      'ai-limit-reached',
      ({
        plan,
        used,
        limit,
        resetsAt,
      }: AiUsage & { conversationId: string }) => {
        queryClient.setQueryData(AI_USAGE_QUERY_KEY, {
          plan,
          used,
          limit,
          resetsAt,
        });
        toast.error(tRef.current('aiUsage.limitReachedToast'));
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
    };
  }, [
    user,
    currentUserId,
    queryClient,
    setOnline,
    setTypingState,
    incrementUnread,
    setOnlineSnapshot,
    setAiError,
    setAiRetry,
  ]);

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      setAiError(conversationId, null);
      socketRef.current?.emit('send-message', { conversationId, content });
    },
    [setAiError],
  );

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('join-conversation', { conversationId });
  }, []);

  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    socketRef.current?.emit('typing', { conversationId, isTyping });
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('mark-as-read', { conversationId });
  }, []);

  const retryAiReply = useCallback(
    (conversationId: string) => {
      setAiError(conversationId, null);
      socketRef.current?.emit('retry-ai-reply', { conversationId });
    },
    [setAiError],
  );

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        sendMessage,
        joinConversation,
        setTyping,
        markAsRead,
        retryAiReply,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
