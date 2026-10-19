// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../api/studio';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioPlaylistsView } from './StudioPlaylistsView';

vi.mock('../LibraryView', () => ({
  LibrarySectionTabs: () => null,
}));

describe('StudioPlaylistsView', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'artist@tahti.live',
        username: 'artist',
        displayName: 'An Artist',
        role: 'ARTIST',
        isBoard: false,
        isMember: true,
        channel: { slug: 'artist', state: 'OFFLINE' },
      },
      hydrated: true,
      loading: false,
      profileLoaded: true,
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('says the playlists failed to load instead of "No playlists yet"', async () => {
    const fetch = vi.spyOn(studio, 'fetchStudioCollections').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<StudioPlaylistsView />);
    expect(
      await screen.findByText('Could not load your playlists'),
    ).toBeTruthy();
    expect(screen.queryByText('No playlists yet')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No playlists yet')).toBeTruthy();
  });
});
