import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import type { ChatUser } from '@/types/chat';
import { getDisplayName } from '@/lib/displayName';
import { useAcceptedContactsQuery } from '@/queries/useAcceptedContactsQuery';
import { useConversationsQuery } from '@/queries/useConversationsQuery';
import { api } from '@/lib/axios';
import { useUiStore } from '@/stores/uiStore';
import Modal from './Modal';
import AvatarBig from '@/components/common/AvatarBig';
import ButtonBorder from '@/components/common/ButtonBorder';

type ContactInfoModalProps = {
  user: ChatUser;
};

function ContactInfoModal({ user }: ContactInfoModalProps) {
  const { t, i18n } = useTranslation('chat');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openModal = useUiStore((state) => state.openModal);
  const { conversationId: routeConversationId } = useParams<{
    conversationId: string;
  }>();
  const { data: contacts } = useAcceptedContactsQuery();
  const { data: conversations } = useConversationsQuery();
  const contact = contacts?.find((c) => c.user.id === user.id);
  const conversation = conversations?.find((c) => c.otherUser?.id === user.id);
  const locale = i18n.language === 'es' ? es : enUS;

  function handleDeleteConversation() {
    if (!conversation) return;
    const conversationId = conversation.id;

    openModal({
      type: 'confirm',
      data: {
        title: t('contactInfo.deleteConfirmTitle'),
        message: t('contactInfo.deleteConfirmMessage'),
        onConfirm: () => {
          api.delete(`/chat/conversations/${conversationId}`).then(() => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            if (conversationId === routeConversationId) {
              navigate('/chat');
            }
          });
        },
      },
    });
  }

  function handleRemoveContact() {
    if (!contact) return;
    const contactId = contact.id;
    const conversationIdToLeave = conversation?.id;

    openModal({
      type: 'confirm',
      data: {
        title: t('contactInfo.removeConfirmTitle'),
        message: t('contactInfo.removeConfirmMessage'),
        onConfirm: () => {
          api.delete(`/contacts/${contactId}`).then(() => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({
              queryKey: ['contacts', 'accepted'],
            });

            if (
              conversationIdToLeave &&
              conversationIdToLeave === routeConversationId
            ) {
              navigate('/chat');
            }
          });
        },
      },
    });
  }

  return (
    <Modal title={t('contactInfo.title')}>
      <div className="flex flex-col items-center gap-2 text-center">
        <AvatarBig
          username={getDisplayName(user)}
          avatarURL={user.avatarURL}
          editable={false}
        />
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
      <div className="mt-6 flex flex-col gap-2">
        <ButtonBorder
          type="button"
          text={t('contactInfo.deleteConversation')}
          onClick={handleDeleteConversation}
          disabled={!conversation}
          buttonStyle={{ borderColor: 'var(--border)' }}
        />
        <ButtonBorder
          type="button"
          text={t('contactInfo.removeContact')}
          onClick={handleRemoveContact}
          disabled={!contact}
          buttonStyle={{ borderColor: 'var(--danger)' }}
          textStyle={{ color: 'var(--danger)' }}
        />
      </div>
    </Modal>
  );
}

export default ContactInfoModal;
