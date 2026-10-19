// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as shows from '../../api/shows';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioShowsView } from './StudioShowsView';

const SHOW = {
  id: 'show-1',
  title: 'Night Shift',
  description: 'Late techno',
} as shows.StudioShowSeries;

describe('StudioShowsView', () => {
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
    vi.spyOn(shows, 'fetchEpisodesForShow').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('says the shows failed to load instead of "No shows yet"', async () => {
    const fetch = vi.spyOn(shows, 'fetchShowSeries').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<StudioShowsView />);
    expect(await screen.findByText('Could not load your shows')).toBeTruthy();
    expect(screen.queryByText('No shows yet')).toBeNull();

    fetch.mockResolvedValue({ data: [SHOW], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Night Shift')).toBeTruthy();
  });

  it('clears a search that matches no shows', async () => {
    vi.spyOn(shows, 'fetchShowSeries').mockResolvedValue({
      data: [SHOW],
      meta: { source: 'api' },
    });
    await renderWithRouter(<StudioShowsView />);
    fireEvent.change(await screen.findByLabelText('Search shows'), {
      target: { value: 'polka' },
    });
    expect(screen.getByText('No shows match this search.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('Night Shift')).toBeTruthy();
  });
});
