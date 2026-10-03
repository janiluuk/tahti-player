import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchOlderMessages } from './messages';

describe('fetchOlderMessages', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks for the page before a message', async () => {
    const message = {
      id: 'm1',
      senderUsername: 'aino',
      senderDisplayName: 'Aino',
      senderAvatarUrl: null,
      body: 'hi',
      createdAt: '2026-10-01T10:00:00.000Z',
      isMine: false,
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'c1',
          otherUser: { username: 'aino', displayName: 'Aino', avatarUrl: null },
          messages: [message],
          hasMore: true,
        }),
        { status: 200 },
      ),
    );
    await expect(fetchOlderMessages('c1', 'm2')).resolves.toEqual({
      messages: [message],
      hasMore: true,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/messages/conversations/c1?before=m2',
    );
  });

  it('treats a missing hasMore as no more pages', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'c1', messages: [] }), {
        status: 200,
      }),
    );
    await expect(fetchOlderMessages('c1', 'm2')).resolves.toEqual({
      messages: [],
      hasMore: false,
    });
  });

  it('is null when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 500 }),
    );
    await expect(fetchOlderMessages('c1', 'm2')).resolves.toBeNull();
  });
});
