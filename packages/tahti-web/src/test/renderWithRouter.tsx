import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * Renders `ui` at `/` inside a real memory router, so `Link`/`ButtonLink`
 * get proper hrefs and clicks navigate. Each of `paths` is registered as a
 * stub route, letting a test assert where a click went via the returned
 * router's `state.location.pathname`.
 */
export async function renderWithRouter(
  ui: ReactNode,
  { paths = [] }: { paths?: string[] } = {},
) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <>{ui}</>,
  });
  const stubRoutes = paths.map((path) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: () => <p data-testid="routed-to">{path}</p>,
    }),
  );
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, ...stubRoutes]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(<RouterProvider router={router} />);
  });
  return { ...result, router };
}
