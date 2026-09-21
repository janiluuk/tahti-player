import { vi } from 'vitest';

import type {
  NativeExportResult,
  NativeImportOutcome,
  NativeImportPreview,
  NativeLibraryTrack,
  NativePlaylistEntry,
  NativePlaylists,
  NativePlaylistSummary,
  NativeRawPlaylistEntry,
} from '../lib/nativeLibrary';

type Row = NativeRawPlaylistEntry & { unavailable?: boolean };

/**
 * In-memory stand-in for the native playlist commands, following the same
 * rules as the Rust side (entry ids, repeats, block moves counted among the
 * entries that stay, undo via restore/set-order) so UI tests exercise real flows.
 */
export function createFakePlaylists(
  tracks: Record<string, Partial<NativeLibraryTrack> & { title: string }> = {},
) {
  let counter = 0;
  const playlists = new Map<string, { name: string; rows: Row[] }>();
  const summary = (id: string): NativePlaylistSummary => {
    const playlist = playlists.get(id);
    if (!playlist) {
      throw new Error('Playlist not found');
    }
    return {
      id,
      name: playlist.name,
      trackCount: playlist.rows.length,
      durationSec: playlist.rows.reduce(
        (sum, row) => sum + (row.duration ?? 0),
        0,
      ),
      unavailableCount: playlist.rows.filter((row) => row.unavailable).length,
      createdAt: '2026-09-21 10:00:00',
      updatedAt: '2026-09-21 10:00:00',
    };
  };
  const nameTaken = (name: string, except?: string) =>
    [...playlists.entries()].some(
      ([id, playlist]) =>
        id !== except && playlist.name.toLowerCase() === name.toLowerCase(),
    );
  const rowsOf = (id: string) => {
    const playlist = playlists.get(id);
    if (!playlist) {
      throw new Error('Playlist not found');
    }
    return playlist;
  };

  const api: NativePlaylists = {
    list: vi.fn(async () =>
      [...playlists.keys()]
        .map(summary)
        .sort((a, b) => a.name.localeCompare(b.name)),
    ),
    create: vi.fn(async (name: string) => {
      if (nameTaken(name)) {
        throw new Error('A playlist with that name already exists.');
      }
      const id = `pl-${(counter += 1)}`;
      playlists.set(id, { name, rows: [] });
      return summary(id);
    }),
    rename: vi.fn(async (id: string, name: string) => {
      if (nameTaken(name, id)) {
        throw new Error('A playlist with that name already exists.');
      }
      rowsOf(id).name = name;
      return summary(id);
    }),
    duplicate: vi.fn(async (id: string) => {
      const source = rowsOf(id);
      const copyId = `pl-${(counter += 1)}`;
      playlists.set(copyId, {
        name: `${source.name} copy`,
        rows: source.rows.map((row) => ({
          ...row,
          entryId: `e-${(counter += 1)}`,
        })),
      });
      return summary(copyId);
    }),
    delete: vi.fn(async (id: string) => {
      playlists.delete(id);
    }),
    addTracks: vi.fn(
      async (id: string, trackIds: string[], at?: number | null) => {
        const playlist = rowsOf(id);
        const added: Row[] = trackIds
          .filter((trackId) => tracks[trackId])
          .map((trackId) => ({
            entryId: `e-${(counter += 1)}`,
            trackId,
            path: `/music/${trackId}.flac`,
            title: tracks[trackId]?.title ?? trackId,
            artist: tracks[trackId]?.artist ?? 'Artist',
            duration: tracks[trackId]?.duration ?? 100,
          }));
        if (at === undefined || at === null || at >= playlist.rows.length) {
          playlist.rows.push(...added);
        } else {
          playlist.rows.splice(at, 0, ...added);
        }
        return added.length;
      },
    ),
    entries: vi.fn(async (id: string, offset: number) => {
      const playlist = rowsOf(id);
      const page = playlist.rows.slice(offset, offset + 200);
      const entries: NativePlaylistEntry[] = page.map((row, index) => ({
        entryId: row.entryId,
        position: offset + index,
        track: row.trackId
          ? ({
              id: row.trackId,
              title: row.title,
              artist: row.artist,
              album: '',
              available: !row.unavailable,
              path: row.path,
            } as NativeLibraryTrack)
          : null,
        title: row.title,
        artist: row.artist,
        path: row.path,
        duration: row.duration,
        unavailable: Boolean(row.unavailable) || !row.trackId,
      }));
      return { entries, total: playlist.rows.length };
    }),
    entryIds: vi.fn(async (id: string) =>
      rowsOf(id).rows.map((row) => row.entryId),
    ),
    moveEntries: vi.fn(
      async (id: string, entryIds: string[], toIndex: number) => {
        const playlist = rowsOf(id);
        const wanted = new Set(entryIds);
        const moved = playlist.rows.filter((row) => wanted.has(row.entryId));
        const rest = playlist.rows.filter((row) => !wanted.has(row.entryId));
        const index = Math.min(toIndex, rest.length);
        playlist.rows = [
          ...rest.slice(0, index),
          ...moved,
          ...rest.slice(index),
        ];
      },
    ),
    removeEntries: vi.fn(async (id: string, entryIds: string[]) => {
      const playlist = rowsOf(id);
      const wanted = new Set(entryIds);
      const removed = playlist.rows.filter((row) => wanted.has(row.entryId));
      playlist.rows = playlist.rows.filter((row) => !wanted.has(row.entryId));
      return removed;
    }),
    restoreEntries: vi.fn(
      async (
        id: string,
        entries: NativeRawPlaylistEntry[],
        order: string[],
      ) => {
        const playlist = rowsOf(id);
        for (const entry of entries) {
          if (!playlist.rows.some((row) => row.entryId === entry.entryId)) {
            playlist.rows.push(entry);
          }
        }
        const byId = new Map(playlist.rows.map((row) => [row.entryId, row]));
        const ordered = order.flatMap((entryId) => byId.get(entryId) ?? []);
        const listed = new Set(order);
        playlist.rows = [
          ...ordered,
          ...playlist.rows.filter((row) => !listed.has(row.entryId)),
        ];
      },
    ),
    setOrder: vi.fn(async (id: string, order: string[]) => {
      const playlist = rowsOf(id);
      const byId = new Map(playlist.rows.map((row) => [row.entryId, row]));
      const ordered = order.flatMap((entryId) => byId.get(entryId) ?? []);
      const listed = new Set(order);
      playlist.rows = [
        ...ordered,
        ...playlist.rows.filter((row) => !listed.has(row.entryId)),
      ];
    }),
    trackIds: vi.fn(async (id: string) =>
      rowsOf(id).rows.flatMap((row) => (row.trackId ? [row.trackId] : [])),
    ),
    exportM3u: vi.fn(async (): Promise<NativeExportResult | null> => ({
      path: '/exports/list.m3u8',
      written: 0,
      outsideRoot: 0,
      absoluteFallback: 0,
    })),
    importPreview: vi.fn(async (): Promise<NativeImportPreview | null> => null),
    pickRelinkFolder: vi.fn(async (): Promise<string | null> => null),
    importCommit: vi.fn(
      async (_source: string, name: string): Promise<NativeImportOutcome> => {
        const playlist = await api.create(name);
        return { playlist, linked: 0, imported: 0, unresolved: 0 };
      },
    ),
    relinkEntry: vi.fn(async () => false),
  };

  return {
    api,
    /** Marks every entry of a track unavailable (missing file). */
    markMissing(trackId: string) {
      for (const playlist of playlists.values()) {
        for (const row of playlist.rows) {
          if (row.trackId === trackId) {
            row.unavailable = true;
          }
        }
      }
    },
    titles: (id: string) => rowsOf(id).rows.map((row) => row.title),
  };
}
