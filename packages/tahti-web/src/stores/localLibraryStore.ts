import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TahtiPlayable } from '../api/types';

export type LocalLibraryTrack = {
  id: string;
  title: string;
  artist: string;
  fileName: string;
  /** Empty after reload until the user re-imports the same file. */
  objectUrl: string;
  addedAt: string;
};

type LocalLibraryState = {
  tracks: LocalLibraryTrack[];
  addFiles: (files: readonly File[]) => LocalLibraryTrack[];
  remove: (id: string) => void;
  clear: () => void;
};

const AUDIO_PREFIX = 'audio/';
const AUDIO_EXTENSION = /\.(aac|aif|aiff|flac|m4a|mp3|ogg|opus|wav|webm|wma)$/i;

export const LOCAL_LIBRARY_STORAGE_KEY = 'tahti-local-library';

export type PersistedLocalLibrary = {
  tracks: Array<Omit<LocalLibraryTrack, 'objectUrl'>>;
};

export function isAudioFile(file: File): boolean {
  if (file.type.startsWith(AUDIO_PREFIX)) {
    return true;
  }
  return AUDIO_EXTENSION.test(file.name);
}

export function fileStem(fileName: string): string {
  const trimmed = fileName.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0) {
    return trimmed || 'Untitled';
  }
  return trimmed.slice(0, dot);
}

export function isLocalTrackPlayable(track: LocalLibraryTrack): boolean {
  return Boolean(track.objectUrl);
}

export function playableFromLocalTrack(
  track: LocalLibraryTrack,
): TahtiPlayable | null {
  if (!isLocalTrackPlayable(track)) {
    return null;
  }
  return {
    id: `local:${track.id}`,
    kind: 'sound',
    title: track.title,
    artist: track.artist,
    streamUrl: track.objectUrl,
    protocol: 'https',
    sourceProvider: 'local',
  };
}

export function partializeLocalLibrary(
  state: LocalLibraryState,
): PersistedLocalLibrary {
  return {
    tracks: state.tracks.map(({ id, title, artist, fileName, addedAt }) => ({
      id,
      title,
      artist,
      fileName,
      addedAt,
    })),
  };
}

export function mergeLocalLibraryPersisted(
  persisted: unknown,
  current: LocalLibraryState,
): LocalLibraryState {
  const stored = persisted as PersistedLocalLibrary | undefined;
  if (!stored?.tracks?.length) {
    return current;
  }
  return {
    ...current,
    tracks: stored.tracks.map((track) => ({
      ...track,
      objectUrl: '',
    })),
  };
}

export const useLocalLibraryStore = create<LocalLibraryState>()(
  persist(
    (set, get) => ({
      tracks: [],
      addFiles: (files) => {
        const current = get().tracks;
        const next = [...current];
        const added: LocalLibraryTrack[] = [];
        for (const file of files) {
          if (!isAudioFile(file)) {
            continue;
          }
          const objectUrl = URL.createObjectURL(file);
          const existingIndex = next.findIndex(
            (track) =>
              track.fileName === file.name && !isLocalTrackPlayable(track),
          );
          if (existingIndex >= 0) {
            const existing = next[existingIndex]!;
            const restored: LocalLibraryTrack = {
              ...existing,
              objectUrl,
            };
            next[existingIndex] = restored;
            added.push(restored);
            continue;
          }
          const created: LocalLibraryTrack = {
            id: crypto.randomUUID(),
            title: fileStem(file.name),
            artist: 'Local file',
            fileName: file.name,
            objectUrl,
            addedAt: new Date().toISOString(),
          };
          next.push(created);
          added.push(created);
        }
        if (added.length > 0) {
          set({ tracks: next });
        }
        return added;
      },
      remove: (id) => {
        const current = get().tracks.find((track) => track.id === id);
        if (current?.objectUrl) {
          URL.revokeObjectURL(current.objectUrl);
        }
        set({ tracks: get().tracks.filter((track) => track.id !== id) });
      },
      clear: () => {
        for (const track of get().tracks) {
          if (track.objectUrl) {
            URL.revokeObjectURL(track.objectUrl);
          }
        }
        set({ tracks: [] });
      },
    }),
    {
      name: LOCAL_LIBRARY_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: partializeLocalLibrary,
      merge: (persisted, current) =>
        mergeLocalLibraryPersisted(persisted, current),
    },
  ),
);
