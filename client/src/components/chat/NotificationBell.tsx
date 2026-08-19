import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useNotificationsQuery } from '@/queries/useNotificationsQuery';
import {
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@/queries/useNotificationMutations';
import { getDisplayName } from '@/lib/displayName';
import type { AppNotification } from '@/types/chat';
import BellIcon from '@/assets/icons/bell.svg?react';
import ButtonMenu from '../common/ButtonMenu';
import AvatarSmall from '../common/AvatarSmall';

function notificationText(
  t: (key: string, options?: Record<string, unknown>) => string,
  notification: AppNotification,
) {
  const name = notification.actor ? getDisplayName(notification.actor) : '';
  switch (notification.type) {
    case 'CONTACT_REQUEST':
      return t('notification.contactRequest', { name });
    case 'CONTACT_ACCEPTED':
      return t('notification.contactAccepted', { name });
    case 'CONTACT_REJECTED':
      return t('notification.contactRejected', { name });
    default:
      return '';
  }
}

function NotificationBell() {
  const { t, i18n } = useTranslation('chat');
  const { data: notifications } = useNotificationsQuery();
  const markAsRead = useMarkNotificationReadMutation();
  const markAllAsRead = useMarkAllNotificationsReadMutation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;
  const locale = i18n.language === 'es' ? es : enUS;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <ButtonMenu
        type="button"
        buttonClassName="flex h-10 w-9 items-center justify-center rounded-full overflow-hidden"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        buttonStyle={{ backgroundColor: 'var(--transparent)' }}
      >
        <div className="relative">
          <BellIcon className="h-10 w-5" style={{ color: 'var(--text)' }} />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 -right-0.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--danger)' }}
            />
          )}
        </div>
      </ButtonMenu>

      {isMenuOpen && (
        <div
          className="absolute right-0 md:left-0 md:right-auto z-10 mt-2 max-h-96 w-80 overflow-y-auto rounded-md border shadow-lg thin-scrollbar"
          style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-2"
            style={{ borderColor: 'var(--border)' }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: 'var(--text-h)' }}
            >
              {t('notifications.title')}
            </span>

            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs hover:opacity-80"
                style={{ color: 'var(--accent)' }}
                onClick={() => markAllAsRead.mutate()}
              >
                {t('notifications.markAllAsRead')}
              </button>
            )}
          </div>
          {!notifications || notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm">
              {t('notifications.empty')}
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className="flex w-full items-start gap-3 border-b px-4 py-3 text-left hover:opacity-80"
                style={{ borderColor: 'var(--border)' }}
                onClick={() => {
                  if (!notification.readAt) markAsRead.mutate(notification.id);
                }}
              >
                <AvatarSmall
                  isAi={false}
                  username={
                    notification.actor?.nickname
                      ? getDisplayName(notification.actor)
                      : undefined
                  }
                  avatarURL={notification.actor?.avatarURL}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm" style={{ color: 'var(--text-h)' }}>
                    {notificationText(t, notification)}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale,
                    })}
                  </span>
                </div>
                {!notification.readAt && (
                  <span
                    className="mt-1.5 h-2 w-2 flex-none rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
