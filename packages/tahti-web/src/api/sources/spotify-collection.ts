import { apiBase } from '../http';
import { isForceMock } from '../mode';
import { requestJson } from '../request-json';

/** One Spotify track as tahti-org's import routes return it. */
export type SpotifyTrack = {
  uri: string;
  title: string;
  artists: string[];
  album: string | null;
  durationSec: number;
  coverUrl: string | null;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const message = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const MOCK_TRACK: SpotifyTrack = {
  uri: 'spotify:track:mock1',
  title: 'Night Drive',
  artists: ['Mock Artist'],
  album: 'Mock EP',
  durationSec: 214,
  coverUrl: null,
};

async function list(path: string): Promise<Result<SpotifyTrack[]>> {
  if (isForceMock()) {
    return { ok: true, data: [MOCK_TRACK] };
  }
  try {
    const { data } = await requestJson<{ tracks: SpotifyTrack[] }>(path);
    return { ok: true, data: data.tracks };
  } catch (err) {
    return { ok: false, error: message(err, 'Spotify lookup failed') };
  }
}

export const searchSpotify = (q: string) =>
  list(`/api/v1/imports/spotify/search?q=${encodeURIComponent(q)}`);

/** The catalogue of the Spotify artist linked in Add-ons → Spotify; empty
 * when none is linked. */
export const fetchMySpotifyTracks = () =>
  list('/api/v1/imports/spotify/me-tracks');

export const fetchSpotifyArtistTracks = (artistUrl: string) =>
  list(
    `/api/v1/imports/spotify/by-artist-url?artistUrl=${encodeURIComponent(artistUrl)}`,
  );

/** Spotify's CDN is reached through the API so the artist's IP never hits it. */
export const spotifyCoverUrl = (coverUrl: string) =>
  `${apiBase()}/api/v1/imports/spotify/cover?url=${encodeURIComponent(coverUrl)}`;

/** Adds an embed-only Sound for the track to the collection. */
export async function addSpotifyTrack(
  collectionId: string,
  spotifyUri: string,
): Promise<Result<{ soundId: string }>> {
  if (isForceMock()) {
    return { ok: true, data: { soundId: `spotify-${spotifyUri}` } };
  }
  try {
    const { data } = await requestJson<{ soundId: string }>(
      '/api/v1/imports/spotify/add',
      { method: 'POST', body: JSON.stringify({ collectionId, spotifyUri }) },
    );
    return { ok: true, data: { soundId: data.soundId } };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not add the track') };
  }
}
