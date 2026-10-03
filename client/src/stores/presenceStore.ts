import { create } from 'zustand';

type PresenceState = {
  onlineUsersIds: Set<string>;
  typingByConversation: Record<string, boolean>;
  unreadByConversation: Record<string, number>;
  aiErrorByConversation: Record<string, 'BUSY' | 'UNAVAILABLE' | undefined>;
  setOnline: (userId: string, online: boolean) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  setOnlineSnapshot: (onlineUserIds: string[]) => void;
  setAiError: (
    conversationId: string,
    code: 'BUSY' | 'UNAVAILABLE' | null,
  ) => void;
};

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsersIds: new Set(),
  typingByConversation: {},
  unreadByConversation: {},
  aiErrorByConversation: {},
  setOnlineSnapshot: (onlineUserIds) =>
    set({ onlineUsersIds: new Set(onlineUserIds) }),
  setOnline: (userId, online) =>
    set((state) => {
      const next = new Set(state.onlineUsersIds);
      if (online) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return { onlineUsersIds: next };
    }),
  setTyping: (conversationId, isTyping) =>
    set((state) => ({
      typingByConversation: {
        ...state.typingByConversation,
        [conversationId]: isTyping,
      },
    })),
  incrementUnread: (conversationId) =>
    set((state) => ({
      unreadByConversation: {
        ...state.unreadByConversation,
        [conversationId]: (state.unreadByConversation[conversationId] ?? 0) + 1,
      },
    })),
  clearUnread: (conversationId) =>
    set((state) => ({
      unreadByConversation: {
        ...state.unreadByConversation,
        [conversationId]: 0,
      },
    })),
  setAiError: (conversationId, code) =>
    set((state) => ({
      aiErrorByConversation: {
        ...state.aiErrorByConversation,
        [conversationId]: code ?? undefined,
      },
    })),
}));
