import { create, type StoreApi, type UseBoundStore } from 'zustand';

/** A desktop-only service the Tauri entry can start and stop. */
export type DesktopService<T> = {
  start: () => Promise<T>;
  stop: () => Promise<void>;
};

export type DesktopServiceState = {
  enabled: boolean;
  url: string | null;
  error: string | null;
  busy: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
  /** Starts the service at launch when it was left on. */
  resume: () => Promise<void>;
};

export type DesktopServiceStore = UseBoundStore<StoreApi<DesktopServiceState>>;

function readEnabled(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeEnabled(key: string, enabled: boolean) {
  try {
    if (enabled) {
      localStorage.setItem(key, '1');
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    return;
  }
}

/** On/off state for a desktop service, remembered in `localStorage` under `key`.
 * `describe` turns what `start` returned into the address shown in Settings. */
export function createDesktopServiceStore<T>(options: {
  key: string;
  native: () => DesktopService<T> | null;
  describe: (started: T) => string | null;
}): DesktopServiceStore {
  const { key, native, describe } = options;
  return create<DesktopServiceState>((set, get) => ({
    enabled: readEnabled(key),
    url: null,
    error: null,
    busy: false,
    setEnabled: async (enabled) => {
      const service = native();
      if (!service || get().busy) {
        return;
      }
      set({ busy: true, error: null });
      try {
        if (enabled) {
          set({ url: describe(await service.start()) });
        } else {
          await service.stop();
          set({ url: null });
        }
        writeEnabled(key, enabled);
        set({ enabled });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : String(error),
          url: null,
        });
      } finally {
        set({ busy: false });
      }
    },
    resume: async () => {
      if (native() && readEnabled(key)) {
        await get().setEnabled(true);
      }
    },
  }));
}
