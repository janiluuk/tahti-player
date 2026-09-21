import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TahtiNativeLibrary } from '../../lib/nativeLibrary';
import { EMPTY_TRACK_FILTERS } from '../../lib/nativeLibrary';
import { useSelectionActions } from './useSelectionActions';

function setup(selected: string[]) {
  const library = {
    matchingIds: vi.fn().mockResolvedValue(['a', 'b', 'c', 'd']),
  } as unknown as TahtiNativeLibrary;
  const hook = renderHook(() =>
    useSelectionActions({
      library,
      query: '',
      facetFilter: null,
      sort: null,
      filters: EMPTY_TRACK_FILTERS,
      total: 4,
      browseKind: 'tracks',
      refresh: () => Promise.resolve(),
    }),
  );
  act(() => hook.result.current.setSelectedIds(new Set(selected)));
  return { library, hook };
}

async function resolvedIds(hook: ReturnType<typeof setup>['hook']) {
  act(() => hook.result.current.addSelectionToPlaylist());
  return hook.result.current.addToPlaylist!.resolve();
}

describe('useSelectionActions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not fetch every matching id to order a single selected track', async () => {
    const { library, hook } = setup(['c']);
    expect(await resolvedIds(hook)).toEqual(['c']);
    expect(library.matchingIds).not.toHaveBeenCalled();
  });

  it('orders a multi-track selection by the order the table shows', async () => {
    const { library, hook } = setup(['d', 'b']);
    expect(await resolvedIds(hook)).toEqual(['b', 'd']);
    expect(library.matchingIds).toHaveBeenCalledTimes(1);
  });

  it('resolves "all" to every matching id in shown order', async () => {
    const { hook } = setup([]);
    act(() => hook.result.current.addAllToPlaylist());
    expect(await hook.result.current.addToPlaylist!.resolve()).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('selects every matching track', async () => {
    const { hook } = setup([]);
    await act(() => hook.result.current.selectAllMatching());
    expect([...hook.result.current.selectedIds]).toEqual(['a', 'b', 'c', 'd']);
  });
});
