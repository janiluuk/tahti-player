import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type {
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';
import { EMPTY_TRACK_FILTERS } from '../../lib/nativeLibrary';
import { useNativeLibraryList } from './useNativeLibraryList';

const track = (id: string) => ({ id, title: id }) as NativeLibraryTrack;

function setup(list: ReturnType<typeof vi.fn>, restore = 0) {
  const library = { list } as unknown as TahtiNativeLibrary;
  return renderHook(
    (props: { query: string }) =>
      useNativeLibraryList({
        library,
        query: props.query,
        facetFilter: null,
        sort: null,
        filters: EMPTY_TRACK_FILTERS,
        restoreRef: { current: restore },
      }),
    { initialProps: { query: '' } },
  );
}

describe('useNativeLibraryList', () => {
  it('loads the first page, then appends the next', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({ tracks: [track('a'), track('b')], total: 3 })
      .mockResolvedValueOnce({ tracks: [track('c')], total: 3 });
    const { result } = setup(list);
    await act(() => result.current.loadList());
    expect(result.current.tracks.map((t) => t.id)).toEqual(['a', 'b']);
    await act(() => result.current.loadMore());
    expect(result.current.tracks.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect(list).toHaveBeenLastCalledWith(
      '',
      2,
      null,
      null,
      EMPTY_TRACK_FILTERS,
    );
  });

  it('ignores a response that a newer request has superseded', async () => {
    let resolveFirst!: (value: unknown) => void;
    const list = vi
      .fn()
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce({ tracks: [track('new')], total: 1 });
    const { result } = setup(list);
    let first!: Promise<void>;
    act(() => {
      first = result.current.loadList();
    });
    await act(() => result.current.loadList());
    await act(async () => {
      resolveFirst({ tracks: [track('stale')], total: 1 });
      await first;
    });
    expect(result.current.tracks.map((t) => t.id)).toEqual(['new']);
  });

  it('settles on what it has when a later page comes back empty', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({ tracks: [track('a')], total: 5 })
      .mockResolvedValueOnce({ tracks: [], total: 5 });
    const { result } = setup(list);
    await act(() => result.current.loadList());
    await act(() => result.current.loadMore());
    expect(result.current.total).toBe(1);
  });

  it('does not fetch the same page twice while one is in flight', async () => {
    let resolveMore!: (value: unknown) => void;
    const list = vi
      .fn()
      .mockResolvedValueOnce({ tracks: [track('a')], total: 3 })
      .mockReturnValueOnce(new Promise((resolve) => (resolveMore = resolve)));
    const { result } = setup(list);
    await act(() => result.current.loadList());
    act(() => {
      void result.current.loadMore();
      void result.current.loadMore();
    });
    expect(list).toHaveBeenCalledTimes(2);
    await act(async () => resolveMore({ tracks: [track('b')], total: 3 }));
  });

  it('preloads the rows needed to restore a scroll position, once', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({ tracks: [track('a'), track('b')], total: 6 })
      .mockResolvedValueOnce({ tracks: [track('c'), track('d')], total: 6 });
    const restoreRef = { current: 4 };
    const library = { list } as unknown as TahtiNativeLibrary;
    const { result } = renderHook(() =>
      useNativeLibraryList({
        library,
        query: '',
        facetFilter: null,
        sort: null,
        filters: EMPTY_TRACK_FILTERS,
        restoreRef,
      }),
    );
    await act(() => result.current.loadList());
    expect(result.current.tracks).toHaveLength(4);
    expect(restoreRef.current).toBe(0);
  });
});
