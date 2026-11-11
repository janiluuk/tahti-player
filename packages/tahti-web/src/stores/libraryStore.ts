import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { i18n } from '@tahti-player/i18n';

import {
  fetchFollowing,
  followArtist,
  unfollowArtist,
  type FollowResult,
} from '../api/follows';
import type { TahtiPlayable } from '../api/types';

export type FavoriteChannel = {
  slug: string;
  displayName: string;
  avatarUrl?: string | null;
  username?: string;
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
  /** Favourite radio stations. Sounds are saved as account likes instead;
   * the persisted key stays so stored stations keep loading. */
  favoriteTracks: TahtiPlayable[];
  favoritePlaylists: FavoritePlaylist[];
  favoriteChannelDates: Record<string, string>;
  favoriteTrackDates: Record<string, string>;
  favoritePlaylistDates: Record<string, string>;
  heardFavoritePlaylists: string[];
  heardFavoriteArtists: string[];
  history: HistoryEntry[];
  toggleFavoriteChannel: (
    channel: FavoriteChannel,
  ) => Promise<FollowResult | null>;
  setFavoriteChannel: (channel: FavoriteChannel, favorite: boolean) => void;
  isFavoriteChannel: (slug: string) => boolean;
  toggleFavoriteStation: (station: TahtiPlayable) => void;
  /** Drops saved items by playable id, e.g. sounds moved to account likes. */
  removeFavoriteTracks: (ids: string[]) => void;
  toggleFavoritePlaylist: (playlist: FavoritePlaylist) => void;
  markFavoriteHeard: (kind: 'playlist' | 'artist', id: string) => void;
  pushHistory: (playable: TahtiPlayable) => void;
  clearHistory: () => void;
  mergeServerFollowing: (username: string) => Promise<void>;
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

      toggleFavoriteChannel: async (channel) => {
        const exists = get().favoriteChannels.some(
          (c) => c.slug === channel.slug,
        );
        get().setFavoriteChannel(channel, !exists);
        if (activeScope === 'anon') {
          return null;
        }
        const username = channel.username ?? channel.slug;
        const result = await (exists
          ? unfollowArtist(username)
          : followArtist(username));
        if (!result.ok && channel.username) {
          get().setFavoriteChannel(channel, exists);
        }
        return result;
      },

      setFavoriteChannel: (channel, favorite) => {
        set((s) => {
          const exists = s.favoriteChannels.some(
            (c) => c.slug === channel.slug,
          );
          if (exists === favorite) {
            return s;
          }
          const favoriteChannelDates = { ...s.favoriteChannelDates };
          if (favorite) {
            favoriteChannelDates[channel.slug] = new Date().toISOString();
          } else {
            delete favoriteChannelDates[channel.slug];
          }
          return {
            favoriteChannels: favorite
              ? [channel, ...s.favoriteChannels]
              : s.favoriteChannels.filter((c) => c.slug !== channel.slug),
            favoriteChannelDates,
          };
        });
      },

      isFavoriteChannel: (slug) =>
        get().favoriteChannels.some((c) => c.slug === slug),

      toggleFavoriteStation: (station) => {
        if (station.kind !== 'radio') {
          return;
        }
        set((s) => {
          const exists = s.favoriteTracks.some((t) => t.id === station.id);
          const favoriteTrackDates = { ...s.favoriteTrackDates };
          if (exists) {
            delete favoriteTrackDates[station.id];
          } else {
            favoriteTrackDates[station.id] = new Date().toISOString();
          }
          return {
            favoriteTracks: exists
              ? s.favoriteTracks.filter((t) => t.id !== station.id)
              : [station, ...s.favoriteTracks],
            favoriteTrackDates,
          };
        });
      },

      removeFavoriteTracks: (ids) => {
        if (ids.length === 0) {
          return;
        }
        const drop = new Set(ids);
        set((s) => {
          const favoriteTrackDates = { ...s.favoriteTrackDates };
          for (const id of drop) {
            delete favoriteTrackDates[id];
          }
          return {
            favoriteTracks: s.favoriteTracks.filter((t) => !drop.has(t.id)),
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
        if (
          meta.reason &&
          meta.reason !== 'VITE_FORCE_MOCK' &&
          import.meta.env.VITE_FORCE_MOCK !== '1'
        ) {
          set({
            syncNote: i18n.t('web:libraryStoreStates.followingNotSynced'),
          });
          return;
        }
        if (data.length === 0 && meta.source === 'mock') {
          set({
            syncNote: i18n.t('web:libraryStoreStates.savedOnDevice'),
          });
          return;
        }
        set((s) => {
          const bySlug = new Map(s.favoriteChannels.map((c) => [c.slug, c]));
          for (const u of data) {
            bySlug.set(u.username, {
              slug: u.username,
              username: u.username,
              displayName: u.displayName,
              avatarUrl: u.avatarUrl,
            });
          }
          return {
            favoriteChannels: [...bySlug.values()],
            syncNote:
              meta.source === 'api'
                ? i18n.t('web:libraryStoreStates.followingSynced')
                : i18n.t('web:libraryStoreStates.followingOffline'),
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
  if (userId && useLibraryStore.getState().history.length === 0) {
    const carried = signedOutHistory();
    if (carried.length > 0) {
      useLibraryStore.setState({ history: carried });
    }
  }
}

/** Listening history is kept per account in this browser and the API keeps
 * none, so an account's first sign-in here starts with the plays made while
 * signed out instead of an empty Recently played row. */
function signedOutHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:anon`);
    const history = raw
      ? (JSON.parse(raw) as { state?: { history?: unknown } }).state?.history
      : null;
    return Array.isArray(history) ? (history as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}
