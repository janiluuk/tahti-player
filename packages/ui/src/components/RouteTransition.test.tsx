// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  RouterProvider,
  useLocation,
} from '@tanstack/react-router';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RouteTransition } from './RouteTransition';

function Page({ name }: { name: string }) {
  const pathname = useLocation({ select: (l) => l.pathname });
  return (
    <div data-testid={name}>
      {name} at {pathname}
      <Link to={name === 'a' ? '/b' : '/a'}>go</Link>
    </div>
  );
}

const flush = async () => {
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
  }
};

describe('RouteTransition', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('keeps the leaving page rendering from its own state while it animates out, then swaps', async () => {
    vi.stubGlobal('scrollTo', () => {});
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = createRootRoute({ component: () => <RouteTransition /> });
    const a = createRoute({
      getParentRoute: () => root,
      path: '/a',
      component: () => <Page name="a" />,
    });
    const b = createRoute({
      getParentRoute: () => root,
      path: '/b',
      component: () => <Page name="b" />,
    });
    const router = createRouter({
      routeTree: root.addChildren([a, b]),
      history: createMemoryHistory({ initialEntries: ['/a'] }),
    });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const reactRoot = createRoot(container);
    await act(async () => {
      reactRoot.render(<RouterProvider router={router} />);
    });
    await flush();
    expect(container.textContent).toContain('a at /a');

    await act(async () => {
      void router.navigate({ to: '/b' });
      await new Promise((r) => setTimeout(r, 30));
    });
    // Mid-transition the old page may still be mounted; it must still show
    // its own location rather than the new one, and nothing may throw.
    const during = container.textContent ?? '';
    if (during.includes('a at')) {
      expect(during).toContain('a at /a');
    }
    await flush();
    expect(container.textContent).toContain('b at /b');
    expect(container.textContent).not.toContain('a at');
    // React/router dev warnings unrelated to the freeze are fine; a thrown
    // render error would show up as something else.
    const real = errors.mock.calls
      .map((c) => String(c[0]))
      .filter((m) => !/act\(|non-boolean attribute/.test(m));
    expect(real).toEqual([]);
    reactRoot.unmount();
    errors.mockRestore();
    vi.unstubAllGlobals();
  });
});
