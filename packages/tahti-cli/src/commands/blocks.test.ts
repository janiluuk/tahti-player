import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { runBlocksAdd, runBlocksList, runBlocksRemove } from './blocks.mjs';

describe('blocks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists blocked accounts without emails', async () => {
    mockFetchJson({
      blocked: [
        {
          username: 'spammer',
          displayName: 'spam@example.com',
          avatarUrl: null,
          blockedAt: '2026-10-10T08:00:00.000Z',
        },
      ],
    });
    const output = await runBlocksList(TEST_CONFIG);
    expect(output).toContain('spammer');
    expect(output).toContain('2026-10-10');
    expect(output).not.toContain('@example.com');
  });

  it('says when the list is empty', async () => {
    mockFetchJson({ blocked: [] });
    expect(await runBlocksList(TEST_CONFIG)).toBe(
      'You have not blocked anyone.',
    );
  });

  it('blocks by username, with or without @', async () => {
    const fetchMock = mockFetchJson({ username: 'spammer' }, 201);
    expect(await runBlocksAdd(TEST_CONFIG, '@spammer')).toContain(
      'Blocked @spammer.',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/blocks',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'spammer' }),
      }),
    );
  });

  it('shows why a block was refused', async () => {
    mockFetchJson({ error: 'You cannot block yourself' }, 400);
    await expect(runBlocksAdd(TEST_CONFIG, 'me')).rejects.toThrow(
      'You cannot block yourself',
    );
  });

  it('unblocks with DELETE', async () => {
    const fetchMock = mockFetchJson(null, 204);
    expect(await runBlocksRemove(TEST_CONFIG, 'spammer')).toContain(
      'Unblocked @spammer.',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/blocks/spammer',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('needs a username', async () => {
    await expect(runBlocksAdd(TEST_CONFIG, ' @ ')).rejects.toThrow(
      'Missing username',
    );
    await expect(runBlocksRemove(TEST_CONFIG, undefined)).rejects.toThrow(
      'Missing username',
    );
  });
});
