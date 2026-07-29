import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { ContactRequest } from '@/types/chat';

export function usePendingContactsQuery() {
  return useQuery({
    queryKey: ['contacts', 'pending'],
    queryFn: () =>
      api
        .get<ContactRequest[]>('/contacts', { params: { status: 'pending' } })
        .then((res) => res.data),
  });
}
