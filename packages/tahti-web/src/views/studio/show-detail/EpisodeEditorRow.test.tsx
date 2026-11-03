// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { StudioEpisode } from '../../../api/shows';
import { EpisodeEditorRow } from './EpisodeEditorRow';

const episode: StudioEpisode = {
  id: 'ep-1',
  showId: 'show-1',
  episodeNumber: 4,
  title: 'Night shift',
  description: 'Two hours of tape loops.',
  coverUrl: null,
  status: 'PUBLISHED',
  source: 'upload',
  soundId: 'snd-1',
  slotStartAt: null,
  slotEndAt: null,
  bookingId: null,
  createdAt: '2026-10-01T12:00:00.000Z',
};

const patchEpisode = vi.fn();
vi.mock('../../../api/shows', () => ({
  patchEpisode: (...args: unknown[]) => patchEpisode(...args),
}));

describe('EpisodeEditorRow', () => {
  it('reads first and saves from the form behind its pencil', async () => {
    const onSaved = vi.fn();
    patchEpisode.mockResolvedValue({
      ok: true,
      data: { ...episode, title: 'Night shift II' },
    });
    render(
      <ul>
        <EpisodeEditorRow episode={episode} onSaved={onSaved} />
      </ul>,
    );
    expect(screen.getByText('Two hours of tape loops.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Episode title')).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Night shift' }),
    );
    const title = screen.getByLabelText('Episode title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Night shift II');
    await userEvent.click(screen.getByRole('button', { name: 'Save episode' }));

    expect(patchEpisode).toHaveBeenCalledWith('ep-1', {
      title: 'Night shift II',
      description: 'Two hours of tape loops.',
    });
    expect(onSaved).toHaveBeenCalled();
    expect(screen.queryByLabelText('Episode title')).not.toBeInTheDocument();
  });
});
