// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/channel-embeds';
import { ArtistSoundCloudTracks } from './ArtistSoundCloudTracks';

describe('ArtistSoundCloudTracks', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists the tracks and mounts the widget only after play', async () => {
    const spy = vi
      .spyOn(api, 'fetchChannelSoundCloudEmbeds')
      .mockResolvedValue({
        data: [
          {
            id: 'e1',
            provider: 'soundcloud',
            url: 'https://soundcloud.com/tahti/night-drive',
            title: 'Night Drive',
            authorName: 'Tahti',
            thumbnailUrl: null,
            createdAt: '2026-09-01T12:00:00.000Z',
          },
        ],
        meta: { source: 'api' },
      });
    const { container } = await act(async () =>
      render(<ArtistSoundCloudTracks channelSlug="tahti" surfaceStyle={{}} />),
    );
    expect(spy).toHaveBeenCalledWith('tahti');
    expect(screen.getByTestId('soundcloud-tracks').textContent).toContain(
      'Night Drive',
    );
    expect(container.querySelector('iframe')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Play Night Drive on SoundCloud' }),
    );
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toContain('w.soundcloud.com/player/');
  });

  it('renders nothing without tracks', async () => {
    vi.spyOn(api, 'fetchChannelSoundCloudEmbeds').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    const { container } = await act(async () =>
      render(<ArtistSoundCloudTracks channelSlug="tahti" surfaceStyle={{}} />),
    );
    expect(container.textContent).toBe('');
  });
});
