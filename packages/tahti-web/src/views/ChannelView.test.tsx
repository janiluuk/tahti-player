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

import * as client from '../api/client';
import * as discoWidgets from '../api/disco-widgets';
import * as follows from '../api/follows';
import * as shows from '../api/shows';
import { useAuthStore } from '../stores/authStore';
import { rehydrateLibraryForUser } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
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
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  });

  it('shows a visitor the follow state from the server and follows the channel owner', async () => {
    signInAs('someone-else');
    localStorage.clear();
    await rehydrateLibraryForUser('user-someone-else');
    vi.spyOn(follows, 'fetchFollowStatus').mockResolvedValue({
      following: false,
      followerCount: 10,
    });
    const followSpy = vi
      .spyOn(follows, 'followArtist')
      .mockResolvedValue({ ok: true, followerCount: 11 });
    await renderChannel('/channel/northern-lights');

    const button = await screen.findByRole('button', { name: /^Follow / });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    await act(async () => {
      fireEvent.click(button);
    });
    expect(followSpy).toHaveBeenCalledWith('northern-lights');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    await rehydrateLibraryForUser(null);
  });

  it('does not offer the owner a follow button on their own channel', async () => {
    signInAs('northern-lights');
    await renderChannel('/channel/northern-lights');
    await waitFor(() =>
      expect(screen.queryByText('Loading channel…')).toBeNull(),
    );
    expect(screen.queryByRole('button', { name: /^Follow / })).toBeNull();
  });

  it("shows the artist's top bar text to a visitor", async () => {
    const realFetchChannel = client.fetchChannel;
    vi.spyOn(client, 'fetchChannel').mockImplementation(async (slug) => {
      const result = await realFetchChannel(slug);
      return {
        ...result,
        data: { ...result.data, topBarText: 'New album out Friday' },
      };
    });
    await renderChannel('/channel/northern-lights');
    expect(
      (await screen.findByTestId('channel-backdrop-top-bar')).textContent,
    ).toBe('New album out Friday');
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

  it('keeps the channel playable while tracks are slow and widgets/shows fail', async () => {
    signInAs('someone-else');
    let resolveSounds: (() => void) | undefined;
    const realFetchSound = client.fetchChannelSound;
    vi.spyOn(client, 'fetchChannelSound').mockImplementation(
      (slug) =>
        new Promise((resolve) => {
          resolveSounds = () => resolve(realFetchSound(slug));
        }),
    );
    vi.spyOn(discoWidgets, 'fetchChannelDiscoWidgets').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 503' },
    });
    vi.spyOn(shows, 'fetchPublicRadioShow').mockRejectedValue(
      new Error('network'),
    );

    await renderChannel('/channel/northern-lights');

    const play = await screen.findByRole('button', { name: 'Play live' });
    expect(screen.queryByText('Loading channel…')).toBeNull();
    expect(screen.getByText('Loading tracks…')).toBeTruthy();
    expect(await screen.findByText("Widgets couldn't load")).toBeTruthy();

    await act(async () => {
      fireEvent.click(play);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await waitFor(() =>
      expect(usePlayerStore.getState().currentId).not.toBeNull(),
    );

    await act(async () => {
      resolveSounds?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await waitFor(() =>
      expect(screen.queryByText('Loading tracks…')).toBeNull(),
    );
  });
});
