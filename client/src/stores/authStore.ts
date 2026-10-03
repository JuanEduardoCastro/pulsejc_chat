import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatUser } from '@/types/chat';

export type Plan = 'FREE' | 'PRO';

export type AuthUser = ChatUser & {
  plan?: Plan;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
};

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
