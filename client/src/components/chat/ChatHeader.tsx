import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useUiStore } from '@/stores/uiStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { getDisplayName } from '@/lib/displayName';
import type { ConversationSummary } from '@/types/chat';

type ChatHeaderProps = {
  conversation: ConversationSummary;
  isAiResponding: boolean;
};

function ChatHeader({ conversation, isAiResponding }: ChatHeaderProps) {
  const { t } = useTranslation('chat');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const name = isAi ? t('ai.name') : getDisplayName(conversation.otherUser!);
  const status = isAi
    ? isAiResponding
      ? t('ai.thinking')
      : t('ai.status')
    : isTyping
      ? t('presence.typing')
      : isOnline
        ? t('presence.online')
        : t('presence.offline');

  function handleDelete() {
    api.delete(`/chat/conversations/${conversation.id}`).then(() => {
      queryClient.setQueryData<ConversationSummary[]>(
        ['conversations'],
        (prev) => prev?.filter((c) => c.id !== conversation.id),
      );
      navigate('/chat');
    });
  }

  return (
    <div
      className="flex items-center justify-between border-b px-4 py-3"
      style={{ borderColor: 'var(--border)' }}
    >
      <button
        type="button"
        disabled={isAi}
        onClick={() =>
          openModal({
            type: 'contactInfo',
            data: { user: conversation.otherUser! },
          })
        }
        className="flex min-w-0 items-center gap-3 text-left disabled:cursor-default"
      >
        <div
          className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full text-sm font-medium text-white uppercase"
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
        <div className="min-w-0">
          <p
            className="truncate font-medium"
            style={{ color: 'var(--text-h)' }}
          >
            {name}
          </p>
          <p className="truncate text-xs">{status}</p>
        </div>
      </button>

      <button
        type="button"
        onClick={handleDelete}
        className="text-sm"
        style={{
          color: 'var(--text)',
        }}
      >
        {t('header.deleteChat')}
      </button>
    </div>
  );
}

export default ChatHeader;
