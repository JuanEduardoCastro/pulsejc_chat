import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { ConversationSummary } from '@/types/chat';

export function useOpenDirectConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactUserId: string) =>
      api
        .post<ConversationSummary>('/chat/conversations/direct', {
          contactUserId,
        })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
