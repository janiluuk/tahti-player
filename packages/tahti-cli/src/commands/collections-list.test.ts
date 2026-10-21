import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchJson, TEST_CONFIG } from '../test-helpers';
import {
  formatCollectionsTable,
  runCollectionsList,
} from './collections-list.mjs';

const MIX = {
  id: 'c_1',
  slug: 'night-mixes',
  name: 'Night Mixes',
  type: 'MIX_SERIES',
  isPublic: true,
  createdAt: '2026-09-01T10:00:00.000Z',
  _count: { items: 4 },
};
const DRAFTS = {
  ...MIX,
  id: 'c_2',
  slug: 'drafts',
  name: 'Drafts',
  type: 'CUSTOM',
  isPublic: false,
  _count: { items: 0 },
};

describe('formatCollectionsTable', () => {
  it('renders slug, name, type, visibility, item count and date', () => {
    const lines = formatCollectionsTable([MIX, DRAFTS]).split('\n');
    expect(lines[0]).toBe(
      'SLUG         NAME         TYPE        VISIBILITY  ITEMS  CREATED',
    );
    expect(lines[1]).toBe(
      'night-mixes  Night Mixes  MIX_SERIES  public      4      2026-09-01',
    );
    expect(lines[2]).toBe(
      'drafts       Drafts       CUSTOM      private     0      2026-09-01',
    );
  });
});

describe('runCollectionsList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls GET /api/me/collections', async () => {
    const fetchMock = mockFetchJson([MIX]);
    expect(await runCollectionsList(TEST_CONFIG)).toContain('Night Mixes');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/me/collections',
      expect.anything(),
    );
  });

  it('says so when there are none', async () => {
    mockFetchJson([]);
    expect(await runCollectionsList(TEST_CONFIG)).toBe('No collections yet.');
  });

  it('prints the API response unchanged with --json', async () => {
    mockFetchJson([MIX]);
    expect(
      JSON.parse(await runCollectionsList(TEST_CONFIG, { json: true })),
    ).toEqual([MIX]);
  });
});
