// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DesktopLibraryPanel } from './DesktopLibraryPanel';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  globalThis.__TAHTI_NATIVE_CAPABILITIES__ = undefined;
});

describe('DesktopLibraryPanel on a plain browser build', () => {
  it('shows a "desktop app only" placeholder instead of the local-import UI', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: false };
    await act(async () => {
      root.render(<DesktopLibraryPanel />);
    });
    expect(container.textContent).toContain('Desktop app only');
    expect(container.textContent).not.toContain('Add audio files');
  });

  it('shows the local-import UI inside the desktop app', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    await act(async () => {
      root.render(<DesktopLibraryPanel />);
    });
    expect(container.textContent).not.toContain('Desktop app only');
  });
});
