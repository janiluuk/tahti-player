import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { fetchFollowing, followArtist, unfollowArtist } from '../api/client';
import type { TahtiPlayable } from '../api/types';

export type FavoriteChannel = {
  slug: string;
  displayName: string;
  avatarUrl?: string | null;
};

export type FavoritePlaylist = {
  slug: string;
  name: string;
  ownerUsername?: string | null;
  coverUrl?: string | null;
};

export type HistoryEntry = {
  playable: TahtiPlayable;
  playedAt: string;
};

/**
 * Local-sourced tracks carry an ephemeral `streamUrl` (a `blob:` object URL
 * from the browser File-API fallback, or a Tauri `asset://` URL scoped to
 * the current app session) that stops resolving once the tab reloads or the
 * app restarts. Persisting it anyway would let "Play now" from history
 * silently fail against a dead URL, so it's dropped before it reaches
 * storage; playing a local entry again re-resolves via its id instead (see
 * `HistoryListSection`).
 */
function redactEphemeralStreamUrl(playable: TahtiPlayable): TahtiPlayable {
  if (playable.sourceProvider !== 'local' || !playable.streamUrl) {
    return playable;
  }
  return { ...playable, streamUrl: '' };
}

export type LibraryState = {
  /** Current storage scope: `anon` or user id. */
  scopeKey: string;
  syncNote: string | null;
  favoriteChannels: FavoriteChannel[];
  favoriteTracks: TahtiPlayable[];
  favoritePlaylists: FavoritePlaylist[];
  favoriteChannelDates: Record<string, string>;
  favoriteTrackDates: Record<string, string>;
  favoritePlaylistDates: Record<string, string>;
  heardFavoritePlaylists: string[];
  heardFavoriteArtists: string[];
  history: HistoryEntry[];
  toggleFavoriteChannel: (channel: FavoriteChannel) => void;
  isFavoriteChannel: (slug: string) => boolean;
  toggleFavoriteTrack: (track: TahtiPlayable) => void;
  toggleFavoritePlaylist: (playlist: FavoritePlaylist) => void;
  markFavoriteHeard: (kind: 'playlist' | 'artist', id: string) => void;
  isFavoriteTrack: (id: string) => boolean;
  pushHistory: (playable: TahtiPlayable) => void;
  clearHistory: () => void;
  mergeServerFollowing: (username: string) => Promise<void>;
  setScopeKey: (key: string) => void;
};

const MAX_HISTORY = 80;
const STORAGE_PREFIX = 'tahti-web:library';

let activeScope = 'anon';
// While `rehydrateLibraryForUser` clears in-memory state to avoid flashing
// the previous scope's data, that clear must not itself get persisted —
// otherwise it wipes the *new* scope's real storage before `persist.rehydrate()`
// gets a chance to read it back. See `rehydrateLibraryForUser`.
let suspendPersistWrites = false;

