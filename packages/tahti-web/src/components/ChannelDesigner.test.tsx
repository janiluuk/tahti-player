// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChannelDesigner } from './ChannelDesigner';

class ResizeObserverStub {
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

type DesignerVariant = Partial<
  Pick<
    ComponentProps<typeof ChannelDesigner>,
    'compact' | 'lookOnly' | 'lookOpenSection'
  >
>;

function createDesignerRouter(variant: DesignerVariant) {
  const rootRoute = createRootRoute({
    component: () => (
      <ChannelDesigner
        displayName="Northern Lights"
        username="northern-lights"
        channelSlug="northern-lights"
        bio="Ambient / downtempo, streaming most weeknights."
        livePreview={false}
        {...variant}
      />
    ),
  });
  return createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
}

// Every root is unmounted after its test. Left mounted, a render React had
// scheduled could commit after jsdom was torn down and fail the whole run
// with "window is not defined".
const mountedRoots: Root[] = [];

async function renderDesigner(variant: DesignerVariant = {}): Promise<{
  container: HTMLDivElement;
  root: Root;
}> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.push(root);
  const router = createDesignerRouter(variant);
  await act(async () => {
    root.render(<RouterProvider router={router} />);
  });
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
  return { container, root };
}

describe('ChannelDesigner', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    stubMatchMedia();
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    localStorage.clear();
  });

  afterEach(async () => {
    await act(async () => {
      for (const root of mountedRoots.splice(0)) {
        root.unmount();
      }
    });
    document.body.replaceChildren();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('mounts without crashing and shows the look editor chrome', async () => {
    const { container } = await renderDesigner();
    expect(container.textContent).toContain('Northern Lights');
  });

  it('renders the section tabs used to navigate the designer', async () => {
    const { container } = await renderDesigner();
    expect(container.querySelector('[role="tablist"], nav, ul')).toBeTruthy();
  });

  it('mounts in compact mode without crashing', async () => {
    const { container } = await renderDesigner({ compact: true });
    expect(container.textContent).toContain('Northern Lights');
  });

  it('mounts in look-only mode with a specific section open, without crashing', async () => {
    const { container } = await renderDesigner({
      lookOnly: true,
      lookOpenSection: 'backdrop',
    });
    expect(container.textContent).not.toBe('');
  });
});
