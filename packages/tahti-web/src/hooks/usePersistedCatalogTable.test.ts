import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CatalogColumn } from '@tahti-player/ui';

import { usePersistedCatalogTable } from './usePersistedCatalogTable';

const columns: CatalogColumn<unknown>[] = [
  {
    id: 'title',
    header: 'Title',
    width: 200,
    sortable: true,
    required: true,
    render: () => null,
  },
  {
    id: 'artist',
    header: 'Artist',
    width: 150,
    sortable: true,
    render: () => null,
  },
  {
    id: 'year',
    header: 'Year',
    width: 80,
    hiddenByDefault: true,
    render: () => null,
  },
];

const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => void memory.set(key, value),
    },
  });
});

describe('usePersistedCatalogTable', () => {
  it('starts from defaults and remembers view and sort across mounts', () => {
    const first = renderHook(() => usePersistedCatalogTable('k', columns));
    expect(first.result.current.view.hidden).toEqual(['year']);
    act(() => {
      first.result.current.setView({
        order: ['artist', 'title', 'year'],
        hidden: [],
        widths: { artist: 300 },
      });
      first.result.current.setSort({ columnId: 'artist', descending: true });
    });
    first.unmount();

    const second = renderHook(() => usePersistedCatalogTable('k', columns));
    expect(second.result.current.view.order).toEqual([
      'artist',
      'title',
      'year',
    ]);
    expect(second.result.current.view.widths).toEqual({ artist: 300 });
    expect(second.result.current.sort).toEqual({
      columnId: 'artist',
      descending: true,
    });
  });

  it('survives a stored view from another version and ignores unsortable sorts', () => {
    memory.set(
      'k',
      JSON.stringify({
        view: { order: ['gone', 'artist'], hidden: ['title'] },
        sort: { columnId: 'year', descending: false },
      }),
    );
    const { result } = renderHook(() => usePersistedCatalogTable('k', columns));
    expect(result.current.view.order).toEqual(['artist', 'title', 'year']);
    expect(result.current.view.hidden).not.toContain('title');
    expect(result.current.sort).toBeNull();
  });

  it('tolerates unreadable storage', () => {
    memory.set('k', '{not json');
    const { result } = renderHook(() => usePersistedCatalogTable('k', columns));
    expect(result.current.view.order).toEqual(['title', 'artist', 'year']);
  });
});
