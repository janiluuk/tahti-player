import type { FetchMeta } from '.././client';
import { apiErrorMeta, isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import { mockBookings, seedEpisodes } from './mock';
import {
  type PublicRadioShow,
  type PublicRadioShowEpisode,
  type StudioShowBooking,
} from './types';

export async function fetchPublicRadioShow(
  channelSlug: string,
): Promise<{ data: PublicRadioShow | null; meta: FetchMeta }> {
  if (isForceMock()) {
    const now = Date.now();
    const matchingBookings = mockBookings.filter(
      (booking) => booking.channelSlug === channelSlug,
    );
    const episodes = seedEpisodes();
    const mapBooking = (booking: StudioShowBooking): PublicRadioShowEpisode => {
      const episode = episodes.find(
        (candidate) => candidate.bookingId === booking.id,
      );
      return {
        id: booking.id,
        startAt: booking.startAt,
        endAt: booking.endAt,
        note: booking.note,
        showType: booking.showType,
        title: episode?.title,
        description: episode?.description,
        coverUrl: episode?.coverUrl,
        recording: episode?.soundId
          ? {
              soundId: episode.soundId,
              title: episode.title,
              channelItemUrl: `/channel/${booking.channelSlug}#archive-item-${episode.soundId}`,
            }
          : null,
      };
    };
    const upcoming = matchingBookings
      .filter((booking) => new Date(booking.endAt).getTime() > now)
      .map(mapBooking);
    const past = matchingBookings
      .filter((booking) => new Date(booking.endAt).getTime() <= now)
      .map(mapBooking);
    const first = matchingBookings[0];
    return {
      data: {
        artist: {
          displayName: first?.displayName ?? 'Demo Artist',
          username: channelSlug,
          avatarUrl: null,
          channelSlug,
          bio: null,
        },
        pastEpisodes: past,
        upcomingEpisodes: upcoming,
        nextShowAt: upcoming[0]?.startAt ?? null,
        lastShowAt: past[0]?.startAt ?? null,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PublicRadioShow>(
      `/api/v1/radio/show/${encodeURIComponent(channelSlug)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export type RadioShowNowPlayingTrack = {
  title: string;
  artistName: string;
  artistUsername: string | null;
  artworkUrl: string | null;
  durationSec: number | null;
  startedAt: string;
};

/** A channel's current rotation/live track for its Tahti Radio show page —
 * its own lightweight, independently-pollable endpoint (see
 * apps/api/src/routes/radio/index.ts in tahti-org), separate from
 * fetchPublicRadioShow so polling this doesn't re-fetch the whole
 * past/upcoming episode list every tick. */
export async function fetchRadioShowNowPlaying(
  channelSlug: string,
): Promise<{ data: RadioShowNowPlayingTrack | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return { data: null, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<{
      track: RadioShowNowPlayingTrack | null;
    }>(`/api/v1/radio/show/${encodeURIComponent(channelSlug)}/now-playing`);
    return { data: data.track, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export type RadioShowUpcomingTrack = {
  id: string;
  title: string;
  artistName: string;
  artistUsername: string | null;
  artworkUrl: string | null;
};

/** Upcoming tracks in the channel's curated rotation queue, starting after
 * the current track. Empty for a channel with no curated rotation
 * configured (most artist channels — this only applies to Tahti Selects-
 * style curated-rotation channels). */
export async function fetchRadioShowUpcoming(
  channelSlug: string,
): Promise<{ data: RadioShowUpcomingTrack[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<RadioShowUpcomingTrack[]>(
      `/api/v1/radio/show/${encodeURIComponent(channelSlug)}/upcoming`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export type PublicRadioSlot = {
  id: string;
  startAt: string;
  endAt: string;
  note: string | null;
  showType: 'LIVE_SET' | 'TALK';
  coverUrl: string | null;
  artist: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
    channelSlug: string | null;
  };
};

/** Public (no auth) calendar of booked live slots on Tahti Radio,
 * `GET /api/v1/radio/slots` in tahti-org. */
export async function fetchPublicRadioSlots(
  from: string,
  to: string,
): Promise<{ data: PublicRadioSlot[]; meta: FetchMeta }> {
  if (isForceMock()) {
    const start = new Date(from).getTime();
    const end = new Date(to).getTime();
    return {
      data: mockBookings
        .filter(
          (booking) =>
            new Date(booking.startAt).getTime() < end &&
            new Date(booking.endAt).getTime() > start,
        )
        .sort((a, b) => a.startAt.localeCompare(b.startAt))
        .map((booking) => ({
          id: booking.id,
          startAt: booking.startAt,
          endAt: booking.endAt,
          note: booking.note,
          showType: booking.showType,
          coverUrl: booking.coverUrl ?? null,
          artist: {
            displayName: booking.displayName,
            username: booking.username,
            avatarUrl: null,
            channelSlug: booking.channelSlug,
          },
        })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PublicRadioSlot[]>(
      `/api/v1/radio/slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}
