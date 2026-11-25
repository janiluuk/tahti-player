import '@testing-library/jest-dom';

import { Blob as NodeBlob } from 'node:buffer';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterAll, afterEach, vi } from 'vitest';

import { DEFAULT_LOCALE, i18n } from '@tahti-player/i18n';
import { setupDomMocks } from '@tahti-player/ui/test';

import { clearSnapshots } from '../lib/useSnapshotFetch';

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
  // user-event and Object.assign leave a getter-only navigator.clipboard
  // behind, which makes the next file's Object.assign(navigator, …) throw.
  if (Object.getOwnPropertyDescriptor(navigator, 'clipboard')?.configurable) {
    delete (navigator as { clipboard?: unknown }).clipboard;
  }
  localStorage.clear();
  sessionStorage.clear();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('class');
  document.title = '';
  await i18n.changeLanguage(DEFAULT_LOCALE);
  vi.resetModules();
});
