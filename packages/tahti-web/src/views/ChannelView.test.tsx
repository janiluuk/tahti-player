// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../stores/authStore';
import { useRightRailOverrideStore } from '../stores/rightRailOverrideStore';
import { ChannelView } from './ChannelView';

const { patchSpy } = vi.hoisted(() => ({ patchSpy: vi.fn() }));
vi.mock('../api/channel-design', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/channel-design')>();
  return {
    ...actual,
    patchChannelVisual: (
      ...args: Parameters<typeof actual.patchChannelVisual>
    ) => {
      patchSpy(...args);
      return actual.patchChannelVisual(...args);
    },
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

const SLUG = 'smoke-artist';

/** What the app shell's right rail shows while the channel is in edit mode. */
function RailOverride() {
  const override = useRightRailOverrideStore((state) => state.override);
  return <aside>{override?.content}</aside>;
}

function createRouterFor(initialEntry: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <Outlet />
        <RailOverride />
      </>
    ),
  });
  const channelRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/channel/$slug',
    validateSearch: (search: Record<string, unknown>) =>
      search.edit === true || search.edit === 'true' ? { edit: true } : {},
    component: function ChannelRoute() {
      const { slug } = channelRoute.useParams();
      return <ChannelView slug={slug} />;
    },
  });
  return createRouter({
    routeTree: rootRoute.addChildren([channelRoute]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
}

function signInAs(username: string) {
  useAuthStore.setState({
    user: {
      id: `user-${username}`,
      email: `${username}@tahti.live`,
      username,
      displayName: username,
      role: 'ARTIST',
      isBoard: false,
      isMember: true,
      channel: { slug: username, state: 'OFFLINE' },
    },
    hydrated: true,
    loading: false,
  });
}

async function renderChannel(initialEntry: string) {
  const router = createRouterFor(initialEntry);
  await act(async () => {
    render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return router;
}

describe('ChannelView', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(
      () => undefined,
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('shows the page but not the editor to a visitor, even with ?edit', async () => {
    signInAs('someone-else');
    await renderChannel(`/channel/${SLUG}?edit=true`);

    await waitFor(() =>
      expect(screen.queryByText('Loading channel…')).toBeNull(),
    );
    expect(screen.queryByText('Channel not found')).toBeNull();
    expect(screen.queryByText('Channel design')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
  });

  it('opens edit mode for the owner from the URL and leaves it with Done', async () => {
    signInAs(SLUG);
    const router = await renderChannel(`/channel/${SLUG}?edit=true`);

    expect(await screen.findByText('Channel design')).toBeTruthy();
    expect(
      (
        screen.getByRole('button', {
          name: /save changes/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Done' }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() =>
      expect(screen.queryByText('Channel design')).toBeNull(),
    );
    expect(router.state.location.search).toEqual({});
  });

  it('keeps a layout preset look as an unsaved draft until Save', async () => {
    signInAs(SLUG);
    await renderChannel(`/channel/${SLUG}?edit=true`);
    expect(await screen.findByText('Channel design')).toBeTruthy();
    patchSpy.mockClear();

    fireEvent.click(await screen.findByText('Stage / Live'));
    expect(await screen.findByText(/save to keep it/)).toBeTruthy();
    expect(patchSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/unsaved changes/)).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });
    await waitFor(() =>
      expect(patchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ visualPreset: expect.any(String) }),
      ),
    );
    await waitFor(() =>
      expect(screen.queryByText(/save to keep it/)).toBeNull(),
    );
  });
});
