// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { humanizePastDate } from '../lib/humanizeDate';
import type { TahtiNativeLibrary } from '../lib/nativeLibrary';
import { playedAtDate } from '../lib/setTracklist';
import { PlayHistoryDialog } from './PlayHistoryDialog';

const play = vi.hoisted(() => vi.fn());

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));
vi.mock('../stores/playerStore', () => ({
  usePlayerStore: (selector: (state: { play: typeof play }) => unknown) =>
    selector({ play }),
}));

describe('PlayHistoryDialog', () => {
  afterEach(cleanup);

  it('offers Retry when the history fails to load', async () => {
    const playHistory = vi
      .fn()
      .mockRejectedValueOnce(new Error('library offline'))
      .mockResolvedValueOnce({ entries: [], total: 0 });
    const library = {
      catalog: { playHistory },
    } as unknown as TahtiNativeLibrary;
    await act(async () => {
      render(
        <PlayHistoryDialog
          isOpen
          onClose={() => {}}
          library={library}
          onChanged={() => {}}
        />,
      );
    });
    expect(
      screen.getByText('Could not load your listening history'),
    ).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(screen.getByText(/Nothing yet/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Clear history' }),
    ).toBeDisabled();
  });

  it('shows a humanized date and resumes the session in play order', async () => {
    const prepareBatch = vi.fn(async (ids: string[]) => ({
      unavailable: 0,
      items: ids.map((id) => ({
        track: { id, title: id, artist: 'A', duration: 10 },
        streamUrl: `https://example.test/${id}`,
      })),
    }));
    const library = {
      catalog: {
        playHistory: vi.fn(async () => ({
          total: 3,
          entries: [
            {
              id: 3,
              trackId: 'c',
              title: 'Later',
              artist: 'C',
              playedAt: '2026-10-27 22:30:00',
            },
            {
              id: 2,
              trackId: null,
              title: 'Gone',
              artist: '',
              playedAt: '2026-10-27 22:20:00',
            },
            {
              id: 1,
              trackId: 'a',
              title: 'Earlier',
              artist: 'A',
              playedAt: '2026-10-27 22:10:00',
            },
          ],
        })),
      },
      prepareBatch,
    } as unknown as TahtiNativeLibrary;
    await act(async () => {
      render(
        <PlayHistoryDialog
          isOpen
          onClose={() => {}}
          library={library}
          onChanged={() => {}}
        />,
      );
    });
    const when = humanizePastDate(
      playedAtDate('2026-10-27 22:30:00')!.toISOString(),
    );
    const row = screen.getByText(/Later/).closest('li');
    expect(row?.textContent).toContain(when);
    expect(screen.queryByText(/UTC/)).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    });
    expect(prepareBatch).toHaveBeenCalledWith(['a', 'c']);
    expect(play).toHaveBeenCalledTimes(1);
    const [head, options] = play.mock.calls[0]!;
    expect(head.id).toBe('local:a');
    expect(options.enqueueRest.map((item: { id: string }) => item.id)).toEqual([
      'local:c',
    ]);
  });

  it('says so when the session files are gone', async () => {
    const library = {
      catalog: {
        playHistory: vi.fn(async () => ({
          total: 1,
          entries: [
            {
              id: 1,
              trackId: 'missing',
              title: 'Missing',
              artist: '',
              playedAt: '2026-10-27 22:30:00',
            },
          ],
        })),
      },
      prepareBatch: vi.fn(async () => ({ items: [], unavailable: 1 })),
    } as unknown as TahtiNativeLibrary;
    await act(async () => {
      render(
        <PlayHistoryDialog
          isOpen
          onClose={() => {}}
          library={library}
          onChanged={() => {}}
        />,
      );
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    });
    expect(toast.error).toHaveBeenCalledWith(
      'None of these tracks can be played.',
    );
    expect(play).not.toHaveBeenCalled();
  });
});
