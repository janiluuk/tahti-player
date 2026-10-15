import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { runMessagesList, runMessagesSend } from './messages.mjs';

const CONVERSATIONS = [
  {
    id: 'c_1',
    otherUser: {
      username: 'aurora',
      displayName: 'aurora@example.com',
      avatarUrl: null,
    },
    lastMessage: {
      body: 'Loved the set last night,\nthe second hour especially. When is the next one going to be?',
      senderUsername: 'aurora',
      createdAt: '2026-10-14T09:00:00.000Z',
    },
    unreadCount: 2,
    updatedAt: '2026-10-14T09:00:00.000Z',
  },
  {
    id: 'c_2',
    otherUser: {
      username: 'gone',
      displayName: 'Gone',
      avatarUrl: null,
      available: false,
    },
    lastMessage: null,
    unreadCount: 0,
    updatedAt: '2026-09-01T09:00:00.000Z',
  },
];

describe('runMessagesList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists conversations with the unread total', async () => {
    mockFetchJson(CONVERSATIONS);
    const output = await runMessagesList(TEST_CONFIG);
    expect(output).toContain('aurora: Loved the set last night, the second');
    expect(output).toContain('…');
    expect(output).not.toContain('@example.com');
    expect(output).toContain('gone (unavailable)');
    expect(output).toMatch(/2 unread\.$/);
  });

  it('says when there are none', async () => {
    mockFetchJson([]);
    expect(await runMessagesList(TEST_CONFIG)).toBe('No conversations yet.');
  });
});

describe('runMessagesSend', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('finds or starts the conversation, then sends', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ conversationId: 'c_1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'msg_1' }),
      });
    vi.stubGlobal('fetch', fetchMock);
    expect(
      await runMessagesSend(TEST_CONFIG, '@aurora', ['see', 'you', 'there']),
    ).toBe('Sent to @aurora.');
    expect(fetchMock.mock.calls[0][1].body).toBe(
      JSON.stringify({ username: 'aurora' }),
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://api.example.test/api/me/messages/conversations/c_1/messages',
    );
    expect(fetchMock.mock.calls[1][1].body).toBe(
      JSON.stringify({ body: 'see you there' }),
    );
  });

  it('says plainly when the account cannot be messaged', async () => {
    mockFetchJson(
      {
        error: 'This account is no longer available',
        code: 'recipient_unavailable',
      },
      403,
    );
    await expect(runMessagesSend(TEST_CONFIG, 'gone', ['hi'])).rejects.toThrow(
      /^This account is no longer available$/,
    );
  });

  it('needs a username and a message', async () => {
    await expect(runMessagesSend(TEST_CONFIG, 'aurora', [])).rejects.toThrow(
      'Give a username and a message',
    );
  });
});
