import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, ButtonLink } from '@tahti-player/ui';

import { cn } from '../../lib/cn';
import { PageEmpty, PageError } from '../PageStates';
import { NotificationEventInvites } from './NotificationEventInvites';
import { type TopNavState } from './useTopNavState';

/** The notifications quick view; the account menu's Notifications item
 * opens it. */
export function NotificationsPopover({ nav }: { nav: TopNavState }) {
  const { t } = useTranslation('web');
  const {
    notificationsOpen,
    setNotificationsOpen,
    notifications,
    acknowledgeNotification,
    hasOlderNotifications,
    loadingOlderNotifications,
    loadOlderNotifications,
    notificationsError,
    loadNotifications,
  } = nav;

  return (
    <div className="relative">
      {notificationsOpen ? (
        <div
          className="border-border bg-background absolute top-[calc(100%+6px)] right-0 z-40 w-72 rounded-lg border p-2 shadow-lg"
          role="menu"
        >
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <span className="text-sm font-semibold">
              {t('notificationsPopover.title')}
            </span>
            <ButtonLink
              to="/notifications"
              size="xs"
              variant="text"
              onClick={() => setNotificationsOpen(false)}
            >
              {t('notificationsPopover.seeAll')}
            </ButtonLink>
          </div>
          {notificationsError && notifications.length > 0 ? (
            <div
              role="alert"
              className="text-accent-red-strong flex items-center justify-between gap-2 px-2 py-1 text-xs"
            >
              <span>{t('notificationsPopover.refreshError')}</span>
              <Button
                size="xs"
                variant="text"
                onClick={() => void loadNotifications()}
              >
                {t('actions.tryAgain')}
              </Button>
            </div>
          ) : null}
          {notificationsError && notifications.length === 0 ? (
            <PageError
              title={t('notificationsPopover.loadError')}
              description={notificationsError}
              onRetry={() => void loadNotifications()}
            />
          ) : notifications.length === 0 ? (
            <PageEmpty
              title={t('notificationsPopover.empty')}
              className="py-3"
            />
          ) : null}
          {notifications.some(
            (notification) => notification.type === 'EVENT_TAGGED',
          ) ? (
            <NotificationEventInvites />
          ) : null}
          {notifications.length === 0 ? null : (
            <ul className="tahti-hide-scrollbar flex max-h-80 flex-col gap-1 overflow-y-auto">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    'rounded-md px-2 py-2 text-xs',
                    notification.readAt
                      ? 'text-foreground-secondary'
                      : 'bg-accent-cyan/10',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      {notification.sticky && !notification.readAt ? (
                        <Badge variant="pill" color="yellow" className="mb-1">
                          {t('notificationsPopover.needsAcknowledgement')}
                        </Badge>
                      ) : null}
                      {notification.url ? (
                        <a
                          href={notification.url}
                          className="block hover:underline"
                          onClick={() => {
                            if (!notification.readAt && !notification.sticky) {
                              void acknowledgeNotification(notification.id);
                            }
                          }}
                        >
                          <span className="font-semibold">
                            {notification.title}
                          </span>
                          {notification.body ? (
                            <span className="mt-0.5 block">
                              {notification.body}
                            </span>
                          ) : null}
                        </a>
                      ) : (
                        <>
                          <span className="font-semibold">
                            {notification.title}
                          </span>
                          {notification.body ? (
                            <span className="mt-0.5 block">
                              {notification.body}
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>
                    {notification.sticky && !notification.readAt ? (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() =>
                          void acknowledgeNotification(notification.id)
                        }
                      >
                        {t('notificationsPopover.acknowledge')}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
              {hasOlderNotifications ? (
                <li>
                  <Button
                    size="xs"
                    variant="text"
                    className="w-full"
                    disabled={loadingOlderNotifications}
                    onClick={() => void loadOlderNotifications()}
                  >
                    {loadingOlderNotifications
                      ? t('notificationsPopover.loading')
                      : t('notificationsPopover.showOlder')}
                  </Button>
                </li>
              ) : null}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
