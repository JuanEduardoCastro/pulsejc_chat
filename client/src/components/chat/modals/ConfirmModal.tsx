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
        {/* <button
          type="button"
          onClick={closeModal}
          className="rounded-md border px-4 py-2 text-sm"
          style={{ borderColor: 'var(--border)' }}
        >
          {t('cancel')}
        </button> */}

        <ButtonFull
          type="button"
          text={t('confirm')}
          onClick={handleConfirm}
          buttonStyle={{ backgroundColor: 'var(--accent)' }}
        />
        {/* <button
          type="button"
          onClick={handleConfirm}
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {t('confirm')}
        </button> */}
      </div>
    </Modal>
  );
}

export default ConfirmModal;
