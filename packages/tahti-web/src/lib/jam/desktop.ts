import { createDesktopServiceStore } from '../desktopService';
import { watchJamState, type JamEventKind } from './bridge';

export type JamStarted = { port: number; lanAddress: string | null };

/** What the desktop entry (`packages/player/src/main.tsx`) provides to run the Tahti Jam server. */
export type TahtiNativeJam = {
  start: (pairingToken: string) => Promise<JamStarted>;
  stop: () => Promise<void>;
  send: (kind: JamEventKind, data: unknown) => void;
};

declare global {
  var __TAHTI_NATIVE_JAM__: TahtiNativeJam | undefined;
}

export function getNativeJam(): TahtiNativeJam | null {
  return globalThis.__TAHTI_NATIVE_JAM__ ?? null;
}

const TOKEN_KEY = 'tahti-desktop-jam-pairing';

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

let memoryToken: string | null = null;

/** The pairing code phones send with every request; kept until it is reset. */
export function pairingToken(): string {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      return stored;
    }
    const token = newToken();
    localStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch {
    memoryToken ??= newToken();
    return memoryToken;
  }
}

/** The address a phone opens: the token rides in the fragment, so it never reaches a server log. */
export function remoteUrl(started: JamStarted, token: string): string {
  const host = started.lanAddress ?? '127.0.0.1';
  return `http://${host}:${started.port}/remote#token=${token}`;
}

export const useDesktopJamStore = createDesktopServiceStore({
  key: 'tahti-desktop-jam-enabled',
  native: () => {
    const native = getNativeJam();
    return native
      ? { start: () => native.start(pairingToken()), stop: native.stop }
      : null;
  },
  describe: (started) => remoteUrl(started, pairingToken()),
});

/** Makes a new pairing code, so phones paired before have to scan again, and restarts the server with it. */
export async function resetJamPairing(): Promise<void> {
  const token = newToken();
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    memoryToken = token;
  }
  const store = useDesktopJamStore.getState();
  if (store.enabled) {
    await store.setEnabled(false);
    await useDesktopJamStore.getState().setEnabled(true);
  }
}

/** Starts the server at launch when it was left on, and keeps phones up to date. */
export async function initDesktopJam(): Promise<void> {
  const native = getNativeJam();
  if (!native) {
    return;
  }
  watchJamState((kind, data) => {
    if (useDesktopJamStore.getState().enabled) {
      native.send(kind, data);
    }
  });
  await useDesktopJamStore.getState().resume();
}
