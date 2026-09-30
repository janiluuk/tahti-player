// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as platformStats from '../api/platform-stats';
import { PlatformStatsStrip } from './PlatformStatsStrip';

describe('PlatformStatsStrip', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the public platform numbers', async () => {
    vi.spyOn(platformStats, 'fetchPlatformStats').mockResolvedValue({
      activeArtists: 1204,
      broadcastsThisMonth: 37,
      totalHours: 980,
      totalStorageBytes: 2 * 1024 ** 4,
    });
    render(<PlatformStatsStrip />);
    expect(await screen.findByText('1,204')).toBeTruthy();
    expect(screen.getByText('Broadcasts this month')).toBeTruthy();
    expect(screen.getByText('980')).toBeTruthy();
    expect(screen.getByText('2.0 TB')).toBeTruthy();
  });

  it('renders nothing when the stats are unavailable', async () => {
    const load = vi
      .spyOn(platformStats, 'fetchPlatformStats')
      .mockResolvedValue(null);
    const { container } = render(<PlatformStatsStrip />);
    await vi.waitFor(() => expect(load).toHaveBeenCalled());
    expect(container.innerHTML).toBe('');
  });
});
