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

import { ButtonAnchor, ButtonLink } from './ButtonLink';

async function renderInRouter(ui: ReactNode) {
  const root = createRootRoute({ component: () => ui });
  const target = createRoute({
    getParentRoute: () => root,
    path: '/target/$id',
    component: () => <p>target page</p>,
  });
  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({ getParentRoute: () => root, path: '/' }),
      target,
    ]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

describe('ButtonLink', () => {
  it('is one link, not a button inside a link, and navigates', async () => {
    const router = await renderInRouter(
      <ButtonLink
        to={'/target/$id' as never}
        params={{ id: '7' } as never}
        size="sm"
      >
        Open
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Open' });
    expect(link).toHaveAttribute('href', '/target/7');
    expect(screen.queryByRole('button')).toBeNull();
    expect(link.className).toContain('h-9');

    await userEvent.click(link);
    expect(router.state.location.pathname).toBe('/target/7');
  });

  it('renders a disabled link without an href', async () => {
    await renderInRouter(
      <ButtonLink
        to={'/target/$id' as never}
        params={{ id: '7' } as never}
        disabled
      >
        Open
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Open' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('ButtonAnchor', () => {
  it('keeps href, download and target on the anchor', () => {
    render(
      <ButtonAnchor href="/file.wav" download variant="secondary">
        Download
      </ButtonAnchor>,
    );
    const link = screen.getByRole('link', { name: 'Download' });
    expect(link).toHaveAttribute('href', '/file.wav');
    expect(link).toHaveAttribute('download');
  });

  it('drops href and leaves the tab order when disabled', () => {
    render(
      <ButtonAnchor href="/file.wav" disabled>
        Download
      </ButtonAnchor>,
    );
    const link = screen.getByText('Download');
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(link).toHaveAttribute('aria-disabled', 'true');
  });
});
