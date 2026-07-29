import { useParams } from 'react-router-dom';
import Sidebar from '@/components/chat/Sidebar';
import ChatPanel from '@/components/chat/ChatPanel';
import ChatSplash from '@/components/chat/ChatSplash';
import { useConversationsQuery } from '@/queries/useConversationsQuery';

function ChatScreen() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { isLoading } = useConversationsQuery();

  if (isLoading) {
    return <ChatSplash />;
  }

  return (
    <div className="flex h-svh">
      <div
        className={`w-full flex-col border-r md:flex md:w-80 md:flex-none ${
          conversationId ? 'hidden md:flex' : 'flex'
        }`}
        style={{ borderColor: 'var(--border)' }}
      >
        <Sidebar />
      </div>
      <div
        className={`flex-1 flex-col ${conversationId ? 'flex' : 'hidden  md:flex'}`}
      >
        <ChatPanel conversationId={conversationId ?? null} />
      </div>
    </div>
  );
}

export default ChatScreen;
