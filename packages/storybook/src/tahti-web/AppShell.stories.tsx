import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import type { AuthUser } from '@tahti-web/api/types';
import { AppShell } from '@tahti-web/components/AppShell';
import { ListenView } from '@tahti-web/views/ListenView';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, seedMockAuth } from './_lib/decorators';

// AppShell redirects a signed-in user straight to `/onboarding` on first
// sign-in of the session (see hasSeenOnboarding in views/OnboardingView),
// which our minimal route tree below doesn't have a route for — pre-seed
// the "already onboarded" flag for the mock user so the shell renders its
// normal content instead of hitting an unmatched route.
function markOnboarded(userId: string) {
  try {
    localStorage.setItem(`tahti-web-onboarded:${userId}`, '1');
  } catch {
    // ignore — best-effort for the storybook preview only
  }
}

/**
 * AppShell renders its page body through the router's `<Outlet/>` (inside
 * `RouteTransition`), not a `children` prop, so the shared `withTahtiRouter`
 * decorator (which puts the story's own output at the root route) doesn't
 * fit here. This builds its own small two-level route tree instead: the
 * root route's component is AppShell itself, and the child index route
 * renders the real Listen page (the app's `/`) through AppShell's
 * `<Outlet/>`.
 *
 * Also seeds auth directly via `seedMockAuth` (rather than composing with the
 * separate `withMockAuth` decorator) so ordering between decorators can't
 * accidentally skip it — AppShell reads the auth store on first render for
 * sidebar items and the onboarding redirect.
 */
function withAppShellRouter(user: AuthUser | null, path = '/'): Decorator {
  return () => {
    seedMockAuth(user);
    if (user) {
      markOnboarded(user.id);
    }

    const rootRoute = createRootRoute({ component: () => <AppShell /> });
    const routeTree = rootRoute.addChildren([
      createRoute({
        getParentRoute: () => rootRoute,
        path,
        component: ListenView,
      }),
    ]);
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [path] }),
    });
    return <RouterProvider router={router} />;
  };
}

const meta: Meta<typeof AppShell> = {
  title: 'Tahti/Chrome/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Canonical Tahti white-theme shell reference: use the existing AppShell, SidebarNavigation, TopBar, Button, Input, and BottomBar primitives for new screens.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'White theme reference',
  decorators: [withAppShellRouter(MOCK_USERS.board)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Real Listen page in the outlet...
    const main = within(canvas.getByRole('main'));
    await expect(
      await main.findByRole('heading', { name: 'Listen' }),
    ).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Radio' })).toBeVisible();
    // ...inside the real chrome: top bar and the board's sidebar entries.
    const banner = within(canvas.getByRole('banner'));
    await expect(
      banner.getByRole('button', { name: 'Signed in as Jani (Board)' }),
    ).toBeVisible();
    for (const name of ['Listen', 'Discover', 'Library', 'Studio', 'Admin']) {
      await expect(canvas.getByRole('link', { name })).toBeVisible();
    }
  },
};

export const SignedOut: Story = {
  decorators: [withAppShellRouter(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('button', { name: 'Log in' }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: /^Signed in as/ }),
    ).toBeNull();
    await expect(canvas.queryByRole('link', { name: 'Admin' })).toBeNull();
  },
};

export const ArtistView: Story = {
  decorators: [withAppShellRouter(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('button', {
        name: 'Signed in as Northern Lights',
      }),
    ).toBeVisible();
    await expect(canvas.queryByRole('link', { name: 'Admin' })).toBeNull();
  },
};
