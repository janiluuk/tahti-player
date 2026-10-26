// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as extras from '../api/studio-extras';
import * as insights from '../api/track-insights';
import { TrackInsightsPanel } from './TrackInsightsPanel';

vi.mock('../components/ListenerWorldMap', () => ({
  ListenerWorldMap: () => null,
}));

describe('TrackInsightsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says insights failed to load instead of "No insights"', async () => {
    vi.spyOn(insights, 'fetchTrackInsights').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 500' },
    });
    await act(async () => {
      render(<TrackInsightsPanel kind="sound" id="s1" />);
    });
    expect(screen.getByText('Could not load insights')).toBeTruthy();
    expect(screen.queryByText('No insights for this track yet')).toBeNull();
  });

  it('says there are no insights when the API has none', async () => {
    vi.spyOn(insights, 'fetchTrackInsights').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<TrackInsightsPanel kind="sound" id="s1" />);
    });
    expect(screen.getByText('No insights for this track yet')).toBeTruthy();
  });

  it("narrows the listener panels to a sound's own listens", async () => {
    vi.spyOn(insights, 'fetchTrackInsights').mockResolvedValue({
      data: {
        title: 'Track',
        period: '30d',
        totalPlays: 4,
        totalDownloads: 2,
        daily: [],
        countries: [],
      },
      meta: { source: 'api' },
    });
    const loyalty = vi.spyOn(extras, 'fetchStatsLoyalty').mockResolvedValue({
      data: { total: 0, minBucket: 5, points: [] },
      meta: { source: 'api' },
    });
    const audience = vi.spyOn(extras, 'fetchStatsAudience');
    const locations = vi.spyOn(extras, 'fetchStatsLocations');
    await act(async () => {
      render(<TrackInsightsPanel kind="sound" id="s1" />);
    });
    expect(loyalty).toHaveBeenCalledWith(
      expect.objectContaining({ range: '30', soundId: 's1' }),
    );
    expect(audience).toHaveBeenCalledWith(
      'browser',
      expect.objectContaining({ range: '30', soundId: 's1' }),
    );
    expect(locations).toHaveBeenCalledWith(
      expect.objectContaining({ soundId: 's1' }),
    );
  });

  it('leaves the listener panels out for release tracks', async () => {
    vi.spyOn(insights, 'fetchTrackInsights').mockResolvedValue({
      data: {
        title: 'Track',
        period: '30d',
        totalPlays: 4,
        totalDownloads: 2,
        daily: [],
        countries: [],
      },
      meta: { source: 'api' },
    });
    const loyalty = vi.spyOn(extras, 'fetchStatsLoyalty');
    await act(async () => {
      render(<TrackInsightsPanel kind="release-tracks" id="t1" />);
    });
    expect(loyalty).not.toHaveBeenCalled();
    expect(screen.queryByText('Listener loyalty')).toBeNull();
  });
});
