import { afterEach, describe, expect, it } from 'vitest';

import { isDesktopApp } from './desktopApp';

describe('isDesktopApp', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).__TAURI_INTERNALS__;
  });

  it('is false in a plain browser', () => {
    expect(isDesktopApp()).toBe(false);
  });

  it('is true inside the Tauri webview', () => {
    (globalThis as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    expect(isDesktopApp()).toBe(true);
  });
});
