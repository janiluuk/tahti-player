// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../test/renderWithRouter';
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

  it('shows a back link to the Broadcast hub on Go live and Channel, not a tab row', async () => {
    for (const current of [
      '/studio/go-live?tab=credentials',
      '/studio/channel?tab=setup',
    ]) {
      const { unmount } = await renderWithRouter(
        <StudioNav current={current} />,
      );
      expect(
        screen.queryByRole('tablist', { name: 'Broadcast pages' }),
      ).toBeNull();
      expect(screen.getByTestId('studio-broadcast-back')).toHaveAttribute(
        'href',
        '/studio/broadcast',
      );
      unmount();
    }
    await renderWithRouter(<StudioNav current="/studio/broadcast" />);
    expect(screen.queryByTestId('studio-broadcast-back')).toBeNull();
  });

  it('leaves Stats and Governance without a nested chrome row', () => {
    render(<StudioNav current="/studio/stats?tab=plays" />);
    expect(screen.queryByRole('tablist', { name: 'Stats pages' })).toBeNull();
    expect(nestedTabRows()).toHaveLength(0);
    cleanup();
    render(<StudioNav current="/studio/governance" />);
    expect(
      screen.queryByRole('tablist', { name: 'Governance pages' }),
    ).toBeNull();
    expect(nestedTabRows()).toHaveLength(0);
  });

  it.each([
    ['/studio', false],
    ['/studio/releases', true],
    ['/studio/distribution', true],
    ['/studio/editor', true],
    ['/studio/stats', false],
    ['/studio/governance', false],
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
      expect(nestedTabRows()).toHaveLength(hasStudioNestedNav(item.to) ? 1 : 0);
      unmount();
    }
  });

  it('shows Music pages as chips, not a second tab strip', async () => {
    await renderWithRouter(<StudioNav current="/studio/releases" />);
    expect(
      screen.getByRole('radiogroup', { name: 'Music pages' }),
    ).toBeTruthy();
    expect(screen.queryByRole('tablist', { name: 'Music pages' })).toBeNull();
  });
});