const scopedStorage = createJSONStorage(() => ({
  getItem: (name) => {
    const scoped = localStorage.getItem(`${name}:${activeScope}`);
    if (scoped) {
      return scoped;
    }
    // Migrate pre-namespaced anonymous library once.
    if (activeScope === 'anon') {
      const legacy = localStorage.getItem(name);
      if (legacy) {
        localStorage.setItem(`${name}:anon`, legacy);
        return legacy;
      }
    }
    return null;
  },
  setItem: (name, value) => {
    if (suspendPersistWrites) {
      return;
    }
    localStorage.setItem(`${name}:${activeScope}`, value);
  },
  removeItem: (name) => localStorage.removeItem(`${name}:${activeScope}`),
}));

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      scopeKey: 'anon',
      syncNote: null,
      favoriteChannels: [],
      favoriteTracks: [],
      favoritePlaylists: [],
      favoriteChannelDates: {},
      favoriteTrackDates: {},
      favoritePlaylistDates: {},
      heardFavoritePlaylists: [],
      heardFavoriteArtists: [],
      history: [],

      setScopeKey: (key) => set({ scopeKey: key }),

      toggleFavoriteChannel: (channel) => {
        const exists = get().favoriteChannels.some(
          (c) => c.slug === channel.slug,
        );
        set((s) => {
          const favoriteChannelDates = { ...s.favoriteChannelDates };
          if (exists) {
            delete favoriteChannelDates[channel.slug];
          } else {
            favoriteChannelDates[channel.slug] = new Date().toISOString();
          }
          return {
            favoriteChannels: exists
              ? s.favoriteChannels.filter((c) => c.slug !== channel.slug)
              : [channel, ...s.favoriteChannels],
            favoriteChannelDates,
          };
        });
        // Best-effort server sync via artist follows (username ≈ channel slug).
        if (activeScope !== 'anon') {
          void (exists
            ? unfollowArtist(channel.slug)
            : followArtist(channel.slug));
        }
      },

      isFavoriteChannel: (slug) =>
        get().favoriteChannels.some((c) => c.slug === slug),

      toggleFavoriteTrack: (track) => {
        set((s) => {
          const exists = s.favoriteTracks.some((t) => t.id === track.id);
          const favoriteTrackDates = { ...s.favoriteTrackDates };
          if (exists) {
            delete favoriteTrackDates[track.id];
          } else {
            favoriteTrackDates[track.id] = new Date().toISOString();
          }
          return {
            favoriteTracks: exists
              ? s.favoriteTracks.filter((t) => t.id !== track.id)
              : [track, ...s.favoriteTracks],
            favoriteTrackDates,
          };
        });
      },

      toggleFavoritePlaylist: (playlist) => {
        set((s) => {
          const exists = s.favoritePlaylists.some(
            (item) => item.slug === playlist.slug,
          );
          const favoritePlaylistDates = { ...s.favoritePlaylistDates };
          if (exists) {
            delete favoritePlaylistDates[playlist.slug];
          } else {
            favoritePlaylistDates[playlist.slug] = new Date().toISOString();
          }
          return {
            favoritePlaylists: exists
              ? s.favoritePlaylists.filter(
                  (item) => item.slug !== playlist.slug,
                )
              : [playlist, ...s.favoritePlaylists],
            favoritePlaylistDates,
          };
        });
      },

      markFavoriteHeard: (kind, id) => {
        set((s) => {
          const key =
            kind === 'playlist'
              ? 'heardFavoritePlaylists'
              : 'heardFavoriteArtists';
          return s[key].includes(id) ? s : { [key]: [...s[key], id] };
        });
      },

      isFavoriteTrack: (id) => get().favoriteTracks.some((t) => t.id === id),

      pushHistory: (playable) => {
        set((s) => {
          const next: HistoryEntry = {
            playable,
            playedAt: new Date().toISOString(),
          };
          const deduped = s.history.filter(
            (h) => h.playable.id !== playable.id,
          );
          return { history: [next, ...deduped].slice(0, MAX_HISTORY) };
        });
      },

      clearHistory: () => set({ history: [] }),

      mergeServerFollowing: async (username) => {
        const { data, meta } = await fetchFollowing(username);
        if (meta.source === 'mock' && import.meta.env.VITE_FORCE_MOCK !== '1') {
          set({
            syncNote:
              'Following could not be synced. Your saved artists remain available on this device.',
          });
          return;
        }
        if (data.length === 0 && meta.source !== 'api') {
          set({
            syncNote: 'Saved tracks and listening history stay on this device.',
          });
          return;
        }
        set((s) => {
          const bySlug = new Map(s.favoriteChannels.map((c) => [c.slug, c]));
          for (const u of data) {
            bySlug.set(u.username, {
              slug: u.username,
              displayName: u.displayName,
              avatarUrl: u.avatarUrl,
            });
          }
          return {
            favoriteChannels: [...bySlug.values()],
            syncNote:
              meta.source === 'api'
                ? 'Following is synced. Saved tracks and listening history stay on this device.'
                : 'Following is available offline. Saved tracks and listening history stay on this device.',
          };
        });
      },
    }),
    {
      name: STORAGE_PREFIX,
      version: 2,
      storage: scopedStorage,
      partialize: (s) => ({
        favoriteChannels: s.favoriteChannels,
        favoriteTracks: s.favoriteTracks,
        favoritePlaylists: s.favoritePlaylists,
        favoriteChannelDates: s.favoriteChannelDates,
        favoriteTrackDates: s.favoriteTrackDates,
        favoritePlaylistDates: s.favoritePlaylistDates,
        heardFavoritePlaylists: s.heardFavoritePlaylists,
        heardFavoriteArtists: s.heardFavoriteArtists,
        history: s.history.map((entry) => ({
          ...entry,
          playable: redactEphemeralStreamUrl(entry.playable),
        })),
        scopeKey: s.scopeKey,
      }),
    },
  ),
);

/** Switch localStorage namespace when auth user changes, then optionally pull follows. */
export async function rehydrateLibraryForUser(userId: string | null) {
  const nextScope = userId ?? 'anon';
  if (
    nextScope === activeScope &&
    useLibraryStore.getState().scopeKey === nextScope
  ) {
    return;
  }
  activeScope = nextScope;
  // Clear in-memory state so the UI doesn't flash the previous scope's data
  // while rehydrate is in flight — suspended so this reset itself doesn't
  // get written to the new scope's storage ahead of the real rehydrate read.
  suspendPersistWrites = true;
  useLibraryStore.setState({
    scopeKey: nextScope,
    favoriteChannels: [],
    favoriteTracks: [],
    favoritePlaylists: [],
    favoriteChannelDates: {},
    favoriteTrackDates: {},
    favoritePlaylistDates: {},
    heardFavoritePlaylists: [],
    heardFavoriteArtists: [],
    history: [],
    syncNote: null,
  });
  suspendPersistWrites = false;
  await useLibraryStore.persist.rehydrate();
  useLibraryStore.setState({ scopeKey: nextScope });
}
