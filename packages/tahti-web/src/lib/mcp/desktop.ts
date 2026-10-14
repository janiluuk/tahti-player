import { create } from 'zustand';

/** What the desktop entry (`packages/player/src/main.tsx`) provides to run the MCP server. */
export type TahtiNativeMcp = {
  start: () => Promise<number>;
  stop: () => Promise<void>;
};

declare global {
  var __TAHTI_NATIVE_MCP__: TahtiNativeMcp | undefined;
}

export function getNativeMcp(): TahtiNativeMcp | null {
  return globalThis.__TAHTI_NATIVE_MCP__ ?? null;
}

const ENABLED_KEY = 'tahti-desktop-mcp-enabled';

function readEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeEnabled(enabled: boolean) {
  try {
    if (enabled) {
      localStorage.setItem(ENABLED_KEY, '1');
    } else {
      localStorage.removeItem(ENABLED_KEY);
    }
  } catch {
    return;
  }
}

type DesktopMcpState = {
  enabled: boolean;
  url: string | null;
  error: string | null;
  busy: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
};

export const useDesktopMcpStore = create<DesktopMcpState>((set, get) => ({
  enabled: readEnabled(),
  url: null,
  error: null,
  busy: false,
  setEnabled: async (enabled) => {
    const native = getNativeMcp();
    if (!native || get().busy) {
      return;
    }
    set({ busy: true, error: null });
    try {
      if (enabled) {
        const port = await native.start();
        set({ url: `http://127.0.0.1:${port}/mcp` });
      } else {
        await native.stop();
        set({ url: null });
      }
      writeEnabled(enabled);
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
}));

/** Starts the server at launch when it was left on. */
export async function initDesktopMcp(): Promise<void> {
  if (getNativeMcp() && readEnabled()) {
    await useDesktopMcpStore.getState().setEnabled(true);
  }
}
