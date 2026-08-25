import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import Modal from './Modal';
import ButtonFull from '@/components/common/ButtonFull';

function DeleteAccountModal() {
  const { t } = useTranslation(['chat', 'common']);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  // const openModal = useUiStore((state) => state.openModal);
  const closeModal = useUiStore((state) => state.closeModal);
  const navigate = useNavigate();
  const [typedEmail, setTypedEmail] = useState('');

  const deleteMutation = useMutation({
    mutationFn: () =>
      api.delete('/users/me', { data: { confirmEmail: typedEmail } }),
    onSuccess: () => {
      logout();
      closeModal();
      navigate('/login', { replace: true });
    },
    onError: () => {
      toast.error(t('chat:deleteAccount.genericError'));
    },
  });

  if (!user) return null;

  const matches = typedEmail.toLowerCase() === user.email.toLowerCase();

  return (
    <Modal title={t('chat:deleteAccount.title')}>
      <p className="text-sm" style={{ color: 'var(--text)' }}>
        {t('chat:deleteAccount.warning')}
      </p>

      <label className="mt-4 block text-sm" style={{ color: 'var(--text)' }}>
        {t('chat:deleteAccount.confirmLabel', { email: user.email })}
      </label>

      <input
        type="email"
        value={typedEmail}
        onChange={(e) => setTypedEmail(e.target.value)}
        // contextMenuHidden
        className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
      />

      <ButtonFull
        type="button"
        disabled={!matches || deleteMutation.isPending}
        onClick={() => deleteMutation.mutate()}
        buttonStyle={{
          backgroundColor: 'var(--danger)',
          opacity: matches ? 1 : 0.4,
        }}
      >
        {deleteMutation.isPending ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 
  border-white/40 border-t-white"
          />
        ) : (
          t('chat:deleteAccount.confirmButton')
        )}
      </ButtonFull>
    </Modal>
  );
}

export default DeleteAccountModal;
