import { useTranslation } from 'react-i18next';
import type { ContactRequest } from '@/types/chat';
import { getDisplayName } from '@/lib/displayName';
import {
  useAcceptContactMutation,
  useRejectContactMutation,
} from '@/queries/useContactMutations';
import { useUiStore } from '@/stores/uiStore';
import ButtonFull from '../common/ButtonFull';
import ButtonBorder from '../common/ButtonBorder';

type ContactRequestItemProps = {
  request: ContactRequest;
};

function ContactRequestItem({ request }: ContactRequestItemProps) {
  const { t } = useTranslation('chat');
  const acceptMutation = useAcceptContactMutation();
  const rejectMutation = useRejectContactMutation();
  const openModal = useUiStore((state) => state.openModal);
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

      <div className="flex flex-col w-full gap-2">
        <span
          className="min-w-0 flex-1 truncate font-medium"
          style={{ color: 'var(--text-h)' }}
        >
          {name}
        </span>

        <div className="flex flex-none gap-2 justify-end">
          <ButtonFull
            type="button"
            disabled={isPending}
            onClick={() => acceptMutation.mutate(request.id)}
            buttonStyle={{ backgroundColor: 'var(--accent)' }}
            buttonClassName="rounded-md px-3 py-1 text-sm font-medium text-white disabled:opacity-60"
          >
            {t('requests.accept')}
          </ButtonFull>

          <ButtonBorder
            type="button"
            disabled={isPending}
            onClick={() =>
              openModal({
                type: 'confirm',
                data: {
                  title: t('requests.rejectConfirmTitle'),
                  message: t('requests.rejectConfirmMessage'),
                  onConfirm: () => rejectMutation.mutate(request.id),
                },
              })
            }
            buttonStyle={{ borderColor: 'var(--border)' }}
            buttonClassName="border rounded-md px-3 py-1 text-sm disabled:opacity-60"
            text={t('requests.reject')}
          />
        </div>
      </div>
    </div>
  );
}

export default ContactRequestItem;
