import { useEffect } from 'react';
import { useConversationsQuery } from '@/queries/useConversationsQuery';
import { useSocket } from '@/hooks/useSocket';
import { usePresenceStore } from '@/stores/presenceStore';
import EmptyState from './EmptyState';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

type ChatPanelProps = {
  conversationId: string | null;
};

function ChatPanel({ conversationId }: ChatPanelProps) {
  const { data: conversations } = useConversationsQuery();
  const conversation = conversations?.find((c) => c.id === conversationId);
  const { joinConversation, markAsRead, sendMessage, setTyping } = useSocket();
  const clearUnread = usePresenceStore((state) => state.clearUnread);

  useEffect(() => {
    if (!conversationId) return;
    joinConversation(conversationId);
    markAsRead(conversationId);
    clearUnread(conversationId);
  }, [conversationId, joinConversation, markAsRead, clearUnread]);

  if (!conversationId || !conversation) {
    return <EmptyState />;
  }

  const isAiResponding =
    conversation.type === 'AI' &&
    conversation.lastMessage?.senderType === 'USER';

  return (
    <div className="flex h-full flex-col">
      <ChatHeader conversation={conversation} isAiResponding={isAiResponding} />
      <MessageList
        conversationId={conversation.id}
        conversationType={conversation.type}
      />
      <MessageInput
        onSend={(content) => sendMessage(conversation.id, content)}
        onTypingChange={(isTyping) => setTyping(conversation.id, isTyping)}
      />
    </div>
  );
}

export default ChatPanel;
