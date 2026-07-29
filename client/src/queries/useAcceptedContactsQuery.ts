import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { ContactSummary } from '@/types/chat';

export function useAcceptedContactsQuery() {
  return useQuery({
    queryKey: ['contacts', 'accepted'],
    queryFn: () =>
      api
        .get<ContactSummary[]>('/contacts', { params: { status: 'accepted' } })
        .then((res) => res.data),
  });
}
