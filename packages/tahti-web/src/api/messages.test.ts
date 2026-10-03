import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchOlderMessages,
  RECIPIENT_UNAVAILABLE_MESSAGE,
  sendDm,
  startConversation,
} from './messages';

const unavailable = () =>
  new Response(
    JSON.stringify({
      error: 'This account is no longer available',
      code: 'recipient_unavailable',
    }),
    { status: 403 },
  );

describe('DM send and start errors', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('flags a deleted or suspended recipient on send', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(unavailable());
    await expect(sendDm('c1', 'hi')).resolves.toEqual({
      ok: false,
      error: RECIPIENT_UNAVAILABLE_MESSAGE,
      recipientUnavailable: true,
    });
  });

  it('flags a deleted or suspended recipient on start', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(unavailable());
    await expect(startConversation('gone')).resolves.toEqual({
      ok: false,
      error: RECIPIENT_UNAVAILABLE_MESSAGE,
      recipientUnavailable: true,
    });
  });

  it('passes other errors through unchanged', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
      }),
    );
    await expect(startConversation('nobody')).resolves.toEqual({
      ok: false,
      error: 'User not found',
    });
  });
});

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
