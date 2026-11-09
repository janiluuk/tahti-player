// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import * as studio from '../api/studio';
import * as extras from '../api/studio-extras';
import { useAuthStore } from '../stores/authStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { LibraryView } from './LibraryView';

describe('LibraryView overview', () => {
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
      },
      hydrated: true,
      loading: false,
      profileLoaded: true,
    });
    vi.spyOn(extras, 'fetchStatsTopTracks').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    } as never);
    vi.spyOn(extras, 'fetchStorageUsage').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    } as never);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('says the catalog failed to load instead of "Your catalog is empty"', async () => {
    const fetch = vi.spyOn(studio, 'fetchStudioSounds').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<LibraryView />);
    expect(await screen.findByText('Could not load your catalog')).toBeTruthy();
    expect(screen.queryByText('Your catalog is empty')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Your catalog is empty')).toBeTruthy();
  });

  it('heads the overview once, without a second "Library overview" card title', async () => {
    vi.spyOn(studio, 'fetchStudioSounds').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    await renderWithRouter(<LibraryView />);
    await screen.findByTestId('library-overview-stats');
    expect(screen.getAllByRole('heading', { name: 'Overview' })).toHaveLength(
      1,
    );
    expect(
      screen.queryByRole('heading', { name: /Library overview/ }),
    ).toBeNull();
  });

  it('shows artwork rather than a cassette placeholder for top sounds', async () => {
    vi.spyOn(studio, 'fetchStudioSounds').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    vi.mocked(extras.fetchStatsTopTracks).mockResolvedValue({
      data: [{ soundId: 'sound-1', title: 'Polar Night', plays: 12 }],
      meta: { source: 'api' },
    } as never);
    await renderWithRouter(
      <MediaArtworkDefaultProvider value={(seed) => `/covers/${seed}.png`}>
        <LibraryView />
      </MediaArtworkDefaultProvider>,
    );
    expect(await screen.findByAltText('Polar Night')).toHaveAttribute(
      'src',
      '/covers/sound-1.png',
    );
  });
});
