import { describe, expect, it, vi } from 'vitest';

import { isDynamicDark } from './store';

describe('isDynamicDark', () => {
  it.each([
    [0, true],
    [6, true],
    [7, false],
    [12, false],
    [18, false],
    [19, true],
    [23, true],
  ])('hour %s -> dark %s', (hour, expected) => {
    const date = new Date(2026, 0, 1, hour);
    expect(isDynamicDark(date)).toBe(expected);
  });
});

describe('first-run theme', () => {
  it('defaults to Gruvbox in light mode when nothing is stored', async () => {
    localStorage.clear();
    const { useThemeStore } = await import('./store');
    await useThemeStore.persist.rehydrate();
    useThemeStore.getState().init();
    const state = useThemeStore.getState();
    expect(state.themeId).toBe('custom:gruvbox');
    expect(state.colorMode).toBe('light');
    expect(document.documentElement.getAttribute('data-theme-id')).toBe(
      'nuclear:default',
    );
    expect(document.getElementById('advanced-theme')?.textContent).toContain(
      'oklch(0.96 0.055 96)',
    );
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });
});

describe('theme persistence', () => {
  it('keeps shipped presets out of localStorage and caches the active CSS', async () => {
    localStorage.clear();
    const { useThemeStore } = await import('./store');
    await useThemeStore.persist.rehydrate();
    useThemeStore.getState().init();
    useThemeStore.getState().setTheme('custom:dracula');
    const bag = JSON.parse(localStorage.getItem('tahti-web-theme') ?? '{}');
    expect(bag.state.customThemes).toEqual({});
    expect(localStorage.getItem('tahti-theme-css')).toBe(
      document.getElementById('advanced-theme')?.textContent,
    );
    useThemeStore.getState().setTheme('nuclear:lagoon');
    expect(localStorage.getItem('tahti-theme-css')).toBeNull();
  });

  it('removes the boot-painted theme style once the theme is applied', async () => {
    const boot = document.createElement('style');
    boot.id = 'advanced-theme-boot';
    document.head.appendChild(boot);
    const { useThemeStore } = await import('./store');
    useThemeStore.getState().setTheme('custom:nord');
    expect(document.getElementById('advanced-theme-boot')).toBeNull();
  });

  it('replaces stale stored preset copies with the shipped preset, keeping a rename', async () => {
    localStorage.clear();
    localStorage.setItem(
      'tahti-web-theme',
      JSON.stringify({
        state: {
          themeId: 'custom:nord',
          colorMode: 'dark',
          customThemes: {
            'custom:nord': { version: 1, name: 'My Nord', vars: {} },
            'custom:gruvbox': { version: 1, name: 'Gruvbox', vars: {} },
          },
        },
        version: 0,
      }),
    );
    const { useThemeStore } = await import('./store');
    await useThemeStore.persist.rehydrate();
    const { customThemes } = useThemeStore.getState();
    expect(customThemes['custom:nord'].name).toBe('My Nord');
    expect(
      Object.keys(customThemes['custom:nord'].vars ?? {}).length,
    ).toBeGreaterThan(0);
    expect(
      Object.keys(customThemes['custom:gruvbox'].vars ?? {}).length,
    ).toBeGreaterThan(0);
    useThemeStore.getState().setTheme('custom:gruvbox');
    const bag = JSON.parse(localStorage.getItem('tahti-web-theme') ?? '{}');
    expect(Object.keys(bag.state.customThemes)).toEqual(['custom:nord']);
  });
});

describe('theme document state', () => {
  it('marks the active custom theme on the root element', async () => {
    const { useThemeStore } = await import('./store');
    useThemeStore.getState().setTheme('custom:tahti-blue');
    expect(document.documentElement.getAttribute('data-custom-theme-id')).toBe(
      'custom:tahti-blue',
    );
    useThemeStore.getState().setTheme('nuclear:ember');
    expect(document.documentElement.hasAttribute('data-custom-theme-id')).toBe(
      false,
    );
  });

  it('no longer writes the legacy theme keys', async () => {
    localStorage.clear();
    const { useThemeStore } = await import('./store');
    useThemeStore.getState().setTheme('nuclear:aurora');
    useThemeStore.getState().setDark(true);
    expect(localStorage.getItem('tahti-nuclear-theme-id')).toBeNull();
    expect(localStorage.getItem('tahti-nuclear-dark')).toBeNull();
  });

  it('runs the day/night timer only in dynamic mode', async () => {
    const { useThemeStore } = await import('./store');
    useThemeStore.getState().setColorMode('light');
    const started = vi.spyOn(globalThis, 'setInterval');
    const stopped = vi.spyOn(globalThis, 'clearInterval');
    try {
      useThemeStore.getState().setColorMode('light');
      expect(started).not.toHaveBeenCalled();
      useThemeStore.getState().setColorMode('dynamic');
      useThemeStore.getState().setColorMode('dynamic');
      expect(started).toHaveBeenCalledTimes(1);
      const id = started.mock.results[0].value;
      useThemeStore.getState().setColorMode('dark');
      expect(stopped).toHaveBeenCalledWith(id);
    } finally {
      started.mockRestore();
      stopped.mockRestore();
    }
  });
});
