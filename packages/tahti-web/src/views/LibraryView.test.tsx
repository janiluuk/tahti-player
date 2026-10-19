// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
});
