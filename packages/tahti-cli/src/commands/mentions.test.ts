import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { runMentions } from './mentions.mjs';

const MENTIONS = {
  mentions: [
    {
      id: 'm_1',
      surface: 'TRACKLIST',
      createdAt: '2026-10-12T21:00:00.000Z',
      mentioner: {
        username: 'djkari',
        displayName: 'kari@example.com',
        avatarUrl: null,
      },
      sourceTitle: 'Friday Night Mix',
      sourceUrl: '/u/djkari/friday-night-mix',
    },
    {
      id: 'm_2',
      surface: 'SOMETHING_NEW',
      createdAt: '2026-10-11T10:00:00.000Z',
      mentioner: { username: 'aurora', displayName: 'Aurora', avatarUrl: null },
      sourceTitle: null,
      sourceUrl: '/u/aurora',
    },
  ],
};

describe('runMentions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists who mentioned you and where', async () => {
    const fetchMock = mockFetchJson(MENTIONS);
    const output = await runMentions(TEST_CONFIG, { limit: '5' });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/me/mentions?limit=5',
    );
    expect(output).toContain('djkari');
    expect(output).not.toContain('@example.com');
    expect(output).toContain('tracklist');
    expect(output).toContain('Friday Night Mix');
    expect(output).toContain('post');
    expect(output).toContain('/u/aurora');
  });

  it('says when there are none', async () => {
    mockFetchJson({ mentions: [] });
    expect(await runMentions(TEST_CONFIG)).toBe(
      'Nobody has mentioned you yet.',
    );
  });

  it('rejects a --limit over 50', async () => {
    await expect(runMentions(TEST_CONFIG, { limit: '51' })).rejects.toThrow(
      'Invalid --limit',
    );
  });
});
