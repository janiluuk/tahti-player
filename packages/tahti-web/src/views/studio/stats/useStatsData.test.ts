import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useStatsData } from './useStatsData';

const {
  fetchStatsSummary,
  fetchStatsPlays,
  fetchStatsTopTracks,
  fetchStatsTopCountries,
  fetchListenerGeo,
  fetchChannelEgressStats,
  fetchChannelLiveStats,
  fetchStatsTopLists,
  fetchStatsPlaysHourly,
  fetchGrantEstimate,
} = vi.hoisted(() => ({
  fetchStatsSummary: vi.fn(),
  fetchStatsPlays: vi.fn(),
  fetchStatsTopTracks: vi.fn(),
  fetchStatsTopCountries: vi.fn(),
  fetchListenerGeo: vi.fn(),
  fetchChannelEgressStats: vi.fn(),
  fetchChannelLiveStats: vi.fn(),
  fetchStatsTopLists: vi.fn(),
  fetchStatsPlaysHourly: vi.fn(),
  fetchGrantEstimate: vi.fn(),
}));

vi.mock('../../../api/studio-extras', () => ({
  fetchStatsSummary,
  fetchStatsPlays,
  fetchStatsTopTracks,
  fetchStatsTopCountries,
  fetchListenerGeo,
  fetchChannelEgressStats,
  fetchChannelLiveStats,
  fetchStatsTopLists,
  fetchStatsPlaysHourly,
}));

vi.mock('../../../api/revenue', () => ({ fetchGrantEstimate }));

const empty = <T>(data: T) => ({ data, meta: { source: 'mock' as const } });

describe('useStatsData top-list-only refetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchStatsSummary.mockResolvedValue(
      empty({
        playsToday: 0,
        playsTotal: 0,
        downloadsToday: 0,
        downloadsTotal: 0,
        followerCount: 0,
      }),
    );
    fetchStatsPlays.mockResolvedValue(
      empty({
        totalPlays: 0,
        totalDownloads: 0,
        totalSmartLinkClicks: 0,
        daily: [],
      }),
    );
    fetchStatsTopTracks.mockResolvedValue(empty([]));
    fetchStatsTopCountries.mockResolvedValue(empty([]));
    fetchListenerGeo.mockResolvedValue(empty([]));
    fetchChannelEgressStats.mockResolvedValue(
      empty({ windowDays: 30, liveHlsBytes: 0, estimatedLiveHlsBytes: 0 }),
    );
    fetchChannelLiveStats.mockResolvedValue(
      empty({
        windowDays: 14,
        totalLiveSeconds: 0,
        totalBroadcasts: 0,
        peakDailyListeners: 0,
      }),
    );
    fetchStatsTopLists.mockResolvedValue(empty([]));
    fetchGrantEstimate.mockResolvedValue(empty(null));
  });

  it('refetches only the top lists when dimension or sort changes', async () => {
    const { result } = renderHook(() => useStatsData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchStatsSummary).toHaveBeenCalledTimes(1);
    expect(fetchStatsTopLists).toHaveBeenCalledTimes(1);

    act(() => result.current.setTopListDimension('artist'));
    await waitFor(() => expect(fetchStatsTopLists).toHaveBeenCalledTimes(2));

    act(() => result.current.setTopListSort('asc'));
    await waitFor(() => expect(fetchStatsTopLists).toHaveBeenCalledTimes(3));

    expect(fetchStatsSummary).toHaveBeenCalledTimes(1);
    expect(fetchStatsPlays).toHaveBeenCalledTimes(1);
    expect(fetchChannelEgressStats).toHaveBeenCalledTimes(1);
    expect(fetchChannelLiveStats).toHaveBeenCalledTimes(1);
    expect(fetchGrantEstimate).toHaveBeenCalledTimes(1);
  });

  it('falls back to the 30-day window for the "Custom" and "1 day" top lists', async () => {
    const { result } = renderHook(() => useStatsData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setRange('1'));
    await waitFor(() => expect(result.current.topRange).toBe('30'));
    expect(fetchStatsTopLists).toHaveBeenLastCalledWith('30', 'type', 'desc');
  });

  it('does not leave loading stuck when a request fails', async () => {
    fetchStatsSummary.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useStatsData());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
