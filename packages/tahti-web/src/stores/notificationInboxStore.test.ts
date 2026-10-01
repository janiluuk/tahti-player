import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNotificationInboxStore } from './notificationInboxStore';

vi.mock('@tahti-player/ui', () => ({
  showNotificationToast: vi.fn(),
  toast: { dismiss: vi.fn() },
}));

function notification(
  id: string,
  minutesAgo: number,
  readAt: string | null = null,
) {
  return {
    id,
    type: 'NEW_POST',
    actor: null,
    title: `Notification ${id}`,
    body: null,
    url: null,
    readAt,
    sticky: false,
    createdAt: new Date(
      Date.UTC(2026, 9, 1, 12, 0) - minutesAgo * 60_000,
    ).toISOString(),
  };
}

function respond(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe('notificationInboxStore', () => {
  beforeEach(() => {
    useNotificationInboxStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the unread count from the API, not just the loaded page', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respond({
        notifications: [notification('a', 1), notification('b', 2)],
        unreadCount: 45,
        hasMore: true,
      }),
    );
    await useNotificationInboxStore.getState().load({ toastNew: false });
    const state = useNotificationInboxStore.getState();
    expect(state.unreadCount).toBe(45);
    expect(state.hasMore).toBe(true);
  });

  it('pages older notifications and keeps them across the next poll', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        respond({
          notifications: [notification('a', 1), notification('b', 2)],
          unreadCount: 3,
          hasMore: true,
        }),
      )
      .mockResolvedValueOnce(
        respond({
          notifications: [notification('c', 3)],
          unreadCount: 3,
          hasMore: false,
        }),
      )
      .mockResolvedValueOnce(
        respond({
          notifications: [notification('new', 0), notification('a', 1)],
          unreadCount: 4,
          hasMore: true,
        }),
      );

    const store = useNotificationInboxStore.getState();
    await store.load({ toastNew: false });
    await store.loadOlder();
    expect(String(fetchSpy.mock.calls[1]![0])).toContain('before=b');
    expect(useNotificationInboxStore.getState().items.map((n) => n.id)).toEqual(
      ['a', 'b', 'c'],
    );
    expect(useNotificationInboxStore.getState().hasMore).toBe(false);

    await store.load({ toastNew: false });
    const state = useNotificationInboxStore.getState();
    expect(state.items.map((n) => n.id)).toEqual(['new', 'a', 'b', 'c']);
    expect(state.unreadCount).toBe(4);
    expect(state.hasMore).toBe(false);
  });
});
