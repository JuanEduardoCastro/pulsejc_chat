import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatUser } from '@/types/chat';

export type ActiveModal =
  | { type: 'profile' }
  | { type: 'addContact' }
  | { type: 'contactInfo'; data: { user: ChatUser } }
  | {
      type: 'confirm';
      data: { title: string; message: string; onConfirm: () => void };
    }
  | { type: 'completeProfileReminder' }
  | null;

type Theme = 'light' | 'dark';

type UiState = {
  theme: Theme;
  activeModal: ActiveModal;
  setTheme: (theme: Theme) => void;
  openModal: (modal: NonNullable<ActiveModal>) => void;
  closeModal: () => void;
};

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: prefersDark ? 'dark' : 'light',
      activeModal: null,
      setTheme: (theme) => set({ theme }),
      openModal: (modal) => set({ activeModal: modal }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'pulsejc-ui',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

document.documentElement.dataset.theme = useUiStore.getState().theme;
useUiStore.subscribe((state) => {
  document.documentElement.dataset.theme = state.theme;
});
