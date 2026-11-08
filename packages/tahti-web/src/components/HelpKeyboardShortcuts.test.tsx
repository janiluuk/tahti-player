import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { applyLocale } from '../lib/locale';
import { HelpKeyboardShortcuts } from './HelpKeyboardShortcuts';

describe('HelpKeyboardShortcuts', () => {
  afterEach(async () => {
    cleanup();
    await applyLocale('en_US');
  });

  it('lists the shortcuts under stable section anchors', () => {
    const { container } = render(<HelpKeyboardShortcuts />);
    expect(screen.getByRole('heading', { name: 'Page tour' })).toBeTruthy();
    expect(screen.getByText('Next tour step')).toBeTruthy();
    expect(
      [
        ...container.querySelectorAll(
          '[data-testid="keyboard-shortcut-section"]',
        ),
      ].map((section) => section.id),
    ).toEqual(['page-tour', 'navigation', 'player', 'notes']);
  });

  it('follows the app language and keeps the anchors', async () => {
    await act(async () => {
      await applyLocale('fi_FI');
    });
    const { container } = render(<HelpKeyboardShortcuts />);
    expect(
      screen.getByRole('heading', { name: 'Sivun esittely' }),
    ).toBeTruthy();
    expect(screen.getByText('Seuraava esittelyvaihe')).toBeTruthy();
    expect(container.querySelector('#page-tour')).not.toBeNull();
  });
});
