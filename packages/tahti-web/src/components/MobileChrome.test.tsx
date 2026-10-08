// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MobileDrawer } from './MobileChrome';

afterEach(cleanup);

function renderDrawer(onClose = vi.fn()) {
  render(
    <MobileDrawer open title="Navigate" onClose={onClose}>
      <a href="/listen">Listen</a>
      <a href="/radio">Radio</a>
    </MobileDrawer>,
  );
  return onClose;
}

describe('MobileDrawer', () => {
  it('focuses the panel on open, not the close button', () => {
    renderDrawer();

    const dialog = screen.getByRole('dialog', { name: 'Navigate' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement?.tagName).toBe('DIV');
  });

  it('wraps Shift+Tab from the panel to the last control', () => {
    renderDrawer();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(
      screen.getByRole('link', { name: 'Radio' }),
    );
  });

  it('closes on Escape', () => {
    const onClose = renderDrawer();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
