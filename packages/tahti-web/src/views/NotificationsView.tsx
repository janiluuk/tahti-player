import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  FilterChips,
  InlineError,
  ViewShell,
} from '@tahti-player/ui';

import {
  clearReadNotifications,
  dismissNotification,
  fetchNotifications,
  fetchNotificationUnreadCounts,
  markAllNotificationsRead,
  NOTIFICATION_KINDS,
  notificationKindLabel,
  removeNotification,
  type NotificationKind,
  type NotificationUnreadCounts,
  type TahtiNotification,
} from '../api/notifications';
import { ListingDate } from '../components/ListingDate';
import { PageEmpty, PageError } from '../components/PageStates';
import { cn } from '../lib/cn';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

function NotificationText({
  notification,
}: {
  notification: TahtiNotification;
}) {
  const { t } = useTranslation('web');
  return (
    <>
      {notification.type === 'BACKGROUND_JOB_FAILED' ? (
        <Badge variant="pill" color="red" className="mr-1.5 align-middle">
          {t('notificationsPage.failedBadge')}
        </Badge>
      ) : null}
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
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [items, setItems] = useState<TahtiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [kind, setKind] = useState<'all' | NotificationKind>('all');
  const kindParam = kind === 'all' ? undefined : kind;
  const [counts, setCounts] = useState<NotificationUnreadCounts | null>(null);

  const latestLoad = useRef(0);

  const load = useCallback(async () => {
    const attempt = ++latestLoad.current;
    setLoading(true);
    const result = await fetchNotifications(undefined, kindParam);
    if (attempt !== latestLoad.current) {
      return;
    }
    setItems(result.data);
    setUnreadCount(result.unreadCount);
    setHasMore(result.hasMore);
    setError(
      result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
    );
    setLoading(false);
  }, [kindParam]);

  useEffect(() => {
    if (user) {
      void load();
    }
  }, [user, load]);

  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;
    void fetchNotificationUnreadCounts().then((result) => {
      if (!cancelled) {
        setCounts(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, unreadCount]);

  const loadOlder = async () => {
    const oldest = items[items.length - 1];
    if (!oldest) {
      return;
    }
    setLoadingOlder(true);
    const result = await fetchNotifications(oldest.id, kindParam);
    if (result.meta.source === 'api' && result.meta.reason) {
      setActionError(t('notificationsPage.olderError'));
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
      setActionError(t('notificationsPage.markReadError'));
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
      setActionError(t('notificationsPage.markAllReadError'));
    }
  };

  const removeOne = async (id: string) => {
    try {
      await removeNotification(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setActionError(t('notificationsPage.removeError'));
    }
  };

  const clearRead = async () => {
    try {
      await clearReadNotifications();
      setItems((current) => current.filter((item) => !item.readAt));
    } catch {
      setActionError(t('notificationsPage.clearReadError'));
    }
  };

  const hasRead = items.some((item) => item.readAt);

  if (hydrated && !user) {
    return (
      <ViewShell
        title={t('notificationsPage.title')}
        classes={{ root: 'px-0 pt-0' }}
      >
        <PageEmpty
          icon="inbox"
          title={t('notificationsPage.signInTitle')}
          description={t('notificationsPage.signInDescription')}
          action={
            <Button onClick={() => useAuthModalStore.getState().open('login')}>
              {t('actions.signIn')}
            </Button>
          }
        />
      </ViewShell>
    );
  }

  return (
    <ViewShell
      title={t('notificationsPage.title')}
      classes={{ root: 'px-0 pt-0' }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-foreground-secondary text-sm">
            {unreadCount === 0
              ? t('notificationsPage.allCaughtUp')
              : t('notificationsPage.unreadCount', { count: unreadCount })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={unreadCount === 0}
              onClick={() => void markAllRead()}
            >
              {t('notificationsPage.markAllRead')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!hasRead}
              onClick={() => void clearRead()}
            >
              {t('notificationsPage.clearRead')}
            </Button>
          </div>
        </div>
        <FilterChips
          items={[
            { id: 'all', label: t('notificationsPage.filterAll') },
            ...NOTIFICATION_KINDS.map((item) => {
              const unread = counts?.byKind[item.id] ?? 0;
              const kindLabels = {
                social: t('notificationsPage.kindSocial'),
                music: t('notificationsPage.kindMusic'),
                money: t('notificationsPage.kindMoney'),
                governance: t('notificationsPage.kindGovernance'),
                other: t('notificationsPage.kindOther'),
              } as const;
              const label = kindLabels[item.id];
              return {
                id: item.id,
                label: unread > 0 ? `${label} (${unread})` : label,
              };
            }),
          ]}
          selected={kind}
          onChange={(id) => setKind(id as 'all' | NotificationKind)}
          aria-label={t('notificationsPage.filterAria')}
        />
        {actionError ? <InlineError>{actionError}</InlineError> : null}
        {error && items.length === 0 ? (
          <PageError
            title={t('notificationsPage.loadError')}
            description={error}
            onRetry={() => void load()}
          />
        ) : !loading && items.length === 0 ? (
          kind === 'all' ? (
            <PageEmpty
              icon="inbox"
              title={t('notificationsPage.emptyTitle')}
              description={t('notificationsPage.emptyDescription')}
            />
          ) : (
            <PageEmpty
              icon="inbox"
              title={t('notificationsPage.emptyKindTitle')}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setKind('all')}
                >
                  {t('notificationsPage.showAll')}
                </Button>
              }
            />
          )
        ) : (
          <ul
            className="flex flex-col gap-2"
            aria-label={t('notificationsViewText.notifications')}
          >
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
                        {t('notificationsPage.needsAck')}
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
                    <p className="text-foreground-secondary mt-1 flex flex-wrap items-center gap-x-1 text-xs">
                      {kind === 'all' ? (
                        <span>
                          {notificationKindLabel(notification.type)} ·
                        </span>
                      ) : null}
                      <ListingDate value={notification.createdAt} />
                    </p>
                  </div>
                  {needsAck ? (
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => void markRead(notification.id)}
                    >
                      {t('notificationsPage.acknowledge')}
                    </Button>
                  ) : unread ? (
                    <Button
                      size="xs"
                      variant="text"
                      aria-label={t('notificationsPage.markReadAria', {
                        title: notification.title,
                      })}
                      onClick={() => void markRead(notification.id)}
                    >
                      {t('notificationsPage.markRead')}
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="text"
                      aria-label={t('notificationsPage.removeAria', {
                        title: notification.title,
                      })}
                      onClick={() => void removeOne(notification.id)}
                    >
                      {t('notificationsPage.remove')}
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
