// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, screen } from '@testing-library/react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '../../stores/authStore';
import { RotationEmptyWarning } from './RotationEmptyWarning';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

function signInAs(channelSlug: string) {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      email: 'artist@tahti.live',
      username: 'artist',
      displayName: 'An Artist',
      role: 'ARTIST',
      isBoard: false,
      isMember: true,
      channel: { slug: channelSlug, state: 'OFFLINE' },
    },
    hydrated: true,
    loading: false,
  });
}

async function renderWarning(slug: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <RotationEmptyWarning slug={slug} />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('RotationEmptyWarning', () => {
  it('warns the owner and links to the 24/7 rotation tab', async () => {
    signInAs('artist');
    await renderWarning('artist');

    expect(screen.getByText('The 24/7 rotation is empty')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Manage 24/7 rotation' });
    expect(link.getAttribute('href')).toBe('/studio/channel?tab=rotation');
  });

  it("warns without a studio link on someone else's channel", async () => {
    signInAs('board-member');
    await renderWarning('artist');

    expect(screen.getByText('The 24/7 rotation is empty')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
