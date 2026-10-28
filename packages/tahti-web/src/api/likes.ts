import { mockFixture } from './mock-overrides';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';
import { requestJson } from './request-json';
import type { TahtiPlayable } from './types';

/** GET /api/me/likes row — a track the signed-in listener liked. */
export type LikedTrack = {
  id: string;
  title: string;
  bannerUrl: string | null;
  /** Null when an access gate applies to this listener. */
  audioUrl: string | null;
  channelSlug: string;
  artistUsername: string;
  artistDisplayName: string;
  likedAt: string;
  url: string;
  /** Track-row extras (tahti-org #1017); absent on older APIs. */
  durationSec?: number | null;
  genre?: string | null;
  peaks?: number[] | null;
  createdAt?: string;
  downloadsEnabled?: boolean;
  likeCount?: number;
  playCount?: number;
  downloadCount?: number;
  commentCount?: number;
};

const likedTrackSources = new WeakMap<TahtiPlayable, LikedTrack>();

/** Genre, totals and the download flag for a liked-track row, from the API
 * item the playable was built from. */
export function likedTrackMeta(playable: TahtiPlayable) {
  const track = likedTrackSources.get(playable);
  if (!track) {
    return undefined;
  }
  return {
    genre: track.genre ?? null,
    downloadable: track.downloadsEnabled === true,
    stats: {
      releaseDate: track.createdAt ?? null,
      likes: track.likeCount,
      plays: track.playCount,
      downloads: track.downloadCount,
      comments: track.commentCount,
    },
  };
}

export function likedTrackToPlayable(track: LikedTrack): TahtiPlayable | null {
  if (!track.audioUrl) {
    return null;
  }
  const playable: TahtiPlayable = {
    id: `sound:${track.id}`,
    kind: 'sound',
    title: track.title,
    artist: track.artistDisplayName,
    coverUrl: track.bannerUrl ?? undefined,
    streamUrl: track.audioUrl,
    protocol: 'https',
    channelSlug: track.channelSlug,
    sourceProvider: 'tahti',
    durationSec: track.durationSec ?? undefined,
    releaseDate: track.createdAt ?? null,
    peaks: track.peaks ?? null,
  };
  likedTrackSources.set(playable, track);
  return playable;
}

/** The tracks you liked anywhere, newest first. Signed-out listeners and
 * mock sessions get an empty list. */
export async function fetchMyLikes(): Promise<{
  data: LikedTrack[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<{ items: LikedTrack[] }>(
      '/api/me/likes?limit=100',
    );
    return { data: data.items ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

/** A user's public liked tracks (`GET /api/v1/u/:username/likes`), newest
 * first. `showLikes` stays false unless the API says the user shows them, so
 * a failed request or an API without the route hides the list. */
export async function fetchUserLikes(username: string): Promise<{
  showLikes: boolean;
  data: LikedTrack[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const mock = mockFixture(
      'userLikes',
      { showLikes: false, items: [] },
      username,
    );
    return {
      showLikes: mock.showLikes,
      data: mock.showLikes ? mock.items : [],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{
      showLikes?: boolean;
      items?: LikedTrack[];
    }>(`/api/v1/u/${encodeURIComponent(username)}/likes?limit=20`);
    const showLikes = data.showLikes === true;
    return {
      showLikes,
      data: showLikes && Array.isArray(data.items) ? data.items : [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { showLikes: false, data: [], meta: apiErrorMeta(err) };
  }
}
