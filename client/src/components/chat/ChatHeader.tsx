import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/stores/uiStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { getDisplayName } from '@/lib/displayName';
import type { ConversationSummary } from '@/types/chat';
import AvatarSmall from '../common/AvatarSmall';
import ButtonMenu from '../common/ButtonMenu';

type ChatHeaderProps = {
  conversation: ConversationSummary;
  isAiResponding: boolean;
};

function ChatHeader({ conversation, isAiResponding }: ChatHeaderProps) {
  const { t } = useTranslation('chat');
  const navigate = useNavigate();
  const openModal = useUiStore((state) => state.openModal);
  const isOnline = usePresenceStore((state) =>
    conversation.otherUser
      ? state.onlineUsersIds.has(conversation.otherUser.id)
      : false,
  );
  const isTyping = usePresenceStore(
    (state) => state.typingByConversation[conversation.id] ?? false,
  );

  const isAi = conversation.type === 'AI';
  const name =
    isAi || !conversation.otherUser
      ? t('ai.name')
      : getDisplayName(conversation.otherUser!);
  const status = isAi
    ? isAiResponding
      ? t('ai.thinking')
      : t('ai.status')
    : isTyping
      ? t('presence.typing')
      : isOnline
        ? t('presence.online')
        : t('presence.offline');

  return (
    <div
      className="flex items-center justify-between border-b px-4 py-3"
      style={{ borderColor: 'var(--border)' }}
    >
      <ButtonMenu
        type="button"
        disabled={isAi || !conversation.otherUser}
        onClick={() =>
          openModal({
            type: 'contactInfo',
            data: { user: conversation.otherUser! },
          })
        }
        buttonClassName="flex min-w-0 items-center gap-3 text-left"
        buttonStyle={{ color: 'var(--text)' }}
      >
        <AvatarSmall
          isAi={isAi}
          username={name}
          avatarURL={conversation.otherUser?.avatarURL}
          isOnline={isOnline}
        />
        <div className="min-w-0">
          <p
            className="truncate font-medium"
            style={{ color: 'var(--text-h)' }}
          >
            {name}
          </p>
          <p className="truncate text-xs">{status}</p>
        </div>
      </ButtonMenu>

      <button
        type="button"
        onClick={() => navigate('/chat')}
        className="px-1 text-2xl leading-none"
        style={{ color: 'var(--text)' }}
        aria-label={t('header.closeTrigger')}
      >
        x
      </button>
    </div>
  );
}

export default ChatHeader;
