import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
  type FetchMeta,
} from './mode';

const forceMock = isForceMock;

/** Mock-mode dismissals that survive reload within this browser session.
 * Without this, forceMock dismissNotification is a no-op and the sticky
 * "Theme is in review" fixture reappears every reload. */
const MOCK_DISMISSED_KEY = 'tahti-web-mock-notifications-dismissed';

function readMockDismissedIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(MOCK_DISMISSED_KEY);
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
    sessionStorage.setItem(MOCK_DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

function dismissMockNotification(id: string) {
  const ids = readMockDismissedIds();
  ids.add(id);
  writeMockDismissedIds(ids);
}

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
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
  const sticky: TahtiNotification = {
    id: 'notification-mock-sticky',
    type: 'THEME_UNDER_REVIEW',
    actor: null,
    title: 'Theme is in review',
    body: 'An admin will approve or reject it soon. This stays until you acknowledge it.',
    url: '/settings/themes',
    readAt: null,
    sticky: true,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  };
  const items: TahtiNotification[] = [];
  const dismissed = readMockDismissedIds();
  if (!dismissed.has(sticky.id)) {
    items.push(sticky);
  }
  if (!includeInboxExtras) {
    return items;
  }
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
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
    dismissMockNotification(id);
    return;
  }
  await requestJson<void>(
    `/api/me/notifications/${encodeURIComponent(id)}/read`,
    { method: 'PATCH' },
  );
}

export async function markAllNotificationsRead(): Promise<void> {
  if (forceMock()) {
    for (const item of mockNotifications(true)) {
      dismissMockNotification(item.id);
    }
    return;
  }
  await requestJson<void>('/api/me/notifications/read-all', {
    method: 'POST',
  });
}
