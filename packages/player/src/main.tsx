import '@tahti-player/tailwind-config';
import '@tahti-player/themes';
import '@tahti-player/i18n';

import { convertFileSrc } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWebview } from '@tauri-apps/api/webview';

import type { TahtiNativeCapabilities } from '../../tahti-web/src/lib/nativeCapabilities';
import {
  withReadCache,
  type NativeLibraryImportProgress,
  type TahtiNativeLibrary,
} from '../../tahti-web/src/lib/nativeLibrary';
import { mountTahtiApp } from '../../tahti-web/src/TahtiApp';
import { commands } from './services/tauri/bindings';
import { unwrapResult } from './services/tauri/results';

import '../../tahti-web/src/styles.css';

const nativeCapabilities: TahtiNativeCapabilities = { localLibrary: true };
globalThis.__TAHTI_NATIVE_CAPABILITIES__ = nativeCapabilities;
const baseNativeLibrary: TahtiNativeLibrary = {
  async list(search, offset, filter, sort, filters) {
    return unwrapResult(
      await commands.libraryList(
        search,
        offset,
        filter ?? null,
        filters ?? null,
        sort ?? null,
      ),
    );
  },
  async matchingIds(search, filter, sort, filters) {
    return unwrapResult(
      await commands.libraryMatchingIds(
        search,
        filter ?? null,
        filters ?? null,
        sort ?? null,
      ),
    );
  },
  async filterOptions() {
    return unwrapResult(await commands.libraryFilterOptions());
  },
  async prepareBatch(ids) {
    const batch = unwrapResult(await commands.libraryPreparePlayback(ids));
    return {
      unavailable: batch.unavailable,
      items: batch.items.map((item) => ({
        track: item.track,
        streamUrl: convertFileSrc(item.path, 'asset'),
      })),
    };
  },
  playlists: {
    async list() {
      return unwrapResult(await commands.playlistList());
    },
    async create(name) {
      return unwrapResult(await commands.playlistCreate(name));
    },
    async rename(id, name) {
      return unwrapResult(await commands.playlistRename(id, name));
    },
    async duplicate(id) {
      return unwrapResult(await commands.playlistDuplicate(id));
    },
    async delete(id) {
      unwrapResult(await commands.playlistDelete(id));
    },
    async addTracks(id, trackIds, at) {
      return unwrapResult(
        await commands.playlistAddTracks(id, trackIds, at ?? null),
      );
    },
    async entries(id, offset) {
      return unwrapResult(await commands.playlistEntries(id, offset));
    },
    async entryIds(id) {
      return unwrapResult(await commands.playlistEntryIds(id));
    },
    async moveEntries(id, entryIds, toIndex) {
      unwrapResult(await commands.playlistMoveEntries(id, entryIds, toIndex));
    },
    async removeEntries(id, entryIds) {
      return unwrapResult(await commands.playlistRemoveEntries(id, entryIds));
    },
    async restoreEntries(id, entries, order) {
      unwrapResult(
        await commands.playlistRestoreEntries(
          id,
          entries.map((entry) => ({ ...entry, duration: entry.duration ?? 0 })),
          order,
        ),
      );
    },
    async setOrder(id, order) {
      unwrapResult(await commands.playlistSetOrder(id, order));
    },
    async trackIds(id) {
      return unwrapResult(await commands.playlistTrackIds(id));
    },
  },
  async facets(kind) {
    return unwrapResult(await commands.libraryFacets(kind));
  },
  async totals() {
    return unwrapResult(await commands.libraryTotals());
  },
  async import() {
    return unwrapResult(await commands.libraryImport());
  },
  async importFolder() {
    return unwrapResult(await commands.libraryImportFolder());
  },
  async importPaths(paths) {
    return unwrapResult(await commands.libraryImportPaths(paths));
  },
  async cancelImport() {
    unwrapResult(await commands.libraryImportCancel());
  },
  async resolve(id) {
    return convertFileSrc(
      unwrapResult(await commands.libraryResolve(id)),
      'asset',
    );
  },
  async remove(id) {
    unwrapResult(await commands.libraryRemove(id));
  },
  async removeMany(ids) {
    return unwrapResult(await commands.libraryRemoveMany(ids));
  },
  async reveal(id) {
    unwrapResult(await commands.libraryReveal(id));
  },
  async listUnavailable() {
    return unwrapResult(await commands.libraryListUnavailable());
  },
  async rescan() {
    return unwrapResult(await commands.libraryRescan());
  },
  async relink(id) {
    return unwrapResult(await commands.libraryRelink(id));
  },
  async listRoots() {
    return unwrapResult(await commands.libraryListRoots());
  },
  async addRoot() {
    return unwrapResult(await commands.libraryAddRoot());
  },
  async removeRoot(id) {
    unwrapResult(await commands.libraryRemoveRoot(id));
  },
  async rescanRoots() {
    return unwrapResult(await commands.libraryRescanRoots());
  },
  async relinkRoot(id) {
    return unwrapResult(await commands.libraryRelinkRoot(id));
  },
  onImportProgress(listener) {
    let unlisten: (() => void) | undefined;
    let disposed = false;
    void listen<NativeLibraryImportProgress>(
      'library://import-progress',
      (event) => listener(event.payload),
    ).then((dispose) => {
      if (disposed) {
        dispose();
      } else {
        unlisten = dispose;
      }
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  },
  onFilesDropped(listener) {
    let unlisten: (() => void) | undefined;
    let disposed = false;
    void getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === 'drop') {
          listener(event.payload.paths);
        }
      })
      .then((dispose) => {
        if (disposed) {
          dispose();
        } else {
          unlisten = dispose;
        }
      });
    return () => {
      disposed = true;
      unlisten?.();
    };
  },
};
globalThis.__TAHTI_NATIVE_LIBRARY__ = withReadCache(baseNativeLibrary);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root missing');
}

await mountTahtiApp(rootElement);
