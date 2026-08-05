import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConversationsQuery } from '@/queries/useConversationsQuery';
import { getDisplayName } from '@/lib/displayName';
import ConversationListItem from './ConversationListItem';

type ConversationListProps = {
  search: string;
};

function ConversationList({ search }: ConversationListProps) {
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

  const filtered = (conversations ?? []).filter((conversation) => {
    if (conversation.type !== 'AI' && !conversation.otherUser) return false;
    if (!search) return true;
    const name =
      conversation.type === 'AI' || !conversation.otherUser
        ? t('ai.name')
        : getDisplayName(conversation.otherUser!);
    return name.toLowerCase().includes(search.toLowerCase());
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-sm">
        {t('conversationList.empty')}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {filtered.map((conversation) => (
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
