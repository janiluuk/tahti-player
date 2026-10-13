import type { Decorator } from '@storybook/react-vite';
import { setMockSessionUser } from '@tahti-web/api/mock-session';
import type { AuthUser } from '@tahti-web/api/types';
import { useAuthStore } from '@tahti-web/stores/authStore';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';

/**
 * A throwaway single-route router so components that render `<Link>` /
 * `useRouterState` (most of tahti-web's chrome) have a RouterProvider to
 * sit inside. It doesn't know about the app's real route tree, so it's
 * only good for rendering a component in isolation — not for following
 * links across stories.
 */
function makeStoryRouter(children: ReactNode, path: string) {
  const rootRoute = createRootRoute({
    component: () => children,
  });
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path }),
  ]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
}

/**
 * Wraps a story in a minimal TanStack Router context. Pass `path` when a
 * component reads the current location (e.g. nav "active" highlighting).
 */
export function withTahtiRouter(path = '/'): Decorator {
  return (Story) => {
    const router = makeStoryRouter(<Story />, path);
    return <RouterProvider router={router} />;
  };
}

const MOCK_BOARD_USER: AuthUser = {
  id: 'mock-board-1',
  email: 'board@tahti.live',
  username: 'board-jani',
  displayName: 'Jani (Board)',
  role: 'BOARD',
  isBoard: true,
  isMember: true,
};

const MOCK_ARTIST_USER: AuthUser = {
  id: 'mock-artist-1',
  email: 'artist@tahti.live',
  username: 'northern-lights',
  displayName: 'Northern Lights',
  role: 'ARTIST',
  isMember: true,
  channel: { slug: 'northern-lights', state: 'LIVE' },
};

const MOCK_LISTENER_USER: AuthUser = {
  id: 'mock-listener-1',
  email: 'listener@tahti.live',
  username: 'listener-liina',
  displayName: 'Liina',
  role: 'LISTENER',
  isMember: true,
};

export const MOCK_USERS = {
  board: MOCK_BOARD_USER,
  artist: MOCK_ARTIST_USER,
  listener: MOCK_LISTENER_USER,
};

/**
 * Sets both the auth store and the mock API session. Seeding only the store
 * isn't enough: `useAuthStore.refresh()` (run by AppShell and friends) asks
 * the mock `/auth/me`, which would otherwise hand back whichever user an
 * earlier story left in the mock session.
 */
export function seedMockAuth(user: AuthUser | null) {
  setMockSessionUser(user);
  useAuthStore.setState({ user, hydrated: true, loading: false });
}

/**
 * Seeds `useAuthStore` with a signed-in mock user before render — needed
 * for anything behind `AdminGate`/`StudioGate`, or that just reads
 * `useAuthStore` for the current user. `null` renders the signed-out state.
 */
export function withMockAuth(
  user: AuthUser | null = MOCK_BOARD_USER,
): Decorator {
  return (Story) => {
    seedMockAuth(user);
    return <Story />;
  };
}

/**
 * Matches the live app canvas: themed background + page padding. Fullscreen
 * Storybook stories without this look like they drift (transparent canvas,
 * flush-to-edge pages) compared with AppShell's main column.
 */
export function withPageSurface(
  className = 'bg-background text-foreground min-h-screen p-6',
): Decorator {
  return (Story) => (
    <div className={className}>
      <Story />
    </div>
  );
}
