import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { AppNotification } from '@/types/chat';

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      api.patch(`/notifications/${notificationId}/read`),
    onSuccess: (_data, notificationId) => {
      queryClient.setQueryData<AppNotification[]>(['notifications'], (prev) =>
        prev?.map((notification) =>
          notification.id === notificationId
            ? { ...notification, readAt: new Date().toISOString() }
            : notification,
        ),
      );
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.setQueryData<AppNotification[]>(['notifications'], (prev) =>
        prev?.map((notification) => ({
          ...notification,
          readAt: new Date().toISOString(),
        })),
      );
    },
  });
}
