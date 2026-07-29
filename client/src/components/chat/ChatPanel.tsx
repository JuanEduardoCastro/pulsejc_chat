import { useConversationsQuery } from '@/queries/useConversationsQuery';
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

  if (!conversationId || !conversation) {
    return <EmptyState />;
  }

  return (
    <div className="flex h-full flex-col">
      <ChatHeader conversation={conversation} />
      <MessageList
        conversationId={conversation.id}
        conversationType={conversation.type}
      />
      <MessageInput onSend={() => {}} disabled />
    </div>
  );
}

export default ChatPanel;
