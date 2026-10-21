import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { PublicProfile, PublicProfileRelease } from '../../api/types';
import { useArtistCatalog } from './useArtistCatalog';

const release = (
  id: string,
  releaseDate: string,
  pin: Partial<PublicProfileRelease> = {},
): PublicProfileRelease => ({
  id,
  title: id,
  type: 'EP',
  releaseDate,
  tracks: [
    {
      position: 1,
      title: `${id} intro`,
      soundId: `s-${id}`,
      playUrl: `https://cdn.test/${id}.mp3`,
    },
  ],
  ...pin,
});

const profile = (
  releases: PublicProfileRelease[],
  tracks: PublicProfile['tracks'] = [],
) =>
  ({
    artist: { username: 'nova', displayName: 'Nova' },
    channel: { slug: 'nova', state: 'LIVE' },
    releases,
    tracks,
  }) as unknown as PublicProfile;

describe('useArtistCatalog', () => {
  it('lists pinned releases before newer unpinned ones, newest pin first', () => {
    const { result } = renderHook(() =>
      useArtistCatalog(
        profile([
          release('new', '2026-09-01'),
          release('old-pin', '2024-01-01', {
            pinned: true,
            pinnedAt: '2026-05-01T00:00:00Z',
          }),
          release('recent-pin', '2023-01-01', {
            pinned: true,
            pinnedAt: '2026-08-01T00:00:00Z',
          }),
          release('mid', '2025-06-01'),
        ]),
      ),
    );
    expect(result.current.releaseTiles.map((t) => t.release.id)).toEqual([
      'recent-pin',
      'old-pin',
      'new',
      'mid',
    ]);
  });

  it('puts pinned releases ahead of pinned tracks on the Stage', () => {
    const { result } = renderHook(() =>
      useArtistCatalog(
        profile(
          [
            release('ep', '2025-01-01', {
              pinned: true,
              pinnedAt: '2026-01-01T00:00:00Z',
            }),
            release('single', '2026-01-01'),
          ],
          [
            {
              id: 't1',
              title: 'Pinned track',
              playUrl: 'https://cdn.test/t1.mp3',
              pinned: true,
              pinnedAt: '2026-09-01T00:00:00Z',
            } as PublicProfile['tracks'][number],
          ],
        ),
      ),
    );
    expect(
      result.current.pinnedTiles.map((t) =>
        t.kind === 'release'
          ? `release:${t.release.id}`
          : `track:${t.track.id}`,
      ),
    ).toEqual(['release:ep', 'track:t1']);
  });

  it('treats releases without a pin field as unpinned', () => {
    const { result } = renderHook(() =>
      useArtistCatalog(
        profile([release('a', '2024-01-01'), release('b', '2025-01-01')]),
      ),
    );
    expect(result.current.releaseTiles.map((t) => t.release.id)).toEqual([
      'b',
      'a',
    ]);
    expect(result.current.pinnedTiles).toEqual([]);
  });
});
