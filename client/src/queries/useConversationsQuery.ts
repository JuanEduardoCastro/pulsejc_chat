import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { ConversationSummary } from '@/types/chat';

export function useConversationsQuery() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () =>
      api
        .get<ConversationSummary[]>('/chat/conversations')
        .then((res) => res.data),
  });
}
