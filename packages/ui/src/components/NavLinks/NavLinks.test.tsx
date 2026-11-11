import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { NavLinks } from './NavLinks';

async function renderInRouter(ui: ReactNode) {
  const root = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({ getParentRoute: () => root, path: '/' }),
      createRoute({ getParentRoute: () => root, path: '/schedule' }),
      createRoute({ getParentRoute: () => root, path: '/shows' }),
    ]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

const ITEMS = [
  { id: 'live', to: '/', label: 'Go live', active: true },
  { id: 'schedule', to: '/schedule?show=events', label: 'Schedule' },
  { id: 'shows', to: '/shows', label: 'Shows' },
];

describe('NavLinks', () => {
  it('renders links in a named nav and marks only the current page', async () => {
    await renderInRouter(
      <NavLinks aria-label="Broadcast pages" items={ITEMS} />,
    );

    const nav = screen.getByRole('navigation', { name: 'Broadcast pages' });
    expect(nav).toBeInTheDocument();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.getByRole('link', { name: 'Go live' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Schedule' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: 'Schedule' })).toHaveAttribute(
      'href',
      '/schedule?show=events',
    );
  });

  it('uses an underline for the top level and a fill one level down', async () => {
    await renderInRouter(
      <>
        <NavLinks aria-label="Top" items={ITEMS} />
        <NavLinks aria-label="Sub" variant="fill" items={ITEMS} />
      </>,
    );
    const [top, sub] = screen.getAllByRole('link', { name: 'Go live' });
    expect(top?.className).toContain('border-foreground');
    expect(top?.className).not.toContain('bg-primary');
    expect(sub?.className).toContain('bg-background-input');
    expect(sub?.className).not.toContain('bg-primary');
    for (const link of [top, sub]) {
      expect(link?.className).toContain('focus-visible:outline-focus-ring');
    }
  });

  it('navigates on click and is reachable with Tab', async () => {
    const router = await renderInRouter(
      <NavLinks aria-label="Broadcast pages" items={ITEMS} />,
    );
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Go live' })).toHaveFocus();
    await userEvent.click(screen.getByRole('link', { name: 'Shows' }));
    expect(router.state.location.pathname).toBe('/shows');
  });
});
