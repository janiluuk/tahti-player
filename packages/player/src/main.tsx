import '@tahti-player/tailwind-config';
import '@tahti-player/themes';
import '@tahti-player/i18n';

import { convertFileSrc } from '@tauri-apps/api/core';

import type { TahtiNativeCapabilities } from '../../tahti-web/src/lib/nativeCapabilities';
import type { TahtiNativeLibrary } from '../../tahti-web/src/lib/nativeLibrary';
import { mountTahtiApp } from '../../tahti-web/src/TahtiApp';
import { commands } from './services/tauri/bindings';
import { unwrapResult } from './services/tauri/results';

import '../../tahti-web/src/styles.css';

const nativeCapabilities: TahtiNativeCapabilities = { localLibrary: true };
globalThis.__TAHTI_NATIVE_CAPABILITIES__ = nativeCapabilities;
const nativeLibrary: TahtiNativeLibrary = {
  async list(search, offset) {
    return unwrapResult(await commands.libraryList(search, offset));
  },
  async import() {
    return unwrapResult(await commands.libraryImport());
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
};
globalThis.__TAHTI_NATIVE_LIBRARY__ = nativeLibrary;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root missing');
}

await mountTahtiApp(rootElement);
