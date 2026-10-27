// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ScheduledShow, StudioShowSeries } from '../../../api/shows';
import { useScheduleForm } from './useScheduleForm';

const {
  cancelScheduledShow,
  createShowSeries,
  fetchShowSchedule,
  fetchShowSeries,
  scheduleShowEpisode,
  updateShowSeriesRecurrence,
} = vi.hoisted(() => ({
  cancelScheduledShow: vi.fn(),
  createShowSeries: vi.fn(),
  fetchShowSchedule: vi.fn(),
  fetchShowSeries: vi.fn(),
  scheduleShowEpisode: vi.fn(),
  updateShowSeriesRecurrence: vi.fn(),
}));

vi.mock('../../../api/shows', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/shows')>();
  return {
    ...actual,
    cancelScheduledShow,
    createShowSeries,
    fetchShowSchedule,
    fetchShowSeries,
    scheduleShowEpisode,
    updateShowSeriesRecurrence,
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

const scheduled = (overrides: Partial<ScheduledShow>): ScheduledShow => ({
  id: 'slot-a',
  seriesId: 'show-a',
  startAt: '2030-01-10T18:00:00.000Z',
  episodeNumber: 1,
  title: 'Friday Frequency',
  description: null,
  tagline: null,
  venue: null,
  location: null,
  artworkUrl: null,
  showType: 'LIVE_SET',
  visibility: 'PUBLIC',
  autoPublish: true,
  ...overrides,
});

const NEXT_AT = '2030-01-05T18:30:00.000Z';

async function mountLoaded(options: {
  next?: Record<string, unknown>;
  series?: StudioShowSeries[];
  slots?: ScheduledShow[];
}) {
  fetchChannelSchedule.mockResolvedValue({
    data: {
      nextBroadcastAt: null,
      nextBroadcastNote: null,
      ...options.next,
    },
    meta: { source: 'mock' },
  });
  fetchUpcomingBroadcasts.mockResolvedValue({
    data: [],
    meta: { source: 'mock' },
  });
  fetchShowSchedule.mockResolvedValue({
    data: {
      series: options.series ?? [],
      scheduledShows: options.slots ?? [],
    },
    meta: { source: 'mock' },
  });
  fetchShowSeries.mockResolvedValue({
    data: options.series ?? [],
    meta: { source: 'mock' },
  });
  const hook = renderHook(() => useScheduleForm());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('useScheduleForm editor state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fills the fields from the saved next broadcast on load', async () => {
    const { result } = await mountLoaded({
      next: {
        nextBroadcastAt: NEXT_AT,
        nextBroadcastNote: 'Friday Frequency',
        nextBroadcastShowType: 'TALK',
        nextBroadcastMode: 'SINGLE',
        nextBroadcastDescription: 'Talk night',
        nextBroadcastCoverUrl: 'https://example.test/next.jpg',
        nextBroadcastDurationHours: 2,
      },
    });

    expect(result.current.date).not.toBe('');
    expect(result.current.time).not.toBe('');
    expect(result.current.note).toBe('Friday Frequency');
    expect(result.current.showType).toBe('TALK');
    expect(result.current.showMode).toBe('SINGLE');
    expect(result.current.showDescription).toBe('Talk night');
    expect(result.current.showCoverUrl).toBe('https://example.test/next.jpg');
    expect(result.current.durationHours).toBe(2);
  });

  it('stops loading when the schedule cannot be read', async () => {
    fetchChannelSchedule.mockRejectedValue(new Error('offline'));
    fetchUpcomingBroadcasts.mockResolvedValue({ data: [], meta: {} });
    fetchShowSchedule.mockResolvedValue({
      data: { series: [], scheduledShows: [] },
      meta: {},
    });

    const { result } = renderHook(() => useScheduleForm());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.schedule).toBeNull();
  });

  it('opens the editor on the next broadcast and selects its show by id', async () => {
    const { result } = await mountLoaded({
      next: {
        nextBroadcastAt: NEXT_AT,
        nextBroadcastNote: 'Friday Frequency',
        nextBroadcastShowId: 'show-b',
      },
      series: [show({ id: 'show-a' }), show({ id: 'show-b' })],
    });
    act(() => result.current.setDate(''));

    act(() => result.current.openEditor());

    expect(result.current.editorOpen).toBe(true);
    expect(result.current.date).not.toBe('');
    expect(result.current.selectedShowId).toBe('show-b');
  });

  it('opens a blank editor when no broadcast is planned', async () => {
    const { result } = await mountLoaded({ series: [show({})] });
    act(() => {
      result.current.selectShow('show-a');
      result.current.setDate('2030-01-01');
      result.current.setTime('20:00');
    });

    act(() => result.current.openEditor());

    expect(result.current.editorOpen).toBe(true);
    expect(result.current.date).toBe('');
    expect(result.current.time).toBe('');
    expect(result.current.note).toBe('');
    expect(result.current.showDescription).toBe('');
    expect(result.current.selectedShowId).toBe('');
  });

  it('picking a show copies its settings, including the minutes past the hour', async () => {
    const { result } = await mountLoaded({
      series: [
        show({
          id: 'show-r',
          intervalHours: 1,
          recurrenceDays: [1, 5],
          recurrenceDurationMin: 90,
          visibility: 'FAN_ONLY',
          autoPublish: false,
          episodeNumberEnabled: false,
          nextEpisodeNumber: 12,
        }),
      ],
    });

    act(() => result.current.selectShow('show-r'));

    expect(result.current.selectedShowId).toBe('show-r');
    expect(result.current.note).toBe('Friday Frequency');
    expect(result.current.frequencyDays).toEqual([1, 5]);
    expect(result.current.durationHours).toBe(1);
    expect(result.current.durationMinutes).toBe(30);
    expect(result.current.showVisibility).toBe('FAN_ONLY');
    expect(result.current.autoPublish).toBe(false);
    expect(result.current.episodeNumberEnabled).toBe(false);
    expect(result.current.nextEpisodeNumber).toBe(12);
  });

  it('a quick date sets both date and time', async () => {
    const { result } = await mountLoaded({});

    act(() => result.current.setQuickDate(new Date(NEXT_AT)));

    expect(result.current.date).not.toBe('');
    expect(result.current.time).not.toBe('');
  });

  it('schedules an episode in start order and closes the editor', async () => {
    const later = scheduled({
      id: 'slot-late',
      startAt: '2030-02-01T18:00:00.000Z',
    });
    const { result } = await mountLoaded({
      series: [show({ id: 'show-a' })],
      slots: [later],
    });
    scheduleShowEpisode.mockResolvedValue({
      ok: true,
      data: scheduled({
        id: 'slot-early',
        startAt: '2030-01-03T18:00:00.000Z',
      }),
    });
    act(() => {
      result.current.openEditor();
      result.current.selectShow('show-a');
      result.current.setDate('2030-01-03');
      result.current.setTime('20:00');
      result.current.setVenue(' Club ');
    });

    await act(async () => {
      await result.current.scheduleEpisode();
    });

    expect(scheduleShowEpisode).toHaveBeenCalledWith(
      'show-a',
      expect.objectContaining({ venue: 'Club', location: null }),
    );
    expect(result.current.scheduledShows.map((slot) => slot.id)).toEqual([
      'slot-early',
      'slot-late',
    ]);
    expect(result.current.editorOpen).toBe(false);
    expect(result.current.busy).toBe(false);
  });

  it('cancels an episode', async () => {
    const { result } = await mountLoaded({
      slots: [scheduled({ id: 'slot-a' }), scheduled({ id: 'slot-b' })],
    });
    cancelScheduledShow.mockResolvedValue({ ok: true, data: null });

    await act(async () => {
      await result.current.cancelEpisode('slot-a');
    });

    expect(result.current.scheduledShows.map((slot) => slot.id)).toEqual([
      'slot-b',
    ]);
  });

  it('saves and stops a recurring schedule', async () => {
    const original = show({ id: 'show-a', recurrenceEnabled: false });
    const { result } = await mountLoaded({ series: [original] });
    act(() => {
      result.current.selectShow('show-a');
      result.current.setDate('2030-01-03');
      result.current.setTime('20:00');
      result.current.setFrequencyDays([5]);
      result.current.setDurationMinutes(15);
    });
    updateShowSeriesRecurrence.mockResolvedValueOnce({
      ok: true,
      data: { ...original, recurrenceEnabled: true, recurrenceDays: [5] },
    });

    await act(async () => {
      await result.current.saveRecurringSchedule();
    });

    expect(updateShowSeriesRecurrence).toHaveBeenLastCalledWith(
      'show-a',
      expect.objectContaining({
        recurrenceDays: [5],
        recurrenceTimeOfDay: '20:00',
        recurrenceDurationMin: 135,
      }),
    );
    expect(result.current.shows[0]?.recurrenceEnabled).toBe(true);

    updateShowSeriesRecurrence.mockResolvedValueOnce({
      ok: true,
      data: { ...original, recurrenceEnabled: false, recurrenceDays: [] },
    });
    await act(async () => {
      await result.current.stopRecurringSchedule();
    });

    expect(result.current.shows[0]?.recurrenceEnabled).toBe(false);
    expect(result.current.frequencyDays).toEqual([]);
  });

  it('saving the next broadcast for a picked show keeps it selected and closes', async () => {
    const picked = show({ id: 'show-a', mode: 'SERIES' });
    const { result } = await mountLoaded({ series: [picked] });
    patchChannelSchedule.mockResolvedValue({
      ok: true,
      data: { nextBroadcastAt: NEXT_AT, nextBroadcastNote: picked.title },
    });
    act(() => {
      result.current.setEditorOpen(true);
      result.current.selectShow('show-a');
      result.current.setDate('2030-01-05');
      result.current.setTime('20:30');
    });

    await act(async () => {
      await result.current.saveSchedule();
    });

    expect(createShowSeries).not.toHaveBeenCalled();
    expect(patchChannelSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        nextBroadcastShowId: 'show-a',
        nextBroadcastNote: 'Friday Frequency',
        nextBroadcastDurationHours: 2,
      }),
    );
    expect(result.current.schedule?.nextBroadcastAt).toBe(NEXT_AT);
    expect(result.current.selectedShowId).toBe('show-a');
    expect(result.current.editorOpen).toBe(false);
  });

  it('a newly created show joins the list even when saving the broadcast fails', async () => {
    const { result } = await mountLoaded({ series: [show({ id: 'show-a' })] });
    createShowSeries.mockResolvedValue({
      ok: true,
      data: show({ id: 'show-new', title: 'Brand New' }),
    });
    patchChannelSchedule.mockResolvedValue({ ok: false, error: 'Nope' });
    act(() =>
      result.current.onBroadcastFieldsChange({
        title: 'Brand New',
        description: '',
        coverUrl: '',
        mode: 'SERIES',
        showType: 'LIVE_SET',
        durationHours: 1,
      }),
    );

    await act(async () => {
      await result.current.saveSchedule();
    });

    expect(result.current.shows.map((item) => item.id)).toEqual([
      'show-new',
      'show-a',
    ]);
    expect(result.current.busy).toBe(false);
    expect(result.current.selectedShowId).toBe('');
  });
});
