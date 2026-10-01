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
};

export function likedTrackToPlayable(track: LikedTrack): TahtiPlayable | null {
  if (!track.audioUrl) {
    return null;
  }
  return {
    id: `sound:${track.id}`,
    kind: 'sound',
    title: track.title,
    artist: track.artistDisplayName,
    coverUrl: track.bannerUrl ?? undefined,
    streamUrl: track.audioUrl,
    protocol: 'https',
    channelSlug: track.channelSlug,
    sourceProvider: 'tahti',
  };
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
