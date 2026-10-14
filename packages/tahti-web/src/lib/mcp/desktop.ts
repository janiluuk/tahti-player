import { createDesktopServiceStore } from '../desktopService';

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

export const useDesktopMcpStore = createDesktopServiceStore({
  key: 'tahti-desktop-mcp-enabled',
  native: getNativeMcp,
  describe: (port) => `http://127.0.0.1:${port}/mcp`,
});

/** Starts the server at launch when it was left on. */
export function initDesktopMcp(): Promise<void> {
  return useDesktopMcpStore.getState().resume();
}
