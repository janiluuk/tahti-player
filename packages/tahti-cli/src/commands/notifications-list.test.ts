import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import {
  formatNotificationsTable,
  runNotificationsList,
} from './notifications-list.mjs';

const UNREAD = {
  id: 'n_1',
  type: 'NEW_FOLLOWER',
  title: 'nightowl followed you',
  body: null,
  url: '/u/nightowl',
  readAt: null,
  sticky: false,
  createdAt: '2026-10-14T09:00:00.000Z',
  actor: { username: 'nightowl', displayName: 'Night Owl', avatarUrl: null },
};
const READ = {
  ...UNREAD,
  id: 'n_2',
  type: 'SOUND_LIKED',
  title: 'someone loved Drive',
  readAt: '2026-10-13T10:00:00.000Z',
  createdAt: '2026-10-13T08:00:00.000Z',
  actor: { username: 'fan2', displayName: 'fan2@example.com', avatarUrl: null },
};

function page(notifications: unknown[], extra: Record<string, unknown> = {}) {
  return { notifications, unreadCount: 1, hasMore: false, ...extra };
}

describe('formatNotificationsTable', () => {
  it('marks unread rows and never shows an email as the sender', () => {
    const lines = formatNotificationsTable([UNREAD, READ]).split('\n');
    expect(lines[0]).toBe(
      'ID   NEW  DATE        TYPE          FROM       TITLE',
    );
    expect(lines[1]).toBe(
      'n_1  *    2026-10-14  NEW_FOLLOWER  Night Owl  nightowl followed you',
    );
    expect(lines[2]).toBe(
      'n_2  -    2026-10-13  SOUND_LIKED   fan2       someone loved Drive',
    );
  });
});

describe('runNotificationsList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls GET /api/me/notifications with the limit', async () => {
    const fetchMock = mockFetchJson(page([UNREAD]));
    const output = await runNotificationsList(TEST_CONFIG, { limit: '5' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/notifications?limit=5',
      expect.anything(),
    );
    expect(output).toContain('1 unread.');
  });

  it('rejects a limit above 50', async () => {
    await expect(
      runNotificationsList(TEST_CONFIG, { limit: '51' }),
    ).rejects.toThrow('--limit');
  });

  it('shows only unread rows with --unread', async () => {
    mockFetchJson(page([UNREAD, READ]));
    const output = await runNotificationsList(TEST_CONFIG, { unread: true });
    expect(output).toContain('n_1');
    expect(output).not.toContain('n_2');
  });

  it('says so when nothing is unread', async () => {
    mockFetchJson(page([READ], { unreadCount: 0 }));
    expect(await runNotificationsList(TEST_CONFIG, { unread: true })).toBe(
      'No unread notifications.',
    );
  });

  it('points at --limit when older notifications exist', async () => {
    mockFetchJson(page([UNREAD], { hasMore: true }));
    expect(await runNotificationsList(TEST_CONFIG)).toContain('raise --limit');
  });

  it('prints the API response unchanged with --json', async () => {
    const body = page([UNREAD]);
    mockFetchJson(body);
    expect(
      JSON.parse(await runNotificationsList(TEST_CONFIG, { json: true })),
    ).toEqual(body);
  });
});
