import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConversationsQuery } from '@/queries/useConversationsQuery';
import ConversationListItem from './ConversationListItem';

function ConversationList() {
  const { t } = useTranslation('chat');
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: conversations, isLoading } = useConversationsQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-md shimmer" />
        ))}
      </div>
    );
  }

  const isVisible = (conversations ?? []).filter(
    (conversation) => conversation.type === 'AI' || conversation.otherUser,
  );

  if (isVisible.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-sm">
        {t('conversationList.empty')}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {isVisible.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          active={conversation.id === conversationId}
          onClick={() => navigate(`/chat/${conversation.id}`)}
        />
      ))}
    </div>
  );
}

export default ConversationList;
