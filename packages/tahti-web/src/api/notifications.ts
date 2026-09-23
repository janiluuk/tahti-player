/** Mock-mode dismissals that survive reload within this browser (not just
 * one tab). Without this, forceMock dismissNotification is a no-op and the
 * other mock fixtures reappear on every reload. */
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
  type FetchMeta,
} from './mode';
import { requestJson } from './request-json';

const MOCK_DISMISSED_KEY = 'tahti-web-mock-notifications-dismissed';

function readMockDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(MOCK_DISMISSED_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? new Set(parsed.filter((id): id is string => typeof id === 'string'))
      : new Set();
  } catch {
    return new Set();
  }
}

function writeMockDismissedIds(ids: Set<string>) {
  try {
    localStorage.setItem(MOCK_DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

function dismissMockNotification(id: string) {
  const ids = readMockDismissedIds();
  ids.add(id);
  writeMockDismissedIds(ids);
}

export type TahtiNotification = {
  id: string;
  type: string;
  actor: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  title: string;
  body: string | null;
  url: string | null;
  readAt: string | null;
  sticky: boolean;
  createdAt: string;
};

function emptyMeta(err: unknown): FetchMeta {
  return allowMockFallback() ? failMeta(err) : apiErrorMeta(err);
}

function mockNotifications(includeInboxExtras: boolean): TahtiNotification[] {
  // No sticky fixture: the real API type exists in ../tahti-org, but
  // mock-only sticky toasts re-appeared every session and got confused
  // with real notifications. (See Storybook for a sticky example.)
  const items: TahtiNotification[] = [];
  if (!includeInboxExtras) {
    return items;
  }
  const dismissed = readMockDismissedIds();
  const extras: TahtiNotification[] = [
    {
      id: 'notification-mock-1',
      type: 'FAN',
      actor: {
        username: 'midnight-cartography',
        displayName: 'Midnight Cartography',
        avatarUrl: null,
      },
      title: 'New fan',
      body: 'Midnight Cartography started following your channel.',
      url: '/u/midnight-cartography',
      readAt: null,
      sticky: false,
      createdAt: new Date(Date.now() - 15 * 60_000).toISOString(),
    },
    {
      id: 'notification-mock-2',
      type: 'EVENT',
      actor: null,
      title: 'Your event is coming up',
      body: 'Album release show starts tomorrow at 18:00.',
      url: '/studio/events',
      readAt: null,
      sticky: false,
      createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    },
  ];
  for (const item of extras) {
    if (!dismissed.has(item.id)) {
      items.push(item);
    }
  }
  return items;
}

export async function fetchStickyNotifications(): Promise<{
  data: TahtiNotification[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockNotifications(false),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      notifications: TahtiNotification[];
    }>('/api/me/notifications?stickyOnly=true');
    return { data: data.notifications, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: emptyMeta(err) };
  }
}

export async function fetchNotifications(): Promise<{
  data: TahtiNotification[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockNotifications(true),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      notifications: TahtiNotification[];
    }>('/api/me/notifications?limit=20');
    return { data: data.notifications, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: emptyMeta(err) };
  }
}

export async function dismissNotification(id: string): Promise<void> {
  if (isForceMock()) {
    dismissMockNotification(id);
    return;
  }
  await requestJson<void>(
    `/api/me/notifications/${encodeURIComponent(id)}/read`,
    { method: 'PATCH' },
  );
}

export async function markAllNotificationsRead(): Promise<void> {
  if (isForceMock()) {
    for (const item of mockNotifications(true)) {
      dismissMockNotification(item.id);
    }
    return;
  }
  await requestJson<void>('/api/me/notifications/read-all', {
    method: 'POST',
  });
}
