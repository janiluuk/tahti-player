// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { TahtiNativeLibrary } from '../lib/nativeLibrary';
import { SmartPlaylists } from './SmartPlaylists';

describe('SmartPlaylists live counts', () => {
  it('re-counts every list when the library changes', async () => {
    let changed: ((version: number) => void) | undefined;
    let total = 3;
    const evaluate = vi.fn(async () => ({ tracks: [], total }));
    const library = {
      analysis: {
        smart: {
          list: vi.fn(async () => [
            {
              id: 'fresh',
              name: 'Fresh',
              matchAll: true,
              rules: [],
              sort: 'title',
              descending: false,
              limit: null,
              createdAt: '2026-10-15',
            },
          ]),
          evaluate,
        },
      },
      onLibraryChanged: (listener: (version: number) => void) => {
        changed = listener;
        return () => undefined;
      },
    } as unknown as TahtiNativeLibrary;

    render(
      <SmartPlaylists library={library} onPlaylistCreated={() => undefined} />,
    );
    await screen.findByText('Fresh');
    await waitFor(() => expect(evaluate).toHaveBeenCalledTimes(1));

    total = 4;
    act(() => changed?.(7));
    await waitFor(() => expect(evaluate).toHaveBeenCalledTimes(2));
  });
});
