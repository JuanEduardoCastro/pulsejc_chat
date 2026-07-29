import type { ChatUser } from '@/types/chat';

export function getDisplayName(user: ChatUser): string {
  if (user.nickname) return user.nickname;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return fullName || user.email;
}
