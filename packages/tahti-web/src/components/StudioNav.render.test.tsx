// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../test/renderWithRouter';
import { hasStudioNestedNav, StudioNav, SUBMENUS } from './StudioNav';

vi.mock('../hooks/useStripeConfigured', () => ({
  useStripeConfigured: () => false,
}));

afterEach(cleanup);

const nestedTabRows = () => screen.queryAllByTestId('studio-nested-nav');

describe('StudioNav', () => {
  it('renders the Studio row as links, not tabs, with the current page marked', async () => {
    await renderWithRouter(<StudioNav current="/studio" />);

    const studio = screen.getByRole('navigation', { name: 'Studio pages' });
    expect(screen.queryByRole('tablist')).toBeNull();
    const current = within(studio).getByRole('link', { name: 'Home' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.className).toContain('border-foreground');
    expect(current.className).not.toContain('bg-primary');
    expect(current.querySelector('svg')).toBeNull();
    expect(
      within(studio).getByRole('link', { name: 'Music' }),
    ).not.toHaveAttribute('aria-current');
    expect(nestedTabRows()).toHaveLength(0);
  });

  it('keeps the Studio tab order', async () => {
    await renderWithRouter(<StudioNav current="/studio" />);
    const studio = screen.getByRole('navigation', { name: 'Studio pages' });
    expect(
      within(studio)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Home',
      'Music',
      'Broadcast',
      'Channel',
      'Fans',
      'Stats',
      'Profile',
    ]);
  });

  it('shows the three Broadcast pages as a filled sub-nav on Broadcast pages', async () => {
    for (const [current, page] of [
      ['/studio/go-live?step=credentials', 'Go live'],
      ['/studio/schedule?show=events', 'Schedule'],
      ['/studio/events/new', 'Schedule'],
    ] as const) {
      const { unmount } = await renderWithRouter(
        <StudioNav current={current} />,
      );
      const broadcast = screen.getByRole('navigation', {
        name: 'Broadcast pages',
      });
      expect(
        within(broadcast)
          .getAllByRole('link')
          .map((link) => link.textContent),
      ).toEqual(['Go live', 'Schedule', 'Shows']);
      const active = within(broadcast).getByRole('link', { name: page });
      expect(active, current).toHaveAttribute('aria-current', 'page');
      expect(active.className).toContain('bg-background-input');
      expect(
        screen
          .getByRole('navigation', { name: 'Studio pages' })
          .querySelector('[aria-current="page"]')?.textContent,
      ).toBe('Broadcast');
      unmount();
    }
    await renderWithRouter(<StudioNav current="/studio/broadcast" />);
    expect(
      screen.queryByRole('navigation', { name: 'Broadcast pages' }),
    ).toBeNull();
  });

  it('shows the Channel pages as a filled sub-nav under the Channel tab', async () => {
    for (const [current, page] of [
      ['/studio/channel/design', 'Design'],
      ['/studio/channel/radio?tab=pinned', 'Radio'],
      ['/studio/channel/settings', 'Settings'],
      ['/studio/channel/clips', 'Settings'],
      ['/studio/channel/address', 'Address'],
    ] as const) {
      const { unmount } = await renderWithRouter(
        <StudioNav current={current} />,
      );
      const channel = screen.getByRole('navigation', {
        name: 'Channel pages',
      });
      expect(
        within(channel)
          .getAllByRole('link')
          .map((link) => link.textContent),
      ).toEqual(['Design', 'Radio', 'Settings', 'Visibility', 'Address']);
      expect(
        within(channel).getByRole('link', { name: page }),
        current,
      ).toHaveAttribute('aria-current', 'page');
      expect(
        screen
          .getByRole('navigation', { name: 'Studio pages' })
          .querySelector('[aria-current="page"]')?.textContent,
      ).toBe('Channel');
      expect(
        screen.queryByRole('navigation', { name: 'Broadcast pages' }),
      ).toBeNull();
      unmount();
    }
  });

  it('shows the Profile pages as a filled sub-nav under the Profile tab', async () => {
    await renderWithRouter(<StudioNav current="/studio/profile/gallery" />);
    const profile = screen.getByRole('navigation', { name: 'Profile pages' });
    expect(
      within(profile)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Identity',
      'Links',
      'Link page',
      'Branding',
      'Gallery & press kit',
    ]);
    expect(
      within(profile).getByRole('link', { name: 'Gallery & press kit' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('leaves Stats without a nested row', async () => {
    await renderWithRouter(<StudioNav current="/studio/stats?tab=plays" />);
    expect(
      screen.queryByRole('navigation', { name: 'Stats pages' }),
    ).toBeNull();
    expect(nestedTabRows()).toHaveLength(0);
  });

  it.each([
    ['/studio', false],
    ['/studio/releases', true],
    ['/studio/distribution', true],
    ['/studio/editor', true],
    ['/studio/stats', false],
    ['/studio/updates', true],
    ['/studio/audience', true],
    ['/studio/go-live', true],
    ['/studio/schedule', true],
  ])('%s has a sub-nav row: %s', (route, expected) => {
    expect(hasStudioNestedNav(route)).toBe(expected);
  });

  it('only renders a nested row for tabs that have sub-pages', async () => {
    for (const item of SUBMENUS['/studio']) {
      const { unmount } = await renderWithRouter(
        <StudioNav current={item.to} />,
      );
      expect(nestedTabRows()).toHaveLength(hasStudioNestedNav(item.to) ? 1 : 0);
      unmount();
    }
  });

  it('shows Music pages as a filled sub-nav below the Studio row', async () => {
    await renderWithRouter(<StudioNav current="/studio/releases" />);
    const music = screen.getByRole('navigation', { name: 'Music pages' });
    expect(
      within(music).getByRole('link', { name: 'Releases' }),
    ).toHaveAttribute('aria-current', 'page');
  });
});
