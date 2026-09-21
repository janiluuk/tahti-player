import { describe, expect, it, vi } from 'vitest';

import {
  EMPTY_TRACK_FILTERS,
  withReadCache,
  type TahtiNativeLibrary,
} from './nativeLibrary';

function baseLibrary(overrides: Partial<TahtiNativeLibrary> = {}) {
  return {
    list: vi.fn().mockResolvedValue({ tracks: [], total: 0 }),
    listUnavailable: vi.fn().mockResolvedValue([]),
    listRoots: vi.fn().mockResolvedValue([]),
    playlists: {},
    catalog: {},
    analysis: {
      analyze: vi.fn().mockResolvedValue({}),
      setCorrections: vi.fn().mockResolvedValue([]),
      restoreCorrections: vi.fn().mockResolvedValue(0),
      clear: vi.fn().mockResolvedValue(undefined),
    },
    facets: vi.fn().mockResolvedValue([]),
    filterOptions: vi
      .fn()
      .mockResolvedValue({ formats: [], yearMin: null, yearMax: null }),
    totals: vi
      .fn()
      .mockResolvedValue({ trackCount: 0, durationSec: 0, sizeBytes: 0 }),
    import: vi.fn().mockResolvedValue({}),
    importFolder: vi.fn().mockResolvedValue({}),
    importPaths: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue(undefined),
    removeMany: vi.fn().mockResolvedValue(0),
    rescan: vi.fn().mockResolvedValue([]),
    relink: vi.fn().mockResolvedValue(null),
    addRoot: vi.fn().mockResolvedValue(null),
    removeRoot: vi.fn().mockResolvedValue(undefined),
    rescanRoots: vi.fn().mockResolvedValue({}),
    relinkRoot: vi.fn().mockResolvedValue(null),
    resolve: vi.fn().mockResolvedValue('asset://x'),
    ...overrides,
  } as unknown as TahtiNativeLibrary;
}

describe('withReadCache', () => {
  it('serves repeated list requests from one IPC call', async () => {
    const base = baseLibrary();
    const cached = withReadCache(base);
    await Promise.all([cached.list('abc', 0), cached.list('abc', 0)]);
    await cached.list('abc', 0);
    expect(base.list).toHaveBeenCalledTimes(1);
    await cached.list('abc', 100);
    await cached.list('abd', 0);
    expect(base.list).toHaveBeenCalledTimes(3);
  });

  it('clears the cache after any catalog mutation', async () => {
    const base = baseLibrary();
    const cached = withReadCache(base);
    await cached.list('', 0);
    await cached.listRoots();
    await cached.listUnavailable();
    await cached.remove('id');
    await cached.list('', 0);
    await cached.listRoots();
    await cached.listUnavailable();
    expect(base.list).toHaveBeenCalledTimes(2);
    expect(base.listRoots).toHaveBeenCalledTimes(2);
    expect(base.listUnavailable).toHaveBeenCalledTimes(2);
  });

  it('invalidates even when the mutation fails midway', async () => {
    const base = baseLibrary({
      importPaths: vi.fn().mockRejectedValue(new Error('boom')),
    });
    const cached = withReadCache(base);
    await cached.list('', 0);
    await expect(cached.importPaths(['/x'])).rejects.toThrow('boom');
    await cached.list('', 0);
    expect(base.list).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures and never caches resolve', async () => {
    const list = vi
      .fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue({ tracks: [], total: 0 });
    const base = baseLibrary({ list });
    const cached = withReadCache(base);
    await expect(cached.list('', 0)).rejects.toThrow('down');
    await cached.list('', 0);
    expect(list).toHaveBeenCalledTimes(2);
    await cached.resolve('a');
    await cached.resolve('a');
    expect(base.resolve).toHaveBeenCalledTimes(2);
  });

  it('evicts the least recently used pages past the limit', async () => {
    const base = baseLibrary();
    const cached = withReadCache(base);
    for (let index = 0; index < 70; index += 1) {
      await cached.list(`q${index}`, 0);
    }
    await cached.list('q0', 0);
    expect(base.list).toHaveBeenCalledTimes(71);
    await cached.list('q69', 0);
    expect(base.list).toHaveBeenCalledTimes(71);
  });

  it('caches facets per kind and totals, and includes the filter in list keys', async () => {
    const base = baseLibrary();
    const cached = withReadCache(base);
    await cached.facets('artists');
    await cached.facets('artists');
    await cached.facets('genres');
    await cached.totals();
    await cached.totals();
    expect(base.facets).toHaveBeenCalledTimes(2);
    expect(base.totals).toHaveBeenCalledTimes(1);

    const filter = { kind: 'artists', value: 'A', secondary: null } as const;
    await cached.list('', 0);
    await cached.list('', 0, filter);
    await cached.list('', 0, filter);
    await cached.list('', 0, { ...filter, value: 'B' });
    expect(base.list).toHaveBeenCalledTimes(3);

    await cached.remove('id');
    await cached.facets('artists');
    await cached.totals();
    expect(base.facets).toHaveBeenCalledTimes(3);
    expect(base.totals).toHaveBeenCalledTimes(2);
  });

  it('keys list pages by sort so a re-sort never serves the old order', async () => {
    const base = baseLibrary();
    const cached = withReadCache(base);
    await cached.list('', 0, null, { column: 'artist', descending: false });
    await cached.list('', 0, null, { column: 'artist', descending: false });
    await cached.list('', 0, null, { column: 'artist', descending: true });
    await cached.list('', 0, null, null);
    expect(base.list).toHaveBeenCalledTimes(3);
  });

  it('keys list pages by filters', async () => {
    const base = baseLibrary();
    const cached = withReadCache(base);
    const a = { ...EMPTY_TRACK_FILTERS, formats: ['flac'] };
    await cached.list('', 0, null, null, a);
    await cached.list('', 0, null, null, a);
    await cached.list('', 0, null, null, { ...a, yearMin: 2000 });
    await cached.list('', 0, null, null, EMPTY_TRACK_FILTERS);
    expect(base.list).toHaveBeenCalledTimes(3);
  });
});
