import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { Badge, Button, ViewShell } from '@tahti-player/ui';

import {
  clearReadNotifications,
  dismissNotification,
  fetchNotifications,
  markAllNotificationsRead,
  removeNotification,
  type TahtiNotification,
} from '../api/notifications';
import { PageEmpty, PageError } from '../components/PageStates';
import { cn } from '../lib/cn';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function NotificationText({
  notification,
}: {
  notification: TahtiNotification;
}) {
  return (
    <>
      <span className="font-semibold">{notification.title}</span>
      {notification.body ? (
        <span className="text-foreground-secondary mt-0.5 block">
          {notification.body}
        </span>
      ) : null}
    </>
  );
}

export function NotificationsView() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [items, setItems] = useState<TahtiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchNotifications();
    setItems(result.data);
    setUnreadCount(result.unreadCount);
    setHasMore(result.hasMore);
    setError(
      result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      void load();
    }
  }, [user, load]);

  const loadOlder = async () => {
    const oldest = items[items.length - 1];
    if (!oldest) {
      return;
    }
    setLoadingOlder(true);
    const result = await fetchNotifications(oldest.id);
    if (result.meta.source === 'api' && result.meta.reason) {
      setActionError('Could not load older notifications.');
    } else {
      setItems((current) => [...current, ...result.data]);
      setHasMore(result.hasMore);
    }
    setLoadingOlder(false);
  };

  const markRead = async (id: string) => {
    try {
      await dismissNotification(id);
      const readAt = new Date().toISOString();
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, readAt } : item)),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      setActionError('Could not mark the notification read.');
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      const readAt = new Date().toISOString();
      setItems((current) =>
        current.map((item) =>
          item.readAt || item.sticky ? item : { ...item, readAt },
        ),
      );
      setUnreadCount(
        items.filter((item) => item.sticky && !item.readAt).length,
      );
    } catch {
      setActionError('Could not mark notifications read.');
    }
  };

  const removeOne = async (id: string) => {
    try {
      await removeNotification(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setActionError('Could not remove the notification.');
    }
  };

  const clearRead = async () => {
    try {
      await clearReadNotifications();
      setItems((current) => current.filter((item) => !item.readAt));
    } catch {
      setActionError('Could not clear read notifications.');
    }
  };

  const hasRead = items.some((item) => item.readAt);

  if (hydrated && !user) {
    return (
      <ViewShell title="Notifications" classes={{ root: 'px-0 pt-0' }}>
        <PageEmpty
          icon="inbox"
          title="Sign in to see your notifications"
          description="New followers, releases from artists you follow, replies and payouts show up here."
          action={
            <Button onClick={() => useAuthModalStore.getState().open('login')}>
              Sign in
            </Button>
          }
        />
      </ViewShell>
    );
  }

  return (
    <ViewShell title="Notifications" classes={{ root: 'px-0 pt-0' }}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-foreground-secondary text-sm">
            {unreadCount === 0 ? 'All caught up' : `${unreadCount} unread`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={unreadCount === 0}
              onClick={() => void markAllRead()}
            >
              Mark all read
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!hasRead}
              onClick={() => void clearRead()}
            >
              Clear read
            </Button>
          </div>
        </div>
        {actionError ? (
          <p role="alert" className="text-accent-red-strong text-sm">
            {actionError}
          </p>
        ) : null}
        {error && items.length === 0 ? (
          <PageError
            title="Could not load notifications"
            description={error}
            onRetry={() => void load()}
          />
        ) : !loading && items.length === 0 ? (
          <PageEmpty
            icon="inbox"
            title="No notifications yet"
            description="Follow artists and join the conversation; what happens shows up here."
          />
        ) : (
          <ul className="flex flex-col gap-2" aria-label="Notifications">
            {items.map((notification) => {
              const unread = !notification.readAt;
              const needsAck = notification.sticky && unread;
              return (
                <li
                  key={notification.id}
                  className={cn(
                    'border-border flex items-start gap-3 rounded-lg border p-3 text-sm',
                    unread ? 'bg-accent-cyan/10' : 'bg-background',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    {needsAck ? (
                      <Badge variant="pill" color="yellow" className="mb-1">
                        Needs acknowledgement
                      </Badge>
                    ) : null}
                    {notification.url ? (
                      <Link
                        to={notification.url}
                        className="block hover:underline"
                        onClick={() => {
                          if (unread && !notification.sticky) {
                            void markRead(notification.id);
                          }
                        }}
                      >
                        <NotificationText notification={notification} />
                      </Link>
                    ) : (
                      <NotificationText notification={notification} />
                    )}
                    <time
                      dateTime={notification.createdAt}
                      className="text-foreground-secondary mt-1 block text-xs"
                    >
                      {formatWhen(notification.createdAt)}
                    </time>
                  </div>
                  {needsAck ? (
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => void markRead(notification.id)}
                    >
                      Acknowledge
                    </Button>
                  ) : unread ? (
                    <Button
                      size="xs"
                      variant="text"
                      aria-label={`Mark read: ${notification.title}`}
                      onClick={() => void markRead(notification.id)}
                    >
                      Mark read
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="text"
                      aria-label={`Remove: ${notification.title}`}
                      onClick={() => void removeOne(notification.id)}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {hasMore ? (
          <Button
            variant="secondary"
            size="sm"
            className="self-center"
            disabled={loadingOlder}
            onClick={() => void loadOlder()}
          >
            {loadingOlder ? 'Loading…' : 'Show older'}
          </Button>
        ) : null}
      </div>
    </ViewShell>
  );
}
