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

export type ArtistCatalog = {
  pinnedPlayables: TahtiPlayable[];
  pinnedTiles: Array<{ track: PublicProfileTrack; playable: TahtiPlayable }>;
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

/** Pinned tracks (newest pin first), the rest of the catalog, and releases (newest first). */
export function useArtistCatalog(profile: PublicProfile | null): ArtistCatalog {
  return useMemo(() => {
    if (!profile) {
      return EMPTY_CATALOG;
    }
    const artist = profile.artist.displayName;
    const slug = profile.channel?.slug;
    const pinnedTracks = [...profile.tracks]
      .filter((t) => isPinned(t))
      .sort((a, b) => (b.pinnedAt ?? '').localeCompare(a.pinnedAt ?? ''));
    const pinnedIds = new Set(pinnedTracks.map((t) => t.id));
    const toPlayable = (t: PublicProfileTrack) =>
      profileTrackToPlayable(t, artist, slug);

    const pinnedTiles = pinnedTracks
      .map((t) => ({ track: t, playable: toPlayable(t) }))
      .filter(
        (x): x is { track: PublicProfileTrack; playable: TahtiPlayable } =>
          Boolean(x.playable),
      );

    const releaseTiles = [...profile.releases]
      .sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''))
      .map((release) => ({
        release,
        playable: releaseToPlayable(release, artist, slug),
      }));

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
