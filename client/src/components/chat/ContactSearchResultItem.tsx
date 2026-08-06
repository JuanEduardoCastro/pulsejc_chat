import type { ChatUser } from '@/types/chat';
import { getDisplayName } from '@/lib/displayName';
import AvatarSmall from '../common/AvatarSmall';

type ContactSearchResultItemProps = {
  user: ChatUser;
  disabled?: boolean;
  onClick: () => void;
};

function ContactSearchResultItem({
  user,
  disabled,
  onClick,
}: ContactSearchResultItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 border-b px-4 py-3 text-left disabled:opacity-60"
      style={{ borderColor: 'var(--border)' }}
    >
      <AvatarSmall
        isAi={false}
        username={getDisplayName(user)}
        avatarURL={user.avatarURL}
      />
      <div className="min-w-0 flex">
        <p className="truncate font-medium" style={{ color: 'var(--text-h)' }}>
          {getDisplayName(user)}
        </p>
        <p className="truncate text-sm">{user.email}</p>
      </div>
    </button>
  );
}

export default ContactSearchResultItem;
