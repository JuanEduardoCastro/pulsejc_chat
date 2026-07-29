import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export function useAcceptContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) =>
      api.patch(`/contacts/${contactId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useRejectContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => api.delete(`/contacts/${contactId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', 'pending'] });
    },
  });
}
