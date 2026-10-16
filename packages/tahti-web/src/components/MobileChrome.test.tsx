// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
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

  it('closes when the backdrop is tapped, which screen readers and Tab skip', () => {
    const onClose = renderDrawer();
    const scrim = screen.getByTestId('mobile-drawer-scrim');

    expect(scrim).toHaveAttribute('aria-hidden', 'true');
    expect(scrim).toHaveAttribute('tabindex', '-1');
    expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1);
    fireEvent.click(scrim);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    const onClose = renderDrawer();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show a Close tooltip over the first item right after open', () => {
    renderDrawer();

    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(screen.getByRole('link', { name: 'Listen' })).toBeVisible();
  });

  it('arms the Close tooltip after the open grace period', () => {
    vi.useFakeTimers();
    renderDrawer();
    expect(screen.queryByRole('tooltip')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    fireEvent.mouseEnter(
      screen.getByRole('button', { name: 'Close' }).parentElement!,
    );
    expect(screen.getByRole('tooltip')).toHaveTextContent('Close');
    vi.useRealTimers();
  });
});
