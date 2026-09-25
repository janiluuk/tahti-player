import { describe, expect, it } from 'vitest';

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
  it('defaults to Nuclear Green in dark mode when nothing is stored', async () => {
    localStorage.clear();
    const { useThemeStore } = await import('./store');
    await useThemeStore.persist.rehydrate();
    useThemeStore.getState().init();
    const state = useThemeStore.getState();
    expect(state.themeId).toBe('custom:nuclear-green');
    expect(state.colorMode).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme-id')).toBe(
      'nuclear:default',
    );
    expect(document.getElementById('advanced-theme')?.textContent).toContain(
      '#0c1915',
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
