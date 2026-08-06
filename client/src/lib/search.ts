import type { ChatUser } from '@/types/chat';

export function userMatchesQuery(user: ChatUser, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const fields = [user.firstName, user.lastName, user.nickname, user.email];
  return fields.some((field) => field?.toLowerCase().includes(normalizedQuery));
}
