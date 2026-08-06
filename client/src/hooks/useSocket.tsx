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
import type { ConversationSummary, Message } from '@/types/chat';
import type { MessagesPage } from '@/queries/useMessagesQuery';

type SocketContextValue = {
  isConnected: boolean;
  sendMessage: (conversationId: string, content: string) => void;
  joinConversation: (conversationId: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  markAsRead: (conversationId: string) => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

const TYPING_SAFETY_TIMEOUT_MS = 5000;

export function SocketProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const setOnline = usePresenceStore((state) => state.setOnline);
  const setTypingState = usePresenceStore((state) => state.setTyping);
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
    activeConversationIdRef.current = routeConversationId;
  }, [routeConversationId]);

  useEffect(() => {
    if (!token) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

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
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        ['messages', message.conversationId],
        (prev) => {
          if (!prev) return prev;
          const [firstPage, ...rest] = prev.pages;
          return {
            ...prev,
            pages: [
              { ...firstPage, messages: [...firstPage.messages, message] },
              ...rest,
            ],
          };
        },
      );

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

    socket.on('ai-error', ({ message }: { message: string }) => {
      toast.error(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
    };
  }, [
    token,
    currentUserId,
    queryClient,
    setOnline,
    setTypingState,
    incrementUnread,
    setOnlineSnapshot,
  ]);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    socketRef.current?.emit('send-message', { conversationId, content });
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('join-conversation', { conversationId });
  }, []);

  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    socketRef.current?.emit('typing', { conversationId, isTyping });
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('mark-as-read', { conversationId });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        sendMessage,
        joinConversation,
        setTyping,
        markAsRead,
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
