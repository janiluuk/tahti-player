// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  MOBILE_PRIMARY_TABS,
  MobileBottomNav,
  MobileDrawer,
} from './MobileChrome';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

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
  });
});

describe('MobileBottomNav tabs', () => {
  it('lists Listen, Radio, Discover in the desktop sidebar order', () => {
    expect(MOBILE_PRIMARY_TABS.map((tab) => tab.id)).toEqual([
      'listen',
      'radio',
      'discover',
    ]);
  });
});

describe('MobileBottomNav', () => {
  it('grows by the gesture-bar inset instead of squeezing its items', async () => {
    const router = createRouter({
      routeTree: createRootRoute({ component: () => <MobileBottomNav /> }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    const nav = await screen.findByTestId('mobile-bottom-nav');
    expect(nav.className).toContain(
      'min-h-[calc(var(--mobile-nav-h,72px)+env(safe-area-inset-bottom))]',
    );
    expect(nav.className).not.toMatch(/(^|\s)h-16(\s|$)/);
    const link = nav.querySelector('a');
    expect(link?.className).toContain('text-xs');
  });

  it('marks the open section with a filled pill, bold label and top bar', async () => {
    const router = createRouter({
      routeTree: createRootRoute({ component: () => <MobileBottomNav /> }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    const nav = await screen.findByTestId('mobile-bottom-nav');
    const current = nav.querySelector('[aria-current="page"]');
    expect(current).not.toBeNull();
    expect(current?.className).toContain('font-bold');
    expect(
      current?.querySelector('[data-testid="mobile-nav-active-bar"]'),
    ).not.toBeNull();
    expect(current?.querySelector('.bg-primary\\/25')).not.toBeNull();
    expect(
      nav.querySelectorAll('[data-testid="mobile-nav-active-bar"]'),
    ).toHaveLength(1);
  });
});
