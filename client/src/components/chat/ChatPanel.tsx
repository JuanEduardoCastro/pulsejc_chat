import { useEffect } from 'react';
import { useConversationsQuery } from '@/queries/useConversationsQuery';
import { useSocket } from '@/hooks/useSocket';
import { usePresenceStore } from '@/stores/presenceStore';
import EmptyState from './EmptyState';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useAiUsageQuery } from '@/queries/useAiUsageQuery';
import AiUsageBar from './AiUsageBar';
import { useTranslation } from 'react-i18next';

type ChatPanelProps = {
  conversationId: string | null;
};

function ChatPanel({ conversationId }: ChatPanelProps) {
  const { t } = useTranslation('chat');
  const { data: conversations } = useConversationsQuery();
  const conversation = conversations?.find((c) => c.id === conversationId);
  const { joinConversation, markAsRead, sendMessage, setTyping, retryAiReply } =
    useSocket();
  const clearUnread = usePresenceStore((state) => state.clearUnread);
  const isAiConversation = conversation?.type === 'AI';
  const { data: aiUsage } = useAiUsageQuery(isAiConversation);
  const aiLimitReached =
    isAiConversation && !!aiUsage && aiUsage.used >= aiUsage.limit;
  const aiError = usePresenceStore((state) =>
    conversationId ? state.aiErrorByConversation[conversationId] : undefined,
  );

  useEffect(() => {
    if (!conversationId) return;
    const id = conversationId;

    function markConversationRead() {
      markAsRead(id);
      clearUnread(id);
    }

    joinConversation(id);
    markConversationRead();

    function handleFocusOrVisible() {
      if (document.visibilityState === 'visible') {
        markConversationRead();
      }
    }

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [conversationId, joinConversation, markAsRead, clearUnread]);

  if (!conversationId || !conversation) {
    return <EmptyState />;
  }

  const isAiResponding =
    conversation.type === 'AI' &&
    conversation.lastMessage?.senderType === 'USER' &&
    !aiError;

  return (
    <div className="flex h-full flex-col">
      <ChatHeader conversation={conversation} isAiResponding={isAiResponding} />
      {isAiConversation && aiUsage && <AiUsageBar usage={aiUsage} />}
      <MessageList
        key={conversation.id}
        conversationId={conversation.id}
        conversationType={conversation.type}
      />
      {isAiConversation && aiError && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--text-h)' }}
        >
          <span>
            {t(aiError === 'BUSY' ? 'ai.errorBusy' : 'ai.errorUnavailable')}
          </span>
          <button
            type="button"
            onClick={() => retryAiReply(conversation.id)}
            className="rounded-md px-3 py-1 text-sm font-medium hover:opacity-80"
            style={{ color: 'var(--accent)' }}
          >
            {t('ai.retry')}
          </button>
        </div>
      )}
      <MessageInput
        onSend={(content) => sendMessage(conversation.id, content)}
        onTypingChange={(isTyping) => setTyping(conversation.id, isTyping)}
        disabled={aiLimitReached}
      />
    </div>
  );
}

export default ChatPanel;
