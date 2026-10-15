import { relaunch } from '@tauri-apps/plugin-process';
import { check, type Update } from '@tauri-apps/plugin-updater';

import { initDesktopUpdates } from '../../tahti-web/src/lib/updates/desktopUpdates';

/** Hands tahti-web the Tauri updater: check the release feed, install, relaunch. */
export function installDesktopUpdater(): void {
  let pending: Update | null = null;
  globalThis.__TAHTI_NATIVE_UPDATER__ = {
    check: async () => {
      pending = await check();
      return pending
        ? { version: pending.version, notes: pending.body?.trim() || null }
        : null;
    },
    install: async (onProgress) => {
      if (!pending) {
        throw new Error('No update to install');
      }
      let total = 0;
      let received = 0;
      await pending.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength ?? 0;
          onProgress(0);
        } else if (event.event === 'Progress') {
          received += event.data.chunkLength;
          onProgress(total > 0 ? Math.round((received / total) * 100) : 0);
        } else {
          onProgress(100);
        }
      });
    },
    relaunch,
  };
}

export { initDesktopUpdates };
