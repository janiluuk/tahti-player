import { getNativeLibrary } from './nativeLibrary';

/** True inside the Tahti Player desktop app (its native library bridge or
 * the Tauri webview), false in a browser. */
export function isDesktopApp(): boolean {
  return (
    getNativeLibrary() !== null ||
    (typeof globalThis === 'object' && '__TAURI_INTERNALS__' in globalThis)
  );
}
