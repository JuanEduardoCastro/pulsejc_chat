import { useParams } from 'react-router-dom';
import Sidebar from '@/components/chat/Sidebar';
import ChatPanel from '@/components/chat/ChatPanel';
import ChatSplash from '@/components/chat/ChatSplash';
import { useConversationsQuery } from '@/queries/useConversationsQuery';
import { SocketProvider, useSocket } from '@/hooks/useSocket';
import { useTranslation } from 'react-i18next';

function ChatLayout() {
  const { t } = useTranslation('chat');
  const { isConnected } = useSocket();
  const { conversationId } = useParams<{ conversationId: string }>();

  return (
    <div className="flex h-svh flex-col">
      {!isConnected && (
        <div
          className="flex items-center justify-center gap-2 border-b py-1.5 
  text-xs"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--accent-bg)',
          }}
        >
          <span
            className="h-3 w-3 animate-spin rounded-full border-2 
  border-current border-t-transparent"
          />
          {t('connection.reconnecting')}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`w-full flex-col border-r md:flex md:w-80 md:flex-none ${
            conversationId ? 'hidden md:flex' : 'flex'
          }`}
          style={{ borderColor: 'var(--border)' }}
        >
          <Sidebar />
        </div>
        <div
          className={`flex-1 flex-col ${conversationId ? 'flex' : 'hidden md:flex'}`}
        >
          <ChatPanel conversationId={conversationId ?? null} />
        </div>
      </div>
    </div>
  );
}

function ChatScreen() {
  const { isLoading } = useConversationsQuery();

  if (isLoading) {
    return <ChatSplash />;
  }

  return (
    <SocketProvider>
      <ChatLayout />
    </SocketProvider>
  );
}

export default ChatScreen;
