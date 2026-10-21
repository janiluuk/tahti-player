import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../api/sources/spotify-collection';
import { SpotifyImportPanel } from './SpotifyImportPanel';

const track: api.SpotifyTrack = {
  uri: 'spotify:track:abc123',
  title: 'Night Drive',
  artists: ['Selector', 'Guest'],
  album: 'Nights',
  durationSec: 214,
  coverUrl: null,
};

describe('SpotifyImportPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('searches Spotify and adds a track to the collection by URI', async () => {
    const search = vi
      .spyOn(api, 'searchSpotify')
      .mockResolvedValue({ ok: true, data: [track] });
    const add = vi
      .spyOn(api, 'addSpotifyTrack')
      .mockResolvedValue({ ok: true, data: { soundId: 's1' } });
    const onAdded = vi.fn();
    vi.spyOn(toast, 'success');

    render(<SpotifyImportPanel collectionId="col-1" onAdded={onAdded} />);
    fireEvent.change(screen.getByLabelText('Search Spotify'), {
      target: { value: 'night' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Find' }));
    });
    expect(search).toHaveBeenCalledWith('night');
    expect(screen.getByText('Selector, Guest · 3:34')).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    });
    expect(add).toHaveBeenCalledWith('col-1', 'spotify:track:abc123');
    expect(onAdded).toHaveBeenCalled();
    expect(
      (screen.getByRole('button', { name: 'Added' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('loads your own tracks and explains an unlinked profile', async () => {
    vi.spyOn(api, 'fetchMySpotifyTracks').mockResolvedValue({
      ok: true,
      data: [],
    });
    render(<SpotifyImportPanel collectionId="col-1" onAdded={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'Your tracks' }));
    });
    expect(
      screen.getByText(
        'No tracks found. Link your Spotify artist profile in Add-ons → Spotify first.',
      ),
    ).toBeTruthy();
  });

  it("lists a collaborator's catalogue from an artist link", async () => {
    const byArtist = vi
      .spyOn(api, 'fetchSpotifyArtistTracks')
      .mockResolvedValue({ ok: true, data: [track] });
    render(<SpotifyImportPanel collectionId="col-1" onAdded={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'By artist link' }));
    });
    fireEvent.change(screen.getByLabelText('Spotify artist link'), {
      target: { value: 'https://open.spotify.com/artist/xyz' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Find' }));
    });
    expect(byArtist).toHaveBeenCalledWith(
      'https://open.spotify.com/artist/xyz',
    );
    expect(screen.getByText('Night Drive')).toBeTruthy();
  });

  it("shows the API's error", async () => {
    vi.spyOn(api, 'searchSpotify').mockResolvedValue({
      ok: false,
      error: 'Spotify search is not configured',
    });
    const error = vi.spyOn(toast, 'error');
    render(<SpotifyImportPanel collectionId="col-1" onAdded={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Search Spotify'), {
      target: { value: 'x' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Find' }));
    });
    expect(error).toHaveBeenCalledWith('Spotify search is not configured');
  });
});
