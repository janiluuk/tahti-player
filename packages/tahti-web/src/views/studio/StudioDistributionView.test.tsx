// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as distribution from '../../api/distribution';
import * as studio from '../../api/studio';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioDistributionView } from './StudioDistributionView';

describe('StudioDistributionView', () => {
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
    vi.spyOn(distribution, 'fetchAllRoyalties').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    } as never);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('says the releases failed to load instead of "No releases yet"', async () => {
    const fetch = vi.spyOn(studio, 'fetchStudioReleases').mockResolvedValue({
      data: { releases: [] },
      meta: { source: 'api', reason: 'HTTP 502' },
    } as never);
    await renderWithRouter(<StudioDistributionView />);
    expect(
      await screen.findByText('Could not load your releases'),
    ).toBeTruthy();
    expect(screen.queryByText('No releases yet')).toBeNull();

    fetch.mockResolvedValue({
      data: { releases: [] },
      meta: { source: 'api' },
    } as never);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No releases yet')).toBeTruthy();
  });
});
