// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../../api/studio';
import { usePlayerStore } from '../../../stores/playerStore';
import { PlayCollectionButton } from './PlayCollectionButton';

const { toast } = vi.hoisted(() => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));
vi.mock('sonner', () => ({ toast, Toaster: () => null }));

const sound = (id: string, title: string) => ({
  id,
  title,
  audioUrl: `https://cdn.test/${id}.mp3`,
});

describe('PlayCollectionButton', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('plays the first track and queues the rest in order', async () => {
    vi.spyOn(studio, 'fetchStudioCollection').mockResolvedValue({
      data: {
        slug: 'mix',
        name: 'Mix',
        items: [
          { id: 'i1', position: 0, soundId: 'a', sound: sound('a', 'One') },
          {
            id: 'i2',
            position: 1,
            soundId: 'gone',
            sound: sound('gone', 'Gone'),
            unavailable: true,
          },
          { id: 'i3', position: 2, soundId: 'b', sound: sound('b', 'Two') },
        ],
      },
      meta: { source: 'api' },
    } as never);
    const play = vi.fn();
    vi.spyOn(usePlayerStore, 'getState').mockReturnValue({
      play,
    } as never);
    render(<PlayCollectionButton slug="mix" name="Mix" />);
    fireEvent.click(screen.getByRole('button', { name: 'Play Mix' }));
    await vi.waitFor(() => expect(play).toHaveBeenCalled());
    const [first, opts] = play.mock.calls[0]!;
    expect(first.title).toBe('One');
    expect(opts.enqueueRest.map((p: { title: string }) => p.title)).toEqual([
      'Two',
    ]);
  });

  it('says so when nothing in the collection can play', async () => {
    vi.spyOn(studio, 'fetchStudioCollection').mockResolvedValue({
      data: { slug: 'empty', name: 'Empty', items: [] },
      meta: { source: 'api' },
    } as never);
    render(<PlayCollectionButton slug="empty" name="Empty" />);
    fireEvent.click(screen.getByRole('button', { name: 'Play Empty' }));
    await vi.waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith(
        'Empty has no playable tracks yet.',
      ),
    );
  });
});
