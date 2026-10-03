import { useMemo } from 'react';

import type {
  PublicProfile,
  PublicProfileRelease,
  PublicProfileTrack,
  TahtiPlayable,
} from '../../api/types';
import {
  profileTrackToPlayable,
  releaseToPlayable,
} from '../../lib/artistProfile';
import { isPinned } from '../../lib/pinnedTracks';

export type ArtistPinnedTile =
  | {
      kind: 'release';
      release: PublicProfileRelease;
      playable: TahtiPlayable;
    }
  | { kind: 'track'; track: PublicProfileTrack; playable: TahtiPlayable };

export type ArtistCatalog = {
  pinnedPlayables: TahtiPlayable[];
  pinnedTiles: ArtistPinnedTile[];
  catalogPlayables: TahtiPlayable[];
  releaseTiles: Array<{
    release: PublicProfileRelease;
    playable: ReturnType<typeof releaseToPlayable>;
  }>;
};

const EMPTY_CATALOG: ArtistCatalog = {
  pinnedPlayables: [],
  pinnedTiles: [],
  catalogPlayables: [],
  releaseTiles: [],
};

const newestPinFirst = (
  a: { pinnedAt?: string | null },
  b: { pinnedAt?: string | null },
) => (b.pinnedAt ?? '').localeCompare(a.pinnedAt ?? '');

/**
 * Pinned releases then pinned tracks (newest pin first), the rest of the
 * catalog, and releases (pinned first, then newest first).
 */
export function useArtistCatalog(profile: PublicProfile | null): ArtistCatalog {
  return useMemo(() => {
    if (!profile) {
      return EMPTY_CATALOG;
    }
    const artist = profile.artist.displayName;
    const slug = profile.channel?.slug;
    const pinnedTracks = [...profile.tracks]
      .filter((t) => isPinned(t))
      .sort(newestPinFirst);
    const pinnedIds = new Set(pinnedTracks.map((t) => t.id));
    const toPlayable = (t: PublicProfileTrack) =>
      profileTrackToPlayable(t, artist, slug);

    const releaseTiles = [...profile.releases]
      .sort((a, b) => {
        const pinDiff = Number(isPinned(b)) - Number(isPinned(a));
        if (pinDiff !== 0) {
          return pinDiff;
        }
        return isPinned(a)
          ? newestPinFirst(a, b)
          : (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '');
      })
      .map((release) => ({
        release,
        playable: releaseToPlayable(release, artist, slug),
      }));

    const pinnedTiles: ArtistPinnedTile[] = [];
    for (const { release, playable } of releaseTiles) {
      if (playable && isPinned(release)) {
        pinnedTiles.push({ kind: 'release', release, playable });
      }
    }
    for (const track of pinnedTracks) {
      const playable = toPlayable(track);
      if (playable) {
        pinnedTiles.push({ kind: 'track', track, playable });
      }
    }

    return {
      pinnedPlayables: pinnedTracks
        .map(toPlayable)
        .filter((p): p is TahtiPlayable => Boolean(p)),
      pinnedTiles,
      catalogPlayables: profile.tracks
        .filter((t) => !pinnedIds.has(t.id))
        .map(toPlayable)
        .filter((p): p is TahtiPlayable => Boolean(p)),
      releaseTiles,
    };
  }, [profile]);
}
