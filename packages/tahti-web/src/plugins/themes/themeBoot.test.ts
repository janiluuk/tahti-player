import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

const BOOT_SCRIPT = readFileSync(
  join(__dirname, '../../../public/theme-boot.js'),
  'utf8',
);

function runBoot() {
  new Function(BOOT_SCRIPT)();
}

function bakeDefaultStyle() {
  const style = document.createElement('style');
  style.id = 'advanced-theme-boot';
  style.setAttribute('data-theme-for', 'custom:gruvbox');
  style.textContent = 'html:root{--background: baked;}';
  document.head.appendChild(style);
}

function storeBag(state: Record<string, unknown>) {
  localStorage.setItem(
    'tahti-web-theme',
    JSON.stringify({ state, version: 0 }),
  );
}

const bootStyle = () => document.getElementById('advanced-theme-boot');
const root = document.documentElement;

describe('theme-boot.js', () => {
  beforeEach(() => {
    localStorage.clear();
    bootStyle()?.remove();
    root.removeAttribute('data-theme');
    root.removeAttribute('data-theme-id');
    root.removeAttribute('data-custom-theme-id');
  });

  it('keeps the baked default theme on a first visit', () => {
    bakeDefaultStyle();
    runBoot();
    expect(bootStyle()?.textContent).toBe('html:root{--background: baked;}');
    expect(root.getAttribute('data-theme-id')).toBe('nuclear:default');
    expect(root.getAttribute('data-custom-theme-id')).toBe('custom:gruvbox');
    expect(root.getAttribute('data-theme')).toBeNull();
  });

  it('paints the cached CSS of the stored custom theme', () => {
    bakeDefaultStyle();
    storeBag({ themeId: 'custom:dracula', colorMode: 'dark' });
    localStorage.setItem('tahti-theme-css', 'html:root{--background: cached;}');
    runBoot();
    expect(bootStyle()?.textContent).toBe('html:root{--background: cached;}');
    expect(root.getAttribute('data-custom-theme-id')).toBe('custom:dracula');
    expect(root.getAttribute('data-theme')).toBe('dark');
  });

  it('drops the baked default for another custom theme with nothing cached', () => {
    bakeDefaultStyle();
    storeBag({ themeId: 'custom:nord', colorMode: 'light' });
    runBoot();
    expect(bootStyle()).toBeNull();
  });

  it('drops the baked default for a basic theme', () => {
    bakeDefaultStyle();
    storeBag({ themeId: 'nuclear:lagoon', colorMode: 'light' });
    runBoot();
    expect(bootStyle()).toBeNull();
    expect(root.getAttribute('data-theme-id')).toBe('nuclear:lagoon');
    expect(root.hasAttribute('data-custom-theme-id')).toBe(false);
  });

  it('ignores legacy keys once the theme store has saved its state', () => {
    storeBag({ themeId: 'nuclear:ember', colorMode: 'light' });
    localStorage.setItem('tahti-nuclear-theme-id', 'nuclear:aurora');
    localStorage.setItem('tahti-nuclear-dark', '1');
    runBoot();
    expect(root.getAttribute('data-theme-id')).toBe('nuclear:ember');
    expect(root.getAttribute('data-theme')).toBeNull();
  });

  it('reads legacy keys when the theme store has nothing saved', () => {
    localStorage.setItem('tahti-nuclear-theme-id', 'nuclear:aurora');
    localStorage.setItem('tahti-nuclear-dark', '1');
    runBoot();
    expect(root.getAttribute('data-theme-id')).toBe('nuclear:aurora');
    expect(root.getAttribute('data-theme')).toBe('dark');
  });
});
