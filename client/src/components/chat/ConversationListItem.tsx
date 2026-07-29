import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import type { ConversationSummary } from '@/types/chat';
import { getDisplayName } from '@/lib/displayName';
import { usePresenceStore } from '@/stores/presenceStore';

type ConversationListItemProps = {
  conversation: ConversationSummary;
  active: boolean;
  onClick: () => void;
};

function ConversationListItem({
  conversation,
  active,
  onClick,
}: ConversationListItemProps) {
  const { t, i18n } = useTranslation('chat');
  const isAi = conversation.type === 'AI';
  const isOnline = usePresenceStore((state) =>
    conversation.otherUser
      ? state.onlineUsersIds.has(conversation.otherUser.id)
      : false,
  );
  const unreadCount = usePresenceStore(
    (state) => state.unreadByConversation[conversation.id] ?? 0,
  );

  const name = isAi ? t('ai.name') : getDisplayName(conversation.otherUser!);
  const preview =
    conversation.lastMessage?.content ?? t('conversationList.noMessages');
  const time = conversation.lastMessage
    ? format(new Date(conversation.lastMessage.createdAt), 'p', {
        locale: i18n.language === 'es' ? es : enUS,
      })
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b px-4 py-3 text-left"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: active ? 'var(--accent-bg)' : 'transparent',
      }}
    >
      <div className="relative flex-none">
        <div
          className="flex h-10 w-10 flex-none items-center justify-center
  overflow-hidden rounded-full text-sm font-medium text-white uppercase"
          style={{ backgroundColor: isAi ? 'var(--accent)' : '#9ca3af' }}
        >
          {!isAi && conversation.otherUser?.avatarURL ? (
            <img
              src={conversation.otherUser.avatarURL}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            name[0]
          )}
        </div>
        {!isAi && isOnline && (
          <span
            className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2"
            style={{ backgroundColor: '#22c55e', borderColor: 'var(--bg)' }}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className="truncate font-medium"
            style={{ color: 'var(--text-h)' }}
          >
            {name}
          </span>
          {time && <span className="flex-none text-xs">{time}</span>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm">{preview}</p>
          {unreadCount > 0 && (
            <span
              className="flex h-4 min-w-4 flex-none items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default ConversationListItem;
