import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEST_CONFIG } from '../test-helpers';
import { runLibraryDelete } from './library-delete.mjs';

const SOUND = { id: 's_1', title: 'Night Drive', status: 'READY' };

function mockResponses(
  ...responses: Array<{ status: number; body?: unknown }>
) {
  const fetchMock = vi.fn();
  for (const { status, body } of responses) {
    fetchMock.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body ?? null,
    });
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('runLibraryDelete', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('names the sound and refuses without --yes', async () => {
    const fetchMock = mockResponses({ status: 200, body: SOUND });
    await expect(runLibraryDelete(TEST_CONFIG, 's_1')).rejects.toThrow(
      'This deletes "Night Drive" (s_1)',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('deletes with --yes', async () => {
    const fetchMock = mockResponses(
      { status: 200, body: SOUND },
      { status: 204 },
    );
    expect(await runLibraryDelete(TEST_CONFIG, 's_1', { yes: true })).toBe(
      'Deleted "Night Drive" (s_1).',
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://api.example.test/api/me/sound/s_1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('shows why the API refused', async () => {
    mockResponses(
      { status: 200, body: SOUND },
      {
        status: 409,
        body: {
          error:
            'This item has a linked Mixcloud upload — disconnect that first, then delete.',
        },
      },
    );
    await expect(
      runLibraryDelete(TEST_CONFIG, 's_1', { yes: true }),
    ).rejects.toThrow('linked Mixcloud upload');
  });

  it('stops at an unknown id before deleting anything', async () => {
    const fetchMock = mockResponses({
      status: 404,
      body: { error: 'Sound item not found' },
    });
    await expect(
      runLibraryDelete(TEST_CONFIG, 'nope', { yes: true }),
    ).rejects.toThrow('Sound item not found');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('needs an id', async () => {
    await expect(runLibraryDelete(TEST_CONFIG, undefined)).rejects.toThrow(
      'Missing sound id',
    );
  });
});
