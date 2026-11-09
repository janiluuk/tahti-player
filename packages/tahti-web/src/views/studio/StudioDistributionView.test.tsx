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

  it('says the royalty reports failed to load instead of hiding them', async () => {
    vi.spyOn(studio, 'fetchStudioReleases').mockResolvedValue({
      data: { releases: [] },
      meta: { source: 'api' },
    } as never);
    const royalties = vi
      .spyOn(distribution, 'fetchAllRoyalties')
      .mockResolvedValue({
        data: [],
        meta: { source: 'api', reason: 'Revelator is unavailable' },
      } as never);
    await renderWithRouter(<StudioDistributionView />);
    expect(
      await screen.findByText('Could not load your royalty reports.'),
    ).toBeTruthy();
    expect(screen.getByText('Revelator is unavailable')).toBeTruthy();

    royalties.mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    } as never);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No releases yet')).toBeTruthy();
    expect(
      screen.queryByText('Could not load your royalty reports.'),
    ).toBeNull();
  });

  it('shows the last loaded royalty reports at once and keeps them when a refresh fails', async () => {
    const row = {
      id: 'roy-1',
      releaseId: 'rel-1',
      releaseTitle: 'Night Drive',
      periodStart: '2026-01-01',
      periodEnd: '2026-03-31',
      amountCents: 1234,
      currency: 'EUR',
      streams: 40,
      syncedAt: '2026-04-01T00:00:00.000Z',
    };
    vi.spyOn(studio, 'fetchStudioReleases').mockResolvedValue({
      data: { releases: [] },
      meta: { source: 'api' },
    } as never);
    const royalties = vi
      .spyOn(distribution, 'fetchAllRoyalties')
      .mockResolvedValue({ data: [row], meta: { source: 'api' } } as never);
    const first = await renderWithRouter(<StudioDistributionView />);
    expect(await screen.findByText('Night Drive')).toBeTruthy();
    first.unmount();

    let fail: () => void = () => undefined;
    royalties.mockReturnValue(
      new Promise((resolve) => {
        fail = () =>
          resolve({
            data: [],
            meta: { source: 'api', reason: 'Revelator is unavailable' },
          } as never);
      }),
    );
    await renderWithRouter(<StudioDistributionView />);
    expect(screen.getByText('Night Drive')).toBeTruthy();
    expect(screen.queryByText('Loading…')).toBeNull();

    fail();
    expect(
      await screen.findByText('Could not load your royalty reports.'),
    ).toBeTruthy();
    expect(screen.getByText('Night Drive')).toBeTruthy();
  });
});
