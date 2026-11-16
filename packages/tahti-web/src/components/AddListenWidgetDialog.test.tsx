import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as distribution from '../api/distribution';
import * as catalog from '../api/sources/catalog';
import * as soundcloud from '../api/sources/soundcloud';
import { useAuthStore, type AuthUser } from '../stores/authStore';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { AddListenWidgetDialog } from './AddListenWidgetDialog';

vi.mock('./ListenAddonsPanel', () => ({ ListenAddonsPanel: () => null }));

async function openService(id: string) {
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Add new listen widget' }),
    );
  });
  await act(async () => {
    fireEvent.click(screen.getByTestId(`add-listen-widget-service-${id}`));
  });
}

describe('AddListenWidgetDialog', () => {
  beforeEach(() => {
    useListenerWidgetsStore.setState({ instances: [] });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('adds a row from a pasted link, with the example shown', async () => {
    render(<AddListenWidgetDialog />);
    await openService('youtube');
    expect(
      screen.getByText(/^Example: https:\/\/www\.youtube\.com/),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Playlist link'), {
      target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    });
    fireEvent.change(screen.getByLabelText('Row name'), {
      target: { value: 'Late night picks' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-listen-widget-submit'));
    });
    const [added] = useListenerWidgetsStore.getState().instances;
    expect(added).toMatchObject({
      typeId: 'youtube',
      label: 'Late night picks',
    });
  });

  it('says what is wrong with a link it cannot use', async () => {
    render(<AddListenWidgetDialog />);
    await openService('spotify');
    fireEvent.change(screen.getByLabelText('Playlist or artist link'), {
      target: { value: 'https://example.com/not-spotify' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-listen-widget-submit'));
    });
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(useListenerWidgetsStore.getState().instances).toHaveLength(0);
  });

  it('adds a Spotify artist and turns away an album link with a reason', async () => {
    render(<AddListenWidgetDialog />);
    await openService('spotify');
    expect(
      screen.getByRole('heading', {
        name: 'Add a playlist or artist from Spotify',
      }),
    ).toBeTruthy();
    const link = screen.getByLabelText('Playlist or artist link');
    fireEvent.change(link, {
      target: {
        value: 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy',
      },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-listen-widget-submit'));
    });
    expect(screen.getByRole('alert').textContent).toBe(
      'This is a Spotify album link. Paste a playlist or artist link instead.',
    );
    fireEvent.change(link, {
      target: {
        value: 'https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF',
      },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-listen-widget-submit'));
    });
    expect(useListenerWidgetsStore.getState().instances[0]).toMatchObject({
      typeId: 'spotify',
      input: 'https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF',
    });
  });

  it('lists a signed-in listener’s own SoundCloud playlists to pick from', async () => {
    useAuthStore.setState({ user: { username: 'aino' } as AuthUser });
    vi.spyOn(catalog, 'fetchConnectionStatus').mockResolvedValue({
      data: { connected: true, configured: true },
      meta: { source: 'api' },
    });
    vi.spyOn(soundcloud, 'fetchSoundcloudPlaylists').mockResolvedValue([
      {
        id: '7',
        title: 'Night drive',
        trackCount: 12,
        artworkUrl: null,
        permalinkUrl: 'https://soundcloud.com/aino/sets/night-drive',
      },
    ]);
    render(<AddListenWidgetDialog />);
    await openService('soundcloud');
    const pick = await screen.findByRole('button', { name: /Night drive/ });
    await act(async () => {
      fireEvent.click(pick);
    });
    expect(
      (screen.getByLabelText('Playlist link') as HTMLInputElement).value,
    ).toBe('https://soundcloud.com/aino/sets/night-drive');
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-listen-widget-submit'));
    });
    expect(useListenerWidgetsStore.getState().instances[0]).toMatchObject({
      typeId: 'soundcloud',
      label: 'Night drive',
    });
  });

  it('offers the Spotify artist linked in Add-ons as a pick', async () => {
    useAuthStore.setState({ user: { username: 'aino' } as AuthUser });
    vi.spyOn(distribution, 'fetchSpotifyArtistProfile').mockResolvedValue({
      data: {
        configured: true,
        profile: { artistId: 'abc123', name: 'Aino', imageUrl: null },
      },
      meta: { source: 'api' },
    });
    render(<AddListenWidgetDialog />);
    await openService('spotify');
    expect(await screen.findByText('Your linked Spotify artist')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Aino/ }));
    });
    expect(
      (screen.getByLabelText('Playlist or artist link') as HTMLInputElement)
        .value,
    ).toBe('https://open.spotify.com/artist/abc123');
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-listen-widget-submit'));
    });
    expect(useListenerWidgetsStore.getState().instances[0]).toMatchObject({
      typeId: 'spotify',
      label: 'Aino',
    });
  });
});
