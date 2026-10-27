// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { hasStudioNestedNav, StudioNav, SUBMENUS } from './StudioNav';

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => vi.fn(),
}));

vi.mock('../hooks/useStripeConfigured', () => ({
  useStripeConfigured: () => false,
}));

afterEach(cleanup);

const nestedTabRows = () => screen.queryAllByTestId('studio-nested-nav');

describe('StudioNav nested sub-tab row', () => {
  it('leaves out the empty sub-tab row and its separator on Studio home', () => {
    render(<StudioNav current="/studio" />);

    expect(
      screen.getByRole('tablist', { name: 'Studio pages' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('tablist')).toHaveLength(1);
    expect(nestedTabRows()).toHaveLength(0);
  });

  it('renders the sub-tab row when the tab has sub-tabs', () => {
    render(<StudioNav current="/studio/stats?tab=plays" />);

    expect(
      screen.getByRole('tablist', { name: 'Stats pages' }),
    ).toBeInTheDocument();
    expect(nestedTabRows()).toHaveLength(1);
  });

  it.each([
    ['/studio', false],
    ['/studio/releases', false],
    ['/studio/distribution', false],
    ['/studio/editor', false],
    ['/studio/stats', true],
    ['/studio/governance', true],
    ['/studio/updates', true],
    ['/studio/audience', true],
    ['/studio/go-live', true],
    ['/studio/schedule', true],
  ])('%s has a sub-tab row: %s', (route, expected) => {
    expect(hasStudioNestedNav(route)).toBe(expected);
  });

  it('only renders a nested row for tabs that have sub-tabs', () => {
    for (const item of SUBMENUS['/studio']) {
      const { unmount } = render(<StudioNav current={item.to} />);
      const tabLists = screen.getAllByRole('tablist');
      expect(tabLists.length > 1).toBe(hasStudioNestedNav(item.to));
      expect(nestedTabRows()).toHaveLength(hasStudioNestedNav(item.to) ? 1 : 0);
      unmount();
    }
  });
});
