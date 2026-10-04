import { useUiStore } from '@/stores/uiStore';
import { lazy, Suspense } from 'react';

const ProfileModal = lazy(() => import('./ProfileModal'));
const AddContactModal = lazy(() => import('./AddContactModal'));
const ContactInfoModal = lazy(() => import('./ContactInfoModal'));
const ConfirmModal = lazy(() => import('./ConfirmModal'));
const CompleteProfileReminder = lazy(() => import('./CompleteProfileReminder'));
const DeleteAccountModal = lazy(() => import('./DeleteAccountModal'));
const PlanModal = lazy(() => import('./PlanModal'));

function ModalRoot() {
  const activeModal = useUiStore((state) => state.activeModal);

  if (!activeModal) return null;

  function renderModal() {
    switch (activeModal!.type) {
      case 'profile':
        return <ProfileModal />;
      case 'addContact':
        return <AddContactModal />;
      case 'contactInfo':
        return <ContactInfoModal user={activeModal!.data.user} />;
      case 'confirm':
        return <ConfirmModal {...activeModal!.data} />;
      case 'completeProfileReminder':
        return <CompleteProfileReminder />;
      case 'deleteAccount':
        return <DeleteAccountModal />;
      case 'plan':
        return <PlanModal />;
      default:
        return null;
    }
  }

  return <Suspense fallback={null}>{renderModal()}</Suspense>;
}

export default ModalRoot;
