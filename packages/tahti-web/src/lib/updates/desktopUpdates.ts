import { toast } from 'sonner';
import { create } from 'zustand';

/** A newer desktop release the updater found. */
export type DesktopUpdate = {
  version: string;
  notes: string | null;
};

/** What the desktop entry (`packages/player/src/main.tsx`) provides to update the app. */
export type TahtiNativeUpdater = {
  check: () => Promise<DesktopUpdate | null>;
  /** Downloads and installs the update `check` found; reports 0–100. */
  install: (onProgress: (percent: number) => void) => Promise<void>;
  relaunch: () => Promise<void>;
};

declare global {
  var __TAHTI_NATIVE_UPDATER__: TahtiNativeUpdater | undefined;
}

export function getNativeUpdater(): TahtiNativeUpdater | null {
  return globalThis.__TAHTI_NATIVE_UPDATER__ ?? null;
}

export type DesktopUpdateStatus =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'installing'
  | 'ready'
  | 'error';

type DesktopUpdateState = {
  status: DesktopUpdateStatus;
  update: DesktopUpdate | null;
  progress: number;
  error: string | null;
  checkOnStart: boolean;
  setCheckOnStart: (checkOnStart: boolean) => void;
  check: () => Promise<DesktopUpdate | null>;
  install: () => Promise<void>;
  relaunch: () => Promise<void>;
};

const CHECK_ON_START_KEY = 'tahti-desktop-update-check-off';

function readCheckOnStart(): boolean {
  try {
    return localStorage.getItem(CHECK_ON_START_KEY) !== '1';
  } catch {
    return true;
  }
}

function writeCheckOnStart(checkOnStart: boolean) {
  try {
    if (checkOnStart) {
      localStorage.removeItem(CHECK_ON_START_KEY);
    } else {
      localStorage.setItem(CHECK_ON_START_KEY, '1');
    }
  } catch {
    return;
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export const useDesktopUpdateStore = create<DesktopUpdateState>((set, get) => ({
  status: 'idle',
  update: null,
  progress: 0,
  error: null,
  checkOnStart: readCheckOnStart(),
  setCheckOnStart: (checkOnStart) => {
    writeCheckOnStart(checkOnStart);
    set({ checkOnStart });
  },
  check: async () => {
    const native = getNativeUpdater();
    const { status } = get();
    if (
      !native ||
      status === 'checking' ||
      status === 'installing' ||
      status === 'ready'
    ) {
      return get().update;
    }
    set({ status: 'checking', error: null });
    try {
      const update = await native.check();
      set({ status: update ? 'available' : 'up-to-date', update });
      return update;
    } catch (error) {
      set({ status: 'error', error: message(error) });
      return null;
    }
  },
  install: async () => {
    const native = getNativeUpdater();
    if (!native || get().status !== 'available') {
      return;
    }
    set({ status: 'installing', progress: 0, error: null });
    try {
      await native.install((progress) => set({ progress }));
      set({ status: 'ready', progress: 100 });
    } catch (error) {
      set({ status: 'error', error: message(error) });
    }
  },
  relaunch: async () => {
    const native = getNativeUpdater();
    if (!native) {
      return;
    }
    try {
      await native.relaunch();
    } catch (error) {
      set({ error: message(error) });
    }
  },
}));

const START_DELAY_MS = 10_000;
const RECHECK_MS = 6 * 60 * 60 * 1000;

async function checkAndAnnounce() {
  const store = useDesktopUpdateStore.getState();
  if (!store.checkOnStart || store.status === 'available') {
    return;
  }
  const update = await store.check();
  if (!update) {
    return;
  }
  toast.info(`Tahti Player ${update.version} is available`, {
    id: 'desktop-update',
    duration: Infinity,
    action: {
      label: 'Install',
      onClick: () => {
        void installAndOfferRestart();
      },
    },
  });
}

async function installAndOfferRestart() {
  await useDesktopUpdateStore.getState().install();
  const { status, error } = useDesktopUpdateStore.getState();
  if (status === 'ready') {
    toast.success('Update installed', {
      id: 'desktop-update',
      duration: Infinity,
      action: {
        label: 'Restart',
        onClick: () => {
          void useDesktopUpdateStore.getState().relaunch();
        },
      },
    });
  } else if (error) {
    toast.error(`Could not install the update: ${error}`, {
      id: 'desktop-update',
    });
  }
}

/** Checks for a new desktop release shortly after start and every six hours, unless turned off in Settings. */
export function initDesktopUpdates(): void {
  if (!getNativeUpdater()) {
    return;
  }
  setTimeout(() => void checkAndAnnounce(), START_DELAY_MS);
  setInterval(() => void checkAndAnnounce(), RECHECK_MS);
}
