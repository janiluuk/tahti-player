// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/artist-embeds';
import { SoundCloudEmbedsPanel } from './SoundCloudEmbedsPanel';

const EMBED: api.ArtistEmbed = {
  id: 'e1',
  provider: 'soundcloud',
  url: 'https://soundcloud.com/tahti/night-drive',
  title: 'Night Drive',
  authorName: 'Tahti',
  thumbnailUrl: null,
  createdAt: '2026-09-01T12:00:00.000Z',
};

describe('SoundCloudEmbedsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('adds a track by URL and removes one', async () => {
    vi.spyOn(api, 'fetchArtistEmbeds').mockResolvedValue({
      data: [EMBED],
      meta: { source: 'api' },
    });
    const addSpy = vi.spyOn(api, 'addArtistEmbed').mockResolvedValue({
      ok: true,
      data: {
        ...EMBED,
        id: 'e2',
        title: 'Aurora',
        url: 'https://soundcloud.com/tahti/aurora',
      },
    });
    const removeSpy = vi
      .spyOn(api, 'removeArtistEmbed')
      .mockResolvedValue({ ok: true });
    await act(async () => {
      render(<SoundCloudEmbedsPanel />);
    });
    const list = screen.getByTestId('soundcloud-embeds');
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);

    fireEvent.change(screen.getByLabelText('SoundCloud track URL'), {
      target: { value: ' https://soundcloud.com/tahti/aurora ' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add track' }));
    });
    expect(addSpy).toHaveBeenCalledWith('https://soundcloud.com/tahti/aurora');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(list.textContent).toContain('Aurora');

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Remove Night Drive' }),
      );
    });
    expect(removeSpy).toHaveBeenCalledWith('e1');
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  });

  it('shows an error state when the list fails to load', async () => {
    vi.spyOn(api, 'fetchArtistEmbeds').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<SoundCloudEmbedsPanel />);
    });
    expect(
      screen.getByText("Couldn't load your SoundCloud tracks"),
    ).toBeTruthy();
  });
});
