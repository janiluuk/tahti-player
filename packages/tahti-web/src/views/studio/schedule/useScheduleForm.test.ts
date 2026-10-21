// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StudioShowSeries } from '../../../api/shows';
import { useScheduleForm } from './useScheduleForm';

const { createShowSeries, fetchShowSchedule, fetchShowSeries } = vi.hoisted(
  () => ({
    createShowSeries: vi.fn(),
    fetchShowSchedule: vi.fn(),
    fetchShowSeries: vi.fn(),
  }),
);

vi.mock('../../../api/shows', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/shows')>();
  return {
    ...actual,
    createShowSeries,
    fetchShowSchedule,
    fetchShowSeries,
  };
});

const { fetchChannelSchedule, fetchUpcomingBroadcasts, patchChannelSchedule } =
  vi.hoisted(() => ({
    fetchChannelSchedule: vi.fn(),
    fetchUpcomingBroadcasts: vi.fn(),
    patchChannelSchedule: vi.fn(),
  }));

vi.mock('../../../api/studio-extras', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../api/studio-extras')>();
  return {
    ...actual,
    fetchChannelSchedule,
    fetchUpcomingBroadcasts,
    patchChannelSchedule,
  };
});

const show = (overrides: Partial<StudioShowSeries>): StudioShowSeries => ({
  id: 'show-a',
  title: 'Friday Frequency',
  description: 'The real show',
  coverUrl: 'https://example.test/real-cover.jpg',
  showType: 'LIVE_SET',
  nextEpisodeNumber: 1,
  intervalHours: 2,
  scheduleNote: null,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('useScheduleForm upcoming-broadcast show linking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchChannelSchedule.mockResolvedValue({
      data: { nextBroadcastAt: null, nextBroadcastNote: null },
      meta: { source: 'mock' },
    });
  });

  it('links an upcoming broadcast to its show by showId, not by matching titles', async () => {
    // Two shows share a title — a title-based lookup would grab the wrong
    // one (or an arbitrary one); showId must resolve the exact show.
    const decoy = show({
      id: 'show-decoy',
      title: 'Friday Frequency',
      description: 'Wrong show — same title',
      coverUrl: 'https://example.test/decoy-cover.jpg',
      intervalHours: 1,
    });
    const real = show({ id: 'show-real', title: 'Friday Frequency' });
    fetchShowSchedule.mockResolvedValue({
      data: { series: [decoy, real], scheduledShows: [] },
      meta: { source: 'mock' },
    });
    fetchUpcomingBroadcasts.mockResolvedValue({
      data: [
        {
          id: 'upcoming-1',
          startAt: new Date(Date.now() + 3600_000).toISOString(),
          title: 'Friday Frequency',
          episodeNumber: 7,
          showType: 'LIVE_SET',
          visibility: 'PUBLIC',
          venue: null,
          location: null,
          showId: 'show-real',
        },
      ],
      meta: { source: 'mock' },
    });

    const { result } = renderHook(() => useScheduleForm());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const row = result.current.scheduledTimes.find(
      (item) => item.id === 'upcoming-1',
    );
    expect(row?.showId).toBe('show-real');
    expect(row?.description).toBe('The real show');
    expect(row?.artworkUrl).toBe('https://example.test/real-cover.jpg');
  });

  it('keeps the raw showId even when the show has not loaded locally yet', async () => {
    fetchShowSchedule.mockResolvedValue({
      data: { series: [], scheduledShows: [] },
      meta: { source: 'mock' },
    });
    fetchUpcomingBroadcasts.mockResolvedValue({
      data: [
        {
          id: 'upcoming-2',
          startAt: new Date(Date.now() + 3600_000).toISOString(),
          title: 'Some Show',
          episodeNumber: 1,
          showType: 'LIVE_SET',
          visibility: 'PUBLIC',
          venue: null,
          location: null,
          showId: 'show-not-yet-loaded',
        },
      ],
      meta: { source: 'mock' },
    });

    const { result } = renderHook(() => useScheduleForm());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const row = result.current.scheduledTimes.find(
      (item) => item.id === 'upcoming-2',
    );
    expect(row?.showId).toBe('show-not-yet-loaded');
  });
});

describe('useScheduleForm show tagline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchChannelSchedule.mockResolvedValue({
      data: { nextBroadcastAt: null, nextBroadcastNote: null },
      meta: { source: 'mock' },
    });
    fetchUpcomingBroadcasts.mockResolvedValue({
      data: [],
      meta: { source: 'mock' },
    });
  });

  it("loads a picked show's tagline and air time into separate fields", async () => {
    fetchShowSchedule.mockResolvedValue({
      data: {
        series: [
          show({
            id: 'show-t',
            tagline: 'Slow techno for a Friday',
            scheduleNote: 'Fridays 20:00',
          }),
        ],
        scheduledShows: [],
      },
      meta: { source: 'mock' },
    });

    const { result } = renderHook(() => useScheduleForm());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.selectShow('show-t'));

    expect(result.current.showTagline).toBe('Slow techno for a Friday');
    expect(result.current.showScheduleNote).toBe('Fridays 20:00');
  });

  it('creates a new show with its tagline and air time as separate fields', async () => {
    fetchShowSchedule.mockResolvedValue({
      data: { series: [], scheduledShows: [] },
      meta: { source: 'mock' },
    });
    const created = show({ id: 'show-new', title: 'New Show' });
    createShowSeries.mockResolvedValue({ ok: true, data: created });
    patchChannelSchedule.mockResolvedValue({
      ok: true,
      data: { nextBroadcastAt: null, nextBroadcastNote: 'New Show' },
    });

    const { result } = renderHook(() => useScheduleForm());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.onBroadcastFieldsChange({
        title: 'New Show',
        description: '',
        coverUrl: '',
        mode: 'SERIES',
        showType: 'LIVE_SET',
        durationHours: 1,
      });
      result.current.setShowTagline(' Slow techno for a Friday ');
      result.current.setShowScheduleNote('Fridays 20:00');
    });
    await act(async () => {
      await result.current.saveSchedule();
    });

    expect(createShowSeries).toHaveBeenCalledWith(
      expect.objectContaining({
        tagline: 'Slow techno for a Friday',
        scheduleNote: 'Fridays 20:00',
      }),
    );
  });
});
