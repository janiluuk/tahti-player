import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { AuthUser } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { AdminGate } from './AdminGate';
import { StudioGate } from './StudioGate';

const listener: AuthUser = {
  id: 'u-listener',
  email: 'listener@tahti.live',
  username: 'listener',
  displayName: 'Listener',
  role: 'LISTENER',
  roles: ['LISTENER'],
};

const signIn = (user: AuthUser | null) =>
  useAuthStore.setState({ user, profileLoaded: true, hydrated: true });

async function renderInRouter(ui: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => ui }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

const pageHeadings = () =>
  screen
    .queryAllByRole('heading', { level: 1 })
    .map((heading) => heading.textContent);

describe('the page a gate shows instead of Studio or Admin', () => {
  afterEach(() => {
    cleanup();
    useAuthStore.setState({ user: null, profileLoaded: false });
  });

  it('has a Studio page heading for a signed-out visitor', () => {
    signIn(null);
    render(
      <StudioGate>
        <p>studio</p>
      </StudioGate>,
    );
    expect(pageHeadings()).toEqual(['Studio']);
  });

  it('has a Studio page heading for a listener', () => {
    signIn(listener);
    render(
      <StudioGate requireChannel={false}>
        <p>studio</p>
      </StudioGate>,
    );
    expect(screen.getByText('Studio is for artists')).toBeTruthy();
    expect(pageHeadings()).toEqual(['Studio']);
  });

  it('leaves the page heading to the page it sits in', () => {
    signIn(listener);
    render(
      <StudioGate requireChannel={false} embedded>
        <p>studio</p>
      </StudioGate>,
    );
    expect(screen.getByText('Studio is for artists')).toBeTruthy();
    expect(pageHeadings()).toEqual([]);
  });

  it('has a Board admin page heading for a signed-out visitor and a listener', async () => {
    signIn(null);
    await renderInRouter(
      <AdminGate>
        <p>admin</p>
      </AdminGate>,
    );
    expect(pageHeadings()).toEqual(['Board admin']);
    cleanup();

    signIn(listener);
    await renderInRouter(
      <AdminGate>
        <p>admin</p>
      </AdminGate>,
    );
    expect(screen.getByText('Board access required')).toBeTruthy();
    expect(pageHeadings()).toEqual(['Board admin']);
  });
});
