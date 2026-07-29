import { useTranslation } from 'react-i18next';
import type { ContactRequest } from '@/types/chat';
import { getDisplayName } from '@/lib/displayName';
import {
  useAcceptContactMutation,
  useRejectContactMutation,
} from '@/queries/useContactMutations';

type ContactRequestItemProps = {
  request: ContactRequest;
};

function ContactRequestItem({ request }: ContactRequestItemProps) {
  const { t } = useTranslation('chat');
  const acceptMutation = useAcceptContactMutation();
  const rejectMutation = useRejectContactMutation();
  const isPending = acceptMutation.isPending || rejectMutation.isPending;
  const name = getDisplayName(request.user);

  return (
    <div
      className="flex items-center gap-3 border-b px-4 py-3"
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full text-sm font-medium text-white uppercase"
        style={{ backgroundColor: '#9ca3af' }}
      >
        {request.user.avatarURL ? (
          <img
            src={request.user.avatarURL}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          name[0]
        )}
      </div>

      <span
        className="min-w-0 flex-1 truncate font-medium"
        style={{ color: 'var(--text-h)' }}
      >
        {name}
      </span>

      <div className="flex flex-none gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => acceptMutation.mutate(request.id)}
          className="rounded-md px-3 py-1 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {t('requests.accept')}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => rejectMutation.mutate(request.id)}
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-60"
          style={{ borderColor: 'var(--border)' }}
        >
          {t('requests.reject')}
        </button>
      </div>
    </div>
  );
}

export default ContactRequestItem;
