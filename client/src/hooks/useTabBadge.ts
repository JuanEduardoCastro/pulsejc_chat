import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePresenceStore } from '@/stores/presenceStore';
import { useNotificationsQuery } from '@/queries/useNotificationsQuery';

export function useTabBadge() {
  const { t } = useTranslation('common');
  const unreadByConversation = usePresenceStore(
    (state) => state.unreadByConversation,
  );
  const { data: notifications } = useNotificationsQuery();

  const unreadConversationsCount = Object.values(unreadByConversation).filter(
    (count) => count > 0,
  ).length;

  const unreadNotificationsCount =
    notifications?.filter((notification) => !notification.readAt).length ?? 0;

  const badgeCount = unreadConversationsCount + unreadNotificationsCount;

  useEffect(() => {
    const baseTitle = t('appName');

    document.title =
      badgeCount > 0 ? `(${badgeCount}) ${baseTitle}` : baseTitle;

    return () => {
      document.title = baseTitle;
    };
  }, [badgeCount, t]);
}
