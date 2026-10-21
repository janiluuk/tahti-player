import '@testing-library/jest-dom';

import { Blob as NodeBlob } from 'node:buffer';

import { setupDomMocks } from '@tahti-player/ui/test';

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
