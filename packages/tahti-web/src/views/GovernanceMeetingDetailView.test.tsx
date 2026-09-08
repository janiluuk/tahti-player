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
import { GovernanceMeetingDetailView } from './GovernanceMeetingDetailView';

function createMeetingRouter(id: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/governance/meetings/$id',
    component: () => <GovernanceMeetingDetailView id={id} />,
  });
  const governanceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/governance',
    component: () => null,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([detailRoute, governanceRoute]),
    history: createMemoryHistory({
      initialEntries: [`/governance/meetings/${id}`],
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
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

describe('GovernanceMeetingDetailView', () => {
  it('shows the meeting overview, quorum, and agenda for a scheduled meeting', async () => {
    const router = createMeetingRouter('meeting-agm-2026');
    await act(async () => {
      root.render(<RouterProvider router={router} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain('2026 Annual General Meeting');
    expect(container.textContent).toContain('General meeting');
    expect(container.textContent).toContain('Not yet uploaded');
    expect(container.textContent).toContain('Action plan: 2026 grant formula');
  });

  it('shows minutes approval status for a meeting with minutes on file', async () => {
    const router = createMeetingRouter('meeting-board-2026-06');
    await act(async () => {
      root.render(<RouterProvider router={router} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain('June 2026 board meeting');
    expect(container.textContent).toContain('Board meeting');
    expect(container.textContent).toContain('Approved');
    expect(container.textContent).toContain('Met');
    const downloadLink = Array.from(container.querySelectorAll('a')).find(
      (a) => a.textContent === 'Download',
    );
    expect(downloadLink?.getAttribute('href')).toContain(
      'minutes/2026-06-board.pdf',
    );
  });

  it('shows a not-found message for an unknown meeting id', async () => {
    const router = createMeetingRouter('meeting-does-not-exist');
    await act(async () => {
      root.render(<RouterProvider router={router} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.textContent).toContain('Meeting not found');
  });
});
