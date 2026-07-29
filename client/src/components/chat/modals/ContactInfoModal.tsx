import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import type { ChatUser } from '@/types/chat';
import { getDisplayName } from '@/lib/displayName';
import { useAcceptedContactsQuery } from '@/queries/useAcceptedContactsQuery';
import Modal from './Modal';

type ContactInfoModalProps = {
  user: ChatUser;
};

function ContactInfoModal({ user }: ContactInfoModalProps) {
  const { t, i18n } = useTranslation('chat');
  const { data: contacts } = useAcceptedContactsQuery();
  const contact = contacts?.find((c) => c.user.id === user.id);
  const locale = i18n.language === 'es' ? es : enUS;

  return (
    <Modal title={t('contactInfo.title')}>
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center overflow-hidden
  rounded-full text-xl font-medium text-white uppercase"
          style={{ backgroundColor: '#9ca3af' }}
        >
          {user.avatarURL ? (
            <img
              src={user.avatarURL}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            getDisplayName(user)[0]
          )}
        </div>
        <p className="text-lg font-medium" style={{ color: 'var(--text-h)' }}>
          {getDisplayName(user)}
        </p>
        {user.nickname && <p className="text-sm">@{user.nickname}</p>}
      </div>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt style={{ color: 'var(--text)' }}>{t('contactInfo.email')}</dt>
          <dd className="truncate" style={{ color: 'var(--text-h)' }}>
            {user.email}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt style={{ color: 'var(--text)' }}>
            {t('contactInfo.memberSince')}
          </dt>
          <dd style={{ color: 'var(--text-h)' }}>
            {format(new Date(user.createdAt), 'PP', { locale })}
          </dd>
        </div>
        {contact && (
          <div className="flex justify-between gap-4">
            <dt style={{ color: 'var(--text)' }}>
              {t('contactInfo.contactSince')}
            </dt>
            <dd style={{ color: 'var(--text-h)' }}>
              {format(new Date(contact.contactSince), 'PP', { locale })}
            </dd>
          </div>
        )}
      </dl>
    </Modal>
  );
}

export default ContactInfoModal;
