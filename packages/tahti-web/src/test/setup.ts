import './animationFrames';
import '@testing-library/jest-dom';

import { Blob as NodeBlob } from 'node:buffer';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterAll, afterEach, vi } from 'vitest';

import { DEFAULT_LOCALE, i18n } from '@tahti-player/i18n';
import { setupDomMocks } from '@tahti-player/ui/test';

import { clearSnapshots } from '../lib/useSnapshotFetch';
import { installAnimationFrames } from './animationFrames';

// jsdom's Blob polyfill has no arrayBuffer()/text()/stream() — use Node's.
globalThis.Blob = NodeBlob as unknown as typeof Blob;

class MemoryStorage implements Storage {
  #store = new Map<string, string>();

  get length() {
    return this.#store.size;
  }

  clear(): void {
    this.#store.clear();
  }

  getItem(key: string): string | null {
    return this.#store.has(key) ? this.#store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.#store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.#store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#store.set(key, String(value));
  }
}

// jsdom doesn't reliably expose `localStorage`/`sessionStorage` as globals
// under vitest's jsdom environment bridging — provide real, working ones.
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = new MemoryStorage();
}
if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = new MemoryStorage();
}

setupDomMocks();

// Captured once per worker: with `isolate: false` a later file would
// otherwise read whatever URL an earlier file left behind.
const pristineHref = ((
  globalThis as { __tahtiTestPristineHref?: string }
).__tahtiTestPristineHref ??= window.location.href);

// A file that swaps `window.location` with Object.defineProperty (not
// vi.stubGlobal) would leave every later file reading a frozen fake URL while
// history.replaceState moves the real one.
const pristineLocation = ((
  globalThis as { __tahtiTestPristineLocation?: PropertyDescriptor }
).__tahtiTestPristineLocation ??= Object.getOwnPropertyDescriptor(
  window,
  'location',
)!);

// Dialog exits are springs: without this every close waits out the real
// animation before the dialog leaves the DOM.
MotionGlobalConfig.skipAnimations = true;
MotionGlobalConfig.instantAnimations = true;

// Testing Library registers its own auto-cleanup only when first imported,
// so under `isolate: false` every later file would keep the previous tests'
// DOM mounted.
afterEach(() => {
  cleanup();
  clearSnapshots();
});

// Runs once per test file. Under `isolate: false` files share a worker, so
// undo what a file may leave behind and drop the module cache: otherwise the
// next file reuses module state (stores, caches) and modules that were
// evaluated against this file's `vi.mock` factories.
afterAll(async () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  installAnimationFrames();
  const location = Object.getOwnPropertyDescriptor(window, 'location');
  if (
    location?.get !== pristineLocation.get ||
    location?.value !== pristineLocation.value
  ) {
    Object.defineProperty(window, 'location', pristineLocation);
  }
  // A test that shadows one of these Document.prototype getters with
  // Object.defineProperty would leave every later file with its value.
  for (const name of ['hidden', 'visibilityState']) {
    if (Object.getOwnPropertyDescriptor(document, name)?.configurable) {
      delete (document as unknown as Record<string, unknown>)[name];
    }
  }
  if (window.location.href !== pristineHref) {
    window.history.replaceState(null, '', pristineHref);
  }
  // user-event and Object.assign leave a getter-only navigator.clipboard
  // behind, which makes the next file's Object.assign(navigator, …) throw.
  if (Object.getOwnPropertyDescriptor(navigator, 'clipboard')?.configurable) {
    delete (navigator as { clipboard?: unknown }).clipboard;
  }
  localStorage.clear();
  sessionStorage.clear();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  for (const element of [document.documentElement, document.body]) {
    for (const name of element.getAttributeNames()) {
      element.removeAttribute(name);
    }
  }
  document.title = '';
  await i18n.changeLanguage(DEFAULT_LOCALE);
  vi.resetModules();
});
