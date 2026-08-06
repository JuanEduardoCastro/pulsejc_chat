import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/stores/uiStore';
import Modal from './Modal';
import ButtonBorder from '@/components/common/ButtonBorder';
import ButtonFull from '@/components/common/ButtonFull';

type ConfirmModalProps = {
  title: string;
  message: string;
  onConfirm: () => void;
};

function ConfirmModal({ title, message, onConfirm }: ConfirmModalProps) {
  const { t } = useTranslation();
  const closeModal = useUiStore((state) => state.closeModal);

  function handleConfirm() {
    onConfirm();
    closeModal();
  }

  return (
    <Modal title={title}>
      <p className="text-sm">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <ButtonBorder
          type="button"
          text={t('cancel')}
          onClick={closeModal}
          buttonStyle={{ borderColor: 'var(--border)' }}
        />

        <ButtonFull
          type="button"
          text={t('confirm')}
          onClick={handleConfirm}
          buttonStyle={{ backgroundColor: 'var(--accent)' }}
        />
      </div>
    </Modal>
  );
}

export default ConfirmModal;
