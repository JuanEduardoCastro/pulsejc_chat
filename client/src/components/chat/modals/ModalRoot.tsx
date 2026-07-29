import { useUiStore } from '@/stores/uiStore';
import ProfileModal from './ProfileModal';
import AddContactModal from './AddContactModal';
import ContactInfoModal from './ContactInfoModal';
import ConfirmModal from './ConfirmModal';
import CompleteProfileReminder from './CompleteProfileReminder';

function ModalRoot() {
  const activeModal = useUiStore((state) => state.activeModal);

  if (!activeModal) return null;

  switch (activeModal.type) {
    case 'profile':
      return <ProfileModal />;
    case 'addContact':
      return <AddContactModal />;
    case 'contactInfo':
      return <ContactInfoModal user={activeModal.data.user} />;
    case 'confirm':
      return <ConfirmModal {...activeModal.data} />;
    case 'completeProfileReminder':
      return <CompleteProfileReminder />;
    default:
      return null;
  }
}

export default ModalRoot;
