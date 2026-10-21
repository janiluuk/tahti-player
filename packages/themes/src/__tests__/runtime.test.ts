import { describe, expect, it, vi } from 'vitest';

import {
  advancedThemeCSS,
  applyAdvancedTheme,
  clearAdvancedTheme,
  setBasicTheme,
  setThemeId,
} from '../index';

describe('runtime API', () => {
  it('sets data-theme-id via setThemeId', () => {
    setThemeId('nuclear:aurora');
    expect(document.documentElement.getAttribute('data-theme-id')).toBe(
      'nuclear:aurora',
    );
  });

  it('sets data-theme-id via setBasicTheme', () => {
    setBasicTheme('nuclear:ember');
    expect(document.documentElement.getAttribute('data-theme-id')).toBe(
      'nuclear:ember',
    );
  });

  it('injects and clears advanced theme style', () => {
    applyAdvancedTheme({ version: 1, name: 'X', vars: { radius: '10px' } });
    const style = document.getElementById('advanced-theme');
    expect(style).toBeTruthy();
    expect(style?.textContent).toMatchInlineSnapshot(
      `"html:root{--radius: 10px;}"`,
    );

    clearAdvancedTheme();
    expect(document.getElementById('advanced-theme')).toBeNull();
  });

  it('does not rewrite the style when the theme is unchanged', () => {
    const theme = { version: 1 as const, name: 'Y', vars: { radius: '4px' } };
    applyAdvancedTheme(theme);
    const style = document.getElementById('advanced-theme')!;
    const observer = vi.fn();
    const mo = new MutationObserver(observer);
    mo.observe(style, { childList: true, characterData: true, subtree: true });
    applyAdvancedTheme(theme);
    applyAdvancedTheme({ ...theme });
    mo.takeRecords().forEach(() => observer());
    mo.disconnect();
    expect(observer).not.toHaveBeenCalled();
    clearAdvancedTheme();
  });

  it('caches generated CSS per theme object', () => {
    const theme = { version: 1 as const, name: 'Z', vars: { radius: '2px' } };
    expect(advancedThemeCSS(theme)).toBe(advancedThemeCSS(theme));
    expect(advancedThemeCSS(theme)).toContain('--radius: 2px');
  });

  it('leaves data-theme-id alone when it already matches', () => {
    setThemeId('nuclear:lagoon');
    const spy = vi.spyOn(document.documentElement, 'setAttribute');
    setThemeId('nuclear:lagoon');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
