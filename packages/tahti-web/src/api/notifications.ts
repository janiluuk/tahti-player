/** Mock-mode dismissals that survive reload within this browser (not just
 * one tab). Without this, forceMock dismissNotification is a no-op and the
 * other mock fixtures reappear on every reload. */
import { mockFixture } from './mock-overrides';
import {
  allowMockFallback,
  apiErrorMeta,
  isForceMock,
  mockFallbackMeta,
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
  return allowMockFallback() ? mockFallbackMeta(err) : apiErrorMeta(err);
}

function mockNotifications(includeInboxExtras: boolean): TahtiNotification[] {
  return mockFixture(
    'notifications',
    buildMockNotifications(includeInboxExtras),
    includeInboxExtras,
  );
}

const MOCK_STICKY_NOTIFICATION_ID = 'notification-mock-sticky-policy';

function buildMockNotifications(
  includeInboxExtras: boolean,
): TahtiNotification[] {
  const dismissed = readMockDismissedIds();
  const items: TahtiNotification[] = [];
  const sticky: TahtiNotification = {
    id: MOCK_STICKY_NOTIFICATION_ID,
    type: 'POLICY',
    actor: null,
    title: 'Review the updated community guidelines',
    body: 'Acknowledge once you have read the summary — it stays out of the way after that.',
    url: '/help/community',
    readAt: null,
    sticky: true,
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
  };
  if (!dismissed.has(sticky.id)) {
    items.push(sticky);
  }
  if (!includeInboxExtras) {
    return items;
  }
  const extras: TahtiNotification[] = [
    {
      id: 'notification-mock-1',
      type: 'NEW_FOLLOWER',
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
      type: 'NEW_EVENT',
      actor: null,
      title: 'Your event is coming up',
      body: 'Album release show starts tomorrow at 18:00.',
      url: '/studio/events',
      readAt: null,
      sticky: false,
      createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    },
    {
      id: 'notification-mock-event-tag',
      type: 'EVENT_TAGGED',
      actor: null,
      title: 'Kaiku Collective tagged you on an event',
      body: 'Kaiku Collective night · Vanha Kutomo, Turku, Finland',
      url: '/studio/events?tab=invites',
      readAt: null,
      sticky: false,
      createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    },
    {
      id: 'notification-mock-group-request',
      type: 'GROUP_JOIN_REQUESTED',
      actor: { username: 'needle', displayName: 'Needle', avatarUrl: null },
      title: 'New request to join your group',
      body: 'Someone asked to join Trance Mixes and DJ Sets.',
      url: '/studio/groups/trance-mixes',
      readAt: null,
      sticky: false,
      createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    },
    {
      id: 'notification-mock-party',
      type: 'LISTENING_PARTY_SCHEDULED',
      actor: {
        username: 'northern-lights',
        displayName: 'Northern Lights',
        avatarUrl: null,
      },
      title: 'Northern Lights scheduled a listening party',
      body: '"Polar Static" · in two days',
      url: '/party/lp-mock-scheduled',
      readAt: null,
      sticky: false,
      createdAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
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

export const NOTIFICATION_PAGE_SIZE = 20;

/** Inbox filters, as tahti-org groups them (`?kind=`, NOTIFICATION_KIND_TYPES
 * in `@tahti/shared`); `other` is every type outside the named groups. */
export const NOTIFICATION_KINDS = [
  { id: 'social', label: 'Social' },
  { id: 'music', label: 'Music' },
  { id: 'money', label: 'Money' },
  { id: 'governance', label: 'Governance' },
  { id: 'other', label: 'Other' },
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number]['id'];

const NOTIFICATION_KIND_TYPES: Record<
  Exclude<NotificationKind, 'other'>,
  readonly string[]
> = {
  social: [
    'NEW_FOLLOWER',
    'NEW_LIKE',
    'NEW_REPOST',
    'NEW_COMMENT',
    'NEW_MESSAGE',
    'CHAT_MENTION',
    'PLAYLIST_TRACK_ADDED',
    'MODERATOR_ADDED',
    'TRACK_SHARED',
    'GREEN_ROOM_INVITE',
    'GROUP_JOIN_REQUESTED',
    'GROUP_JOIN_RESOLVED',
    'GROUP_SUBMISSION_RECEIVED',
    'GROUP_SUBMISSION_RESOLVED',
    'GROUP_MEMBER_REMOVED',
    'GROUP_ROLE_CHANGED',
    'GROUP_DELETED',
  ],
  music: [
    'NEW_POST',
    'NEW_TRACK',
    'NEW_RELEASE',
    'NEW_EVENT',
    'EVENT_TAGGED',
    'CHANNEL_LIVE',
    'STREAMING_COPY_READY',
    'RADIO_SUBMISSION_REJECTED',
    'RADIO_SUBMISSION_ACCEPTED',
    'RADIO_STATION_REVIEWED',
    'TRACK_EDITED_BY_BOARD',
    'CHANNEL_FORCED_OFFLINE',
    'VENUE_VERIFIED',
    'VENUE_SHOW_BOOKED',
    'VENUE_SHOW_CANCELED',
    'TAHTI_SELECTS_PICK',
    'TAHTI_RADIO_INCLUSION_CHANGED',
    'BACKGROUND_JOB_DONE',
    'BACKGROUND_JOB_FAILED',
    'THEME_UNDER_REVIEW',
    'THEME_APPROVED',
    'THEME_REJECTED',
    'LISTENING_PARTY_SCHEDULED',
    'LISTENING_PARTY_STARTING',
    'LISTENING_PARTY_CHANGED',
  ],
  money: [
    'NEW_FAN_SUBSCRIBER',
    'NEW_PURCHASE',
    'PAYOUT_SENT',
    'FAN_SUB_PAYMENT_FAILED',
    'FAN_SUB_EXPIRED',
    'FAN_SUB_CANCELED',
    'GRANT_AWARDED',
    'MEMBERSHIP_ENDED',
  ],
  governance: [
    'MOTION_OPENED',
    'MOTION_RESULT',
    'MOTION_SECONDED',
    'MOTION_COMMENT',
    'MOTION_CIRCULATED',
    'CORRECTION_RESOLVED',
    'ELECTION_OPENED',
    'ELECTION_RESULT',
    'FEATURE_REQUEST_UPDATED',
    'DISCUSSION_REPLY',
    'DISCUSSION_OPENED',
    'DISCUSSION_CLOSED',
    'DISCUSSION_MENTION',
  ],
};

/** The filter a notification type falls under (tahti-org
 * `notificationKindOf`); anything outside the named groups is `other`. */
export function notificationKindOf(type: string): NotificationKind {
  for (const [kind, types] of Object.entries(NOTIFICATION_KIND_TYPES)) {
    if (types.includes(type)) {
      return kind as NotificationKind;
    }
  }
  return 'other';
}

/** One page of the inbox, newest first. `before` is the id of the oldest
 * notification already shown, to read the page after it. */
export async function fetchNotifications(
  before?: string,
  kind?: NotificationKind,
): Promise<{
  data: TahtiNotification[];
  unreadCount: number;
  hasMore: boolean;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const data = before || kind ? [] : mockNotifications(true);
    return {
      data,
      unreadCount: data.filter((item) => !item.readAt).length,
      hasMore: false,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const params = new URLSearchParams({
      limit: String(NOTIFICATION_PAGE_SIZE),
    });
    if (before) {
      params.set('before', before);
    }
    if (kind) {
      params.set('kind', kind);
    }
    const { data } = await requestJson<{
      notifications: TahtiNotification[];
      unreadCount: number;
      hasMore?: boolean;
    }>(`/api/me/notifications?${params.toString()}`);
    return {
      data: data.notifications,
      unreadCount: data.unreadCount,
      hasMore: data.hasMore ?? false,
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], unreadCount: 0, hasMore: false, meta: emptyMeta(err) };
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

/** Removes one notification (tahti-org `DELETE /api/me/notifications/:id`).
 * An unacknowledged sticky notice can't be removed; the API answers 409. */
export async function removeNotification(id: string): Promise<void> {
  if (isForceMock()) {
    dismissMockNotification(id);
    return;
  }
  await requestJson<void>(`/api/me/notifications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/** Removes every notification already read; returns how many went. */
export async function clearReadNotifications(): Promise<number> {
  if (isForceMock()) {
    const read = mockNotifications(true).filter((item) => item.readAt);
    for (const item of read) {
      dismissMockNotification(item.id);
    }
    return read.length;
  }
  const { data } = await requestJson<{ removed: number }>(
    '/api/me/notifications?read=true',
    { method: 'DELETE' },
  );
  return data.removed;
}

export type NotificationUnreadCounts = {
  total: number;
  byKind: Record<NotificationKind, number>;
};

/** Unread notifications per kind (tahti-org
 * `GET /api/me/notifications/unread-counts`); null when it can't be read, so
 * the filter chips simply show no counts. */
export async function fetchNotificationUnreadCounts(): Promise<NotificationUnreadCounts | null> {
  if (isForceMock()) {
    const unread = mockNotifications(true).filter((item) => !item.readAt);
    const byKind = { social: 0, music: 0, money: 0, governance: 0, other: 0 };
    for (const item of unread) {
      byKind[notificationKindOf(item.type)] += 1;
    }
    return { total: unread.length, byKind };
  }
  try {
    const { data } = await requestJson<NotificationUnreadCounts>(
      '/api/me/notifications/unread-counts',
    );
    return data;
  } catch {
    return null;
  }
}
