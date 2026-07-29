import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Message } from '@/types/chat';

type MessagesPage = {
  messages: Message[];
  nextCursor: string | null;
};

export function useMessagesQuery(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      api
        .get<MessagesPage>(`/chat/conversations/${conversationId}/messages`, {
          params: pageParam ? { cursor: pageParam } : undefined,
        })
        .then((res) => res.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: conversationId !== null,
  });
}
