// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  playableFromRadioStation,
  type RadioStation,
} from '../api/radio-sources';
import type { TahtiPlayable } from '../api/types';
import { rehydrateLibraryForUser, useLibraryStore } from './libraryStore';

const STATION: RadioStation = {
  id: 'https://ice1.somafm.com/groovesalad-256-mp3',
  name: 'SomaFM: Groove Salad',
  streamUrl: 'https://ice1.somafm.com/groovesalad-256-mp3',
  homepage: 'https://somafm.com/groovesalad/',
  tags: ['ambient', 'downtempo'],
  codec: 'MP3',
  bitrateKbps: 256,
  source: 'manual',
};

describe('libraryStore + internet radio stations', () => {
  beforeEach(async () => {
    localStorage.clear();
    // Reset to a clean anon scope between tests.
    await rehydrateLibraryForUser('library-store-test-reset');
    await rehydrateLibraryForUser(null);
  });

  it('adds a radio station (as a favorite track) to the library, and it can be found there', () => {
    const playable = playableFromRadioStation(STATION);

    expect(useLibraryStore.getState().isFavoriteTrack(playable.id)).toBe(false);

    useLibraryStore.getState().toggleFavoriteTrack(playable);

    expect(useLibraryStore.getState().isFavoriteTrack(playable.id)).toBe(true);
    expect(useLibraryStore.getState().favoriteTracks).toContainEqual(
      expect.objectContaining({
        id: `radio:${STATION.id}`,
        kind: 'radio',
        title: STATION.name,
        streamUrl: STATION.streamUrl,
      }),
    );
  });

  it('removes a previously-added radio station when toggled again', () => {
    const playable = playableFromRadioStation(STATION);

    useLibraryStore.getState().toggleFavoriteTrack(playable);
    expect(useLibraryStore.getState().isFavoriteTrack(playable.id)).toBe(true);

    useLibraryStore.getState().toggleFavoriteTrack(playable);
    expect(useLibraryStore.getState().isFavoriteTrack(playable.id)).toBe(false);
    expect(
      useLibraryStore
        .getState()
        .favoriteTracks.some((t) => t.id === playable.id),
    ).toBe(false);
  });

  it('prefers a live "now playing" title when favoriting, falling back to the station name', () => {
    const withNowPlaying = playableFromRadioStation(STATION, 'Ambient Mix #42');
    expect(withNowPlaying.title).toBe('Ambient Mix #42');
    expect(withNowPlaying.artist).toBe(STATION.name);

    const withoutNowPlaying = playableFromRadioStation(STATION, null);
    expect(withoutNowPlaying.title).toBe(STATION.name);
    expect(withoutNowPlaying.artist).toBe('Internet radio');
  });

  it('persists favorite radio stations under the per-user scoped storage key', async () => {
    const playable = playableFromRadioStation(STATION);
    await rehydrateLibraryForUser('user-radio-fan');
    useLibraryStore.getState().toggleFavoriteTrack(playable);

    const stored = localStorage.getItem('tahti-web:library:user-radio-fan');
    expect(stored).toContain(playable.id);

    // Switching scope away and back should not leak into another user's anon library.
    await rehydrateLibraryForUser(null);
    expect(useLibraryStore.getState().isFavoriteTrack(playable.id)).toBe(false);

    await rehydrateLibraryForUser('user-radio-fan');
    expect(useLibraryStore.getState().isFavoriteTrack(playable.id)).toBe(true);
  });

  it("keeps a local track's streamUrl in memory but strips it before persisting history", () => {
    const local: TahtiPlayable = {
      id: 'local:abc123',
      kind: 'sound',
      title: 'Local Track',
      artist: 'Local Artist',
      streamUrl: 'blob:tahti-web/dead-after-reload',
      protocol: 'https',
      sourceProvider: 'local',
    };
    useLibraryStore.getState().pushHistory(local);

    // In-memory state keeps the live URL for this session's own replay.
    expect(useLibraryStore.getState().history[0]?.playable.streamUrl).toBe(
      local.streamUrl,
    );

    // The persisted copy must not carry the ephemeral URL — it would be
    // dead (revoked blob:, or an asset:// scope reset) by the time a future
    // session reads it back.
    const stored = JSON.parse(
      localStorage.getItem('tahti-web:library:anon') ?? '{}',
    );
    expect(stored.state.history[0].playable.streamUrl).toBe('');
    expect(stored.state.history[0].playable.id).toBe(local.id);
  });

  it('does not redact streamUrl for non-local history entries', () => {
    const playable = playableFromRadioStation(STATION);
    useLibraryStore.getState().pushHistory(playable);

    const stored = JSON.parse(
      localStorage.getItem('tahti-web:library:anon') ?? '{}',
    );
    expect(stored.state.history[0].playable.streamUrl).toBe(playable.streamUrl);
  });
});
