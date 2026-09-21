// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChannelDesigner } from './ChannelDesigner';

const { toast } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));
vi.mock('sonner', () => ({ toast, Toaster: () => null }));
vi.mock('../api/channel-design', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/channel-design')>()),
  fetchChannelVisual: () => Promise.reject(new Error('offline')),
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('ChannelDesigner load failure', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    toast.error.mockClear();
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('tells the user instead of failing silently when the look cannot be loaded', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const rootRoute = createRootRoute({
      component: () => (
        <ChannelDesigner
          displayName="Northern Lights"
          username="northern-lights"
          livePreview={false}
        />
      ),
    });
    const router = createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      root.render(<RouterProvider router={router} />);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(toast.error).toHaveBeenCalledWith(
      'Could not load the channel designer. Try again.',
    );
  });
});
