import { getJson } from './http';
import { mockFixture } from './mock-overrides';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

export type PublicChannelScheduleShow = {
  id: string;
  seriesId: string;
  startAt: string;
  endAt: string | null;
  durationMin: number | null;
  title: string;
  episodeNumber: number | null;
  showType: 'LIVE_SET' | 'TALK';
};

export type PublicChannelScheduleSeries = {
  id: string;
  name: string;
  scheduleNote: string | null;
};

export type PublicChannelSchedule = {
  shows: PublicChannelScheduleShow[];
  series: PublicChannelScheduleSeries[];
};

function mockSchedule(): PublicChannelSchedule {
  const day = 86_400_000;
  const at = (offsetDays: number) =>
    new Date(Date.now() + offsetDays * day).toISOString();
  return {
    shows: [
      {
        id: 'sched-mock-1',
        seriesId: 'series-mock-1',
        startAt: at(2),
        endAt: null,
        durationMin: 120,
        title: 'Night Drive Sessions #12',
        episodeNumber: 12,
        showType: 'LIVE_SET',
      },
      {
        id: 'sched-mock-2',
        seriesId: 'series-mock-1',
        startAt: at(9),
        endAt: null,
        durationMin: 120,
        title: 'Night Drive Sessions #13',
        episodeNumber: 13,
        showType: 'LIVE_SET',
      },
    ],
    series: [
      {
        id: 'series-mock-1',
        name: 'Night Drive Sessions',
        scheduleNote: 'Every Friday night',
      },
    ],
  };
}

/**
 * A channel's upcoming public live shows
 * (`GET /api/channels/:slug/schedule`); empty with an error meta on failure.
 */
export async function fetchChannelSchedule(slug: string): Promise<{
  data: PublicChannelSchedule;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockFixture('channelSchedule', mockSchedule(), slug),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<Partial<PublicChannelSchedule>>(
      `/api/channels/${encodeURIComponent(slug)}/schedule`,
    );
    return {
      data: {
        shows: Array.isArray(data.shows) ? data.shows : [],
        series: Array.isArray(data.series) ? data.series : [],
      },
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: { shows: [], series: [] }, meta: apiErrorMeta(err) };
  }
}
