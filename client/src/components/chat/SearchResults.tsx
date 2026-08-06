import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConversationsQuery } from '@/queries/useConversationsQuery';
import { useAcceptedContactsQuery } from '@/queries/useAcceptedContactsQuery';
import { useOpenDirectConversationMutation } from '@/queries/useOpenDirectConversationMutation';
import { userMatchesQuery } from '@/lib/search';
import ConversationListItem from './ConversationListItem';
import ContactSearchResultItem from './ContactSearchResultItem';
type SearchResultsProps = {
  search: string;
  onSelect: () => void;
};

function SearchResults({ search, onSelect }: SearchResultsProps) {
  const { t } = useTranslation('chat');
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { data: conversations } = useConversationsQuery();
  const { data: contacts } = useAcceptedContactsQuery();
  const openDirectConversation = useOpenDirectConversationMutation();

  const matchedConversations = (conversations ?? []).filter((conversation) => {
    if (conversation.type === 'AI') {
      return t('ai.name').toLowerCase().includes(search.trim().toLowerCase());
    }
    return conversation.otherUser
      ? userMatchesQuery(conversation.otherUser, search)
      : false;
  });

  const conversationUserIds = new Set(
    (conversations ?? [])
      .map((conversation) => conversation.otherUser?.id)
      .filter((id): id is string => Boolean(id)),
  );

  const matchedContacts = (contacts ?? []).filter(
    (contact) =>
      !conversationUserIds.has(contact.user.id) &&
      userMatchesQuery(contact.user, search),
  );

  if (matchedConversations.length === 0 && matchedContacts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-sm">
        {t('search.empty')}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {matchedConversations.length > 0 && (
        <div className="">
          <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase">
            {t('search.conversations')}
          </p>
          {matchedConversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === conversationId}
              onClick={() => {
                navigate(`/chat/${conversation.id}`);
                onSelect();
              }}
            />
          ))}
        </div>
      )}

      {matchedContacts.length > 0 && (
        <div className="">
          <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase">
            {t('search.contactsSection')}
          </p>
          {matchedContacts.map((contact) => (
            <ContactSearchResultItem
              key={contact.id}
              user={contact.user}
              disabled={openDirectConversation.isPending}
              onClick={() => {
                openDirectConversation.mutate(contact.user.id, {
                  onSuccess: (conversation) => {
                    navigate(`/chat/${conversation.id}`);
                    onSelect();
                  },
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchResults;
