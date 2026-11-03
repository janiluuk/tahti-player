import { describe, expect, it, vi } from 'vitest';

import {
  fetchHearthisUserSets,
  filterSetsByTitle,
  runHearthisUserSets,
} from './hearthis-user-sets.mjs';

const page = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, i) => ({
    permalink: `${offset + i}-9675121`,
    title: `${offset + i === 0 ? 'Archive' : 'Yaniho -'}  Set ${offset + i}`,
    track_count: 3,
  }));

function fetchPages(pages: unknown[][]) {
  return vi.fn(async (url: string) => {
    const n = Number(new URL(url).searchParams.get('page'));
    return { ok: true, status: 200, json: async () => pages[n - 1] ?? [] };
  });
}

describe('hearthis user-sets', () => {
  it('reads every page until a short one', async () => {
    const fetchImpl = fetchPages([page(20), page(20, 20), page(3, 40)]);
    const result = await fetchHearthisUserSets('@yaniho', { fetchImpl });
    expect(result.user).toBe('yaniho');
    expect(result.sets).toHaveLength(43);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(result.sets[0]).toEqual({
      permalink: '0-9675121',
      title: 'Archive Set 0',
      trackCount: 3,
    });
  });

  it('filters titles case-insensitively and rejects a bad pattern', () => {
    const sets = [
      { permalink: 'a', title: 'Archive 2001-2009', trackCount: 1 },
      { permalink: 'b', title: 'Yaniho - Revitalize LP', trackCount: 1 },
    ];
    expect(filterSetsByTitle(sets, '^archive').map((s) => s.permalink)).toEqual(
      ['a'],
    );
    expect(() => filterSetsByTitle(sets, '(')).toThrow(/not a valid pattern/);
  });

  it('refuses a handle that is not a hearthis name', async () => {
    await expect(fetchHearthisUserSets('a/b')).rejects.toThrow(
      /Not a hearthis.at handle/,
    );
  });

  it('prints a table or says nothing matched', async () => {
    const fetchImpl = fetchPages([page(2)]);
    expect(await runHearthisUserSets('yaniho', { fetchImpl })).toContain(
      '2 set(s) for @yaniho.',
    );
    expect(
      await runHearthisUserSets('yaniho', {
        fetchImpl: fetchPages([page(2)]),
        match: 'nope',
      }),
    ).toBe('No sets on hearthis.at/@yaniho match "nope".');
  });
});
