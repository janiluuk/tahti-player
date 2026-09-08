// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../stores/authStore';
import { GovernanceMotionDetailView } from './GovernanceMotionDetailView';

function createDetailRouter(id: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/governance/motions/$id',
    component: () => <GovernanceMotionDetailView id={id} />,
  });
  const governanceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/governance',
    component: () => null,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([detailRoute, governanceRoute]),
    history: createMemoryHistory({
      initialEntries: [`/governance/motions/${id}`],
    }),
  });
}

let container: HTMLDivElement;
let root: Root;

class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function stubMatchMedia() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

beforeEach(() => {
  vi.stubEnv('VITE_FORCE_MOCK', '1');
  vi.stubGlobal('ResizeObserver', StubResizeObserver);
  stubMatchMedia();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  useAuthStore.setState({
    user: {
      id: 'board-1',
      email: 'board@tahti.live',
      username: 'board-jani',
      displayName: 'Board Member',
      role: 'BOARD',
      isBoard: true,
      isMember: true,
    },
    hydrated: true,
    loading: false,
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

describe('GovernanceMotionDetailView', () => {
  it('shows the motion title, description, and discussion expanded by default', async () => {
    const router = createDetailRouter('motion-1');
    await act(async () => {
      root.render(<RouterProvider router={router} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain('Approve 2026 grant formula');
    expect(container.textContent).toContain('grant funding formula');
    expect(container.textContent).toContain('Hide discussion');
  });

  it('shows a not-found message for an unknown motion id', async () => {
    const router = createDetailRouter('motion-does-not-exist');
    await act(async () => {
      root.render(<RouterProvider router={router} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain('Motion not found');
  });

  it('lets a board member start editing a DRAFT motion, pre-filled with its title and description', async () => {
    const router = createDetailRouter('motion-5');
    await act(async () => {
      root.render(<RouterProvider router={router} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const editButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'Edit motion',
    );
    expect(editButton).toBeTruthy();
    await act(async () => {
      editButton!.click();
    });
    const titleInput = container.querySelector(
      'input',
    ) as HTMLInputElement | null;
    expect(titleInput?.value).toBe(
      'Adopt a code of conduct for chat moderation',
    );
    const textarea = container.querySelector('textarea');
    expect(textarea?.value).toContain('escalation ladder');
    expect(container.textContent).toContain('Save changes');
  });

  it('does not show the edit control to a non-board member', async () => {
    useAuthStore.setState({
      user: {
        id: 'listener-1',
        email: 'listener@tahti.live',
        username: 'listener-liina',
        displayName: 'Liina',
        role: 'LISTENER',
        isMember: true,
      },
      hydrated: true,
      loading: false,
    });
    const router = createDetailRouter('motion-5');
    await act(async () => {
      root.render(<RouterProvider router={router} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.some((b) => b.textContent === 'Edit motion')).toBe(false);
  });
});
