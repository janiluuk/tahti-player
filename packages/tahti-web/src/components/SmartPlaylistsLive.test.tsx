// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TahtiNativeLibrary } from '../lib/nativeLibrary';
import { SmartPlaylists } from './SmartPlaylists';

function smartLibrary(total: () => number) {
  let changed: ((version: number) => void) | undefined;
  const evaluate = vi.fn(async () => ({ tracks: [], total: total() }));
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
  return { library, evaluate, change: (v: number) => changed?.(v) };
}

describe('SmartPlaylists live counts', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('re-counts every list when the library changes', async () => {
    let total = 3;
    const { library, evaluate, change } = smartLibrary(() => total);

    render(
      <SmartPlaylists library={library} onPlaylistCreated={() => undefined} />,
    );
    await screen.findByText('Fresh');
    await waitFor(() => expect(evaluate).toHaveBeenCalledTimes(1));

    total = 4;
    act(() => change(7));
    await waitFor(() => expect(evaluate).toHaveBeenCalledTimes(2));
  });

  it('confirms deleting a smart playlist with a red button', async () => {
    const { library } = smartLibrary(() => 3);
    render(
      <SmartPlaylists library={library} onPlaylistCreated={() => undefined} />,
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete Fresh' }),
    );
    expect(
      within(
        screen.getByRole('dialog', { name: 'Delete this smart playlist?' }),
      ).getByRole('button', { name: 'Delete' }).className,
    ).toContain('bg-accent-red');
  });

  it('re-counts as time passes, when tracks can age out of a last-days rule', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { library, evaluate } = smartLibrary(() => 3);

    render(
      <SmartPlaylists library={library} onPlaylistCreated={() => undefined} />,
    );
    await screen.findByText('Fresh');
    await waitFor(() => expect(evaluate).toHaveBeenCalledTimes(1));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    await waitFor(() => expect(evaluate).toHaveBeenCalledTimes(2));
  });
});
