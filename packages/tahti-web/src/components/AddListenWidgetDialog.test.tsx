import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    fireEvent.change(screen.getByLabelText('Playlist link'), {
      target: { value: 'https://example.com/not-spotify' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-listen-widget-submit'));
    });
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(useListenerWidgetsStore.getState().instances).toHaveLength(0);
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
});
