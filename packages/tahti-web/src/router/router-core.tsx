import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router';

import { AppShell } from '../components/AppShell';

export const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

export const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppShell,
});
