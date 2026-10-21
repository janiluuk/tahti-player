import { createDesktopServiceStore } from '../desktopService';
import { watchMpdSubsystems, type MpdSubsystem } from './bridge';

/** What the desktop entry (`packages/player/src/main.tsx`) provides to run the MPD server. */
export type TahtiNativeMpd = {
  start: () => Promise<number>;
  stop: () => Promise<void>;
  notify: (subsystem: MpdSubsystem) => void;
};

declare global {
  var __TAHTI_NATIVE_MPD__: TahtiNativeMpd | undefined;
}

export function getNativeMpd(): TahtiNativeMpd | null {
  return globalThis.__TAHTI_NATIVE_MPD__ ?? null;
}

export const useDesktopMpdStore = createDesktopServiceStore({
  key: 'tahti-desktop-mpd-enabled',
  native: getNativeMpd,
  describe: (port) => `127.0.0.1:${port}`,
});

/** Starts the server at launch when it was left on, and keeps MPD `idle` clients told of changes. */
export async function initDesktopMpd(): Promise<void> {
  const native = getNativeMpd();
  if (!native) {
    return;
  }
  watchMpdSubsystems((subsystem) => {
    if (useDesktopMpdStore.getState().enabled) {
      native.notify(subsystem);
    }
  });
  await useDesktopMpdStore.getState().resume();
}
