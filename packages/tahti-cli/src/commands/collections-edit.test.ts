import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEST_CONFIG } from '../test-helpers';
import {
  runCollectionsAdd,
  runCollectionsRemove,
} from './collections-edit.mjs';

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

const COLLECTION = {
  name: 'Late Night',
  slug: 'late-night',
  items: [
    { id: 'ci_1', sound: { title: 'Night Drive' } },
    { id: 'ci_2', release: { title: 'Afterhours EP' } },
  ],
};

describe('runCollectionsAdd', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds each sound and the release, one request each', async () => {
    const fetchMock = mockResponses(
      { status: 201, body: { id: 'ci_3' } },
      { status: 409, body: { error: 'Already in this playlist' } },
      { status: 201, body: { id: 'ci_4' } },
    );
    const result = await runCollectionsAdd(
      TEST_CONFIG,
      'late-night',
      ['s_1', 's_2'],
      { release: 'r_1' },
    );
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('already there');
    expect(fetchMock.mock.calls.map((call) => call[1].body)).toEqual([
      JSON.stringify({ soundId: 's_1' }),
      JSON.stringify({ soundId: 's_2' }),
      JSON.stringify({ releaseId: 'r_1' }),
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.test/api/me/collections/late-night/items',
    );
  });

  it('keeps going after a failed item and exits with 1', async () => {
    mockResponses(
      { status: 400, body: { error: 'Sound item not found' } },
      { status: 201, body: { id: 'ci_3' } },
    );
    const result = await runCollectionsAdd(TEST_CONFIG, 'late-night', [
      'nope',
      's_1',
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('failed: Sound item not found');
    expect(result.output).toContain('added');
  });

  it('stops when the collection does not exist', async () => {
    const fetchMock = mockResponses({
      status: 404,
      body: { error: 'Collection not found' },
    });
    await expect(
      runCollectionsAdd(TEST_CONFIG, 'nope', ['s_1', 's_2']),
    ).rejects.toThrow('Collection not found');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('needs something to add', async () => {
    await expect(
      runCollectionsAdd(TEST_CONFIG, 'late-night', []),
    ).rejects.toThrow('at least one sound id');
  });
});

describe('runCollectionsRemove', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('removes the item at the number shown by collections show', async () => {
    const fetchMock = mockResponses(
      { status: 200, body: COLLECTION },
      { status: 204 },
    );
    expect(await runCollectionsRemove(TEST_CONFIG, 'late-night', '2')).toBe(
      'Removed #2 "Afterhours EP" from "Late Night".',
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://api.example.test/api/me/collections/late-night/items/ci_2',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('rejects a number past the end', async () => {
    mockResponses({ status: 200, body: COLLECTION });
    await expect(
      runCollectionsRemove(TEST_CONFIG, 'late-night', '3'),
    ).rejects.toThrow('has 2 items; there is no #3');
    await expect(
      runCollectionsRemove(TEST_CONFIG, 'late-night', 'x'),
    ).rejects.toThrow('Invalid item number');
  });
});
