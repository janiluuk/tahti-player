import { BellIcon } from 'lucide-react';

import { Badge, Button, EmptyState } from '@tahti-player/ui';

import { cn } from '../../lib/cn';
import { iconBtnClass } from './shared';
import { type TopNavState } from './useTopNavState';

export function NotificationsPopover({ nav }: { nav: TopNavState }) {
  const {
    isMobile,
    setBroadcastOpen,
    setMessagesOpen,
    notificationsOpen,
    setNotificationsOpen,
    notifications,
    acknowledgeNotification,
    unreadNotifications,
  } = nav;

  return (
    <div className="relative">
      <Button
        variant="text"
        size="icon-sm"
        className={cn(
          iconBtnClass,
          'relative',
          isMobile && 'hidden',
          notificationsOpen && 'border-primary bg-primary/15 text-primary',
        )}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={notificationsOpen}
        title="Notifications"
        data-tour-id="topbar-notifications"
        onClick={() => {
          setNotificationsOpen((current) => !current);
          setBroadcastOpen(false);
          setMessagesOpen(false);
        }}
      >
        <BellIcon size={16} />
        {unreadNotifications.length > 0 ? (
          <Badge
            variant="pill"
            color="red"
            className="absolute -top-1 -right-1 min-w-4 px-1 text-center text-[9px] font-bold"
          >
            {Math.min(9, unreadNotifications.length)}
          </Badge>
        ) : null}
      </Button>
      {notificationsOpen ? (
        <div
          className="border-border bg-background absolute top-[calc(100%+6px)] right-0 z-40 w-72 rounded-lg border p-2 shadow-lg"
          role="menu"
        >
          <div className="px-2 py-1">
            <span className="text-sm font-semibold">Notifications</span>
          </div>
          {notifications.length === 0 ? (
            <EmptyState
              size="sm"
              title="No notifications yet"
              className="py-3"
            />
          ) : (
            <ul className="tahti-hide-scrollbar flex max-h-80 flex-col gap-1 overflow-y-auto">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    'rounded-md px-2 py-2 text-xs',
                    notification.readAt
                      ? 'text-foreground-secondary'
                      : 'bg-primary/10',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      {notification.sticky && !notification.readAt ? (
                        <Badge variant="pill" color="yellow" className="mb-1">
                          Needs acknowledgement
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
                        Acknowledge
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
