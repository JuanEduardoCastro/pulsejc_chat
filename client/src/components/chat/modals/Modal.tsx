import { useEffect, type ReactNode } from 'react';
import { useUiStore } from '@/stores/uiStore';

type ModalProps = {
  title: string;
  children: ReactNode;
};

function Modal({ title, children }: ModalProps) {
  const closeModal = useUiStore((state) => state.closeModal);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeModal();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={closeModal}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md max-h-[85svh] overflow-y-auto rounded-2xl border p-6 thin-scrollbar "
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--text-h)' }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close"
            className="text-xl leading-none"
            style={{ color: 'var(--text)' }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
