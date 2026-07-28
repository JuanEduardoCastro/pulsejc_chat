import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  hasSeenWelcome: boolean;
  locale: 'es' | 'en';
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'pulsejc-auth' },
  ),
);
