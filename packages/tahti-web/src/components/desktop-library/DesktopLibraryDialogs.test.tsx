// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NativeLibraryRoot } from '../../lib/nativeLibrary';
import { DesktopLibraryDialogs } from './DesktopLibraryDialogs';

vi.mock('../AddToPlaylistDialog', () => ({ AddToPlaylistDialog: () => null }));
vi.mock('../LocalLibraryFilters', () => ({ LocalLibraryFilters: () => null }));
vi.mock('../TrackInspectorDialog', () => ({
  TrackInspectorDialog: () => null,
}));
vi.mock('./TrackBatchDialogs', () => ({ TrackBatchDialogs: () => null }));

type Props = ComponentProps<typeof DesktopLibraryDialogs>;

function renderDialogs(overrides: Partial<Props>) {
  const props = {
    library: null,
    selection: { addToPlaylist: null, setAddToPlaylist: vi.fn() },
    filtersOpen: false,
    setFiltersOpen: vi.fn(),
    filters: {},
    setFilters: vi.fn(),
    filterOptions: null,
    tags: [],
    roots: [],
    batchDialog: null,
    setBatchDialog: vi.fn(),
    inspected: null,
    setInspected: vi.fn(),
    pendingRemoval: null,
    setPendingRemoval: vi.fn(),
    rootToRemove: null,
    setRootToRemove: vi.fn(),
    onRefresh: vi.fn(),
    onPlay: vi.fn(),
    onQueue: vi.fn(),
    onReveal: vi.fn(),
    onRelink: vi.fn(),
    onRemove: vi.fn(),
    onRemoveRoot: vi.fn(),
    ...overrides,
  } as unknown as Props;
  render(<DesktopLibraryDialogs {...props} />);
  return props;
}

describe('DesktopLibraryDialogs', () => {
  afterEach(cleanup);

  it('confirms removing tracks from the library with a red button', () => {
    const props = renderDialogs({
      pendingRemoval: { ids: ['t1', 't2'], title: null },
    });
    const remove = screen.getByRole('button', { name: 'Remove' });
    expect(remove.className).toContain('bg-accent-red');
    fireEvent.click(remove);
    expect(props.onRemove).toHaveBeenCalledWith(['t1', 't2'], null);
  });

  it('confirms no longer watching a folder with a red button', () => {
    const root = { id: 'r1', path: '/music/House' } as NativeLibraryRoot;
    const props = renderDialogs({ rootToRemove: root });
    const stop = screen.getByRole('button', { name: 'Stop watching' });
    expect(stop.className).toContain('bg-accent-red');
    fireEvent.click(stop);
    expect(props.onRemoveRoot).toHaveBeenCalledWith(root);
  });
});
