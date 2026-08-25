import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatUser } from '@/types/chat';

export type AuthUser = ChatUser;

export type AuthResponse = {
  user: AuthUser;
};

type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'pulsejc-auth' },
  ),
);
