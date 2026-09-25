import { Check } from 'lucide-react';
import { useMemo } from 'react';

import { Badge, Button, EmptyState, Tooltip } from '@tahti-player/ui';

import type { TahtiNotification } from '../api/notifications';
import { useNotificationInboxStore } from '../stores/notificationInboxStore';

export function useUnreadNotifications(): TahtiNotification[] {
  // Select the raw array (stable reference, only changes on store `set()`)
  // and derive the filtered list with useMemo. An inline `.filter()` inside
  // the selector returns a new array every call, which trips React's
  // "getSnapshot should be cached" infinite-render-loop guard.
  const items = useNotificationInboxStore((s) => s.items);
  return useMemo(() => items.filter((item) => !item.readAt), [items]);
}

export function RightRailNotificationList({
  notifications,
  onRead,
}: {
  notifications: TahtiNotification[];
  onRead: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={<Check size={28} className="opacity-50" />}
        title="All caught up"
        className="h-full"
      />
    );
  }

  return (
    <ul className="tahti-hide-scrollbar flex h-full flex-col gap-2 overflow-y-auto p-2">
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className="border-accent-purple/40 bg-accent-purple/10 rounded-md border-l-2 p-2 text-xs"
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              {notification.sticky ? (
                <Badge variant="pill" color="yellow" className="mb-1">
                  Needs acknowledgement
                </Badge>
              ) : null}
              <p className="font-semibold">{notification.title}</p>
              {notification.body ? (
                <p className="text-foreground-secondary mt-0.5">
                  {notification.body}
                </p>
              ) : null}
              <p className="text-foreground-secondary mt-1 text-[10px] opacity-70">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
            <Tooltip
              content={notification.sticky ? 'Acknowledge' : 'Mark as seen'}
              side="top"
            >
              <Button
                size="icon-sm"
                variant="text"
                aria-label={
                  notification.sticky
                    ? `Acknowledge ${notification.title}`
                    : `Mark ${notification.title} as seen`
                }
                onClick={() => onRead(notification.id)}
              >
                <Check size={14} />
              </Button>
            </Tooltip>
          </div>
        </li>
      ))}
    </ul>
  );
}
