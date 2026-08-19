import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { AppNotification } from '@/types/chat';

export function useNotificationsQuery() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<AppNotification[]>('/notifications').then((res) => res.data),
  });
}
