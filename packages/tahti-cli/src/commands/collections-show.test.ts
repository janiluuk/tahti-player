import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import { formatCollection, runCollectionsShow } from './collections-show.mjs';

const COLLECTION = {
  id: 'c_1',
  slug: 'night-mixes',
  name: 'Night Mixes',
  description: 'Late sets',
  type: 'MIX_SERIES',
  isPublic: true,
  collaborative: true,
  createdAt: '2026-09-01T10:00:00.000Z',
  items: [
    {
      id: 'i_1',
      sound: {
        id: 's_1',
        title: 'Harbour',
        durationSec: 245,
        artist: { username: 'kaski', displayName: 'DJ Kaski' },
      },
      release: null,
      audioUrl: 'https://storage.example.test/signed',
    },
    {
      id: 'i_2',
      sound: {
        id: 's_2',
        title: 'Gone Quiet',
        durationSec: 60,
        artist: { username: 'guest', displayName: 'guest@example.com' },
      },
      release: null,
      unavailable: true,
      audioUrl: null,
    },
    { id: 'i_3', sound: null, release: { id: 'r_1', title: 'First EP' } },
    { id: 'i_4', sound: null, release: null },
  ],
};

describe('formatCollection', () => {
  it('prints the details and one row per item without signed URLs or emails', () => {
    const output = formatCollection(COLLECTION);
    expect(output).toContain('Collaborative  yes');
    expect(output).toContain('Description    Late sets');
    const rows = output.split('\n').slice(-5);
    expect(rows[0]).toBe('#  TITLE       ARTIST    KIND     LENGTH  NOTE');
    expect(rows[1]).toBe('1  Harbour     DJ Kaski  track    4:05    -');
    expect(rows[2]).toBe(
      '2  Gone Quiet  guest     track    1:00    no longer public',
    );
    expect(rows[3]).toBe('3  First EP    -         release  -       -');
    expect(rows[4]).toBe(
      '4  -           -         removed  -       deleted since it was added',
    );
    expect(output).not.toContain('signed');
    expect(output).not.toContain('@');
  });

  it('says when the collection is empty', () => {
    expect(formatCollection({ ...COLLECTION, items: [] })).toContain(
      'No items yet.',
    );
  });
});

describe('runCollectionsShow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls GET /api/me/collections/:slug', async () => {
    const fetchMock = mockFetchJson(COLLECTION);
    await runCollectionsShow(TEST_CONFIG, 'night mixes');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/collections/night%20mixes',
      expect.anything(),
    );
  });

  it('needs a slug', async () => {
    await expect(runCollectionsShow(TEST_CONFIG, undefined)).rejects.toThrow(
      'Missing collection slug',
    );
  });

  it('shows the API message for an unknown slug', async () => {
    mockFetchJson({ error: 'Collection not found' }, 404);
    await expect(runCollectionsShow(TEST_CONFIG, 'nope')).rejects.toThrow(
      'Collection not found',
    );
  });

  it('prints the API response unchanged with --json', async () => {
    mockFetchJson(COLLECTION);
    expect(
      JSON.parse(
        await runCollectionsShow(TEST_CONFIG, 'night-mixes', { json: true }),
      ),
    ).toEqual(COLLECTION);
  });
});
