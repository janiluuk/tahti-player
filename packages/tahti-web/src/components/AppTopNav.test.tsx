// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../stores/authStore';
import { AppTopNav } from './AppTopNav';

vi.mock('./GlobalSearch', () => ({ GlobalSearch: () => null }));

let container: HTMLDivElement;
let root: Root;

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

async function renderNav() {
  const rootRoute = createRootRoute({ component: () => <AppTopNav /> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function query(selector: string) {
  return container.querySelector(selector) as HTMLElement | null;
}

beforeEach(() => {
  vi.stubEnv('VITE_FORCE_MOCK', '1');
  stubMatchMedia();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

describe('AppTopNav', () => {
  it('shows only the login action when signed out', async () => {
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
    await renderNav();

    expect(query('[data-tour-id="topbar-login"]')).toBeTruthy();
    expect(query('[data-tour-id="topbar-account"]')).toBeNull();
    expect(query('[data-tour-id="topbar-notifications"]')).toBeNull();
    expect(query('[data-tour-id="topbar-messages"]')).toBeNull();
  });

  it('shows the signed-in actions and opens the account menu', async () => {
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
    await renderNav();

    expect(query('[data-tour-id="topbar-login"]')).toBeNull();
    expect(query('[data-tour-id="topbar-notifications"]')).toBeTruthy();
    expect(query('[data-tour-id="topbar-messages"]')).toBeTruthy();
    expect(query('[data-tour-id="topbar-golive"]')).toBeNull();

    const account = query('[aria-label="Signed in as Liina"]');
    expect(account).toBeTruthy();
    const before = container.textContent;
    await act(async () => {
      account!.click();
    });
    expect(container.textContent).not.toBe(before);

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(container.textContent).toBe(before);
  });
});
