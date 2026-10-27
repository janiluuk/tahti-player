import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ThemeEditor } from './ThemeEditor';

describe('ThemeEditor', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.getElementById('advanced-theme')?.remove();
    const { useThemeStore } = await import('../plugins/themes');
    await useThemeStore.persist.rehydrate();
    useThemeStore.getState().init();
  });

  it('opens on the active theme and leaves its colours in place', async () => {
    const before = document.getElementById('advanced-theme')?.textContent;
    const { unmount } = render(<ThemeEditor />);

    expect(screen.getByLabelText('Name')).toHaveProperty('value', 'Gruvbox');
    expect(screen.getByTestId('theme-editor-token-background')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Import a theme' }),
    ).toBeTruthy();
    expect(document.getElementById('advanced-theme')?.textContent).toContain(
      'oklch(0.96 0.055 96)',
    );
    expect(document.getElementById('advanced-theme')?.textContent).toBe(before);

    unmount();
    expect(document.getElementById('advanced-theme')?.textContent).toBe(before);
  });
});
