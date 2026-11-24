// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  RouterProvider,
} from '@tanstack/react-router';
import { act, fireEvent, screen } from '@testing-library/react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  channelLandingRedirect,
  channelRadioPath,
  isChannelRadioTab,
  type ChannelRadioTab,
} from '../../lib/channelSections';
import { isStudioChannelSection } from '../../lib/studioProfileSections';
import { useAuthStore } from '../../stores/authStore';
import { StudioChannelView } from './StudioChannelView';

vi.mock('../../components/PinnedAnnouncementsPanel', () => ({
  PinnedAnnouncementsPanel: () => null,
}));
vi.mock('../../components/StreamManagerPanel', () => ({
  StreamManagerPanel: () => null,
}));
vi.mock('../../components/StudioRadioSubmissionPanel', () => ({
  StudioRadioSubmissionPanel: () => null,
}));
vi.mock('../../components/ProfileVisibilitySection', () => ({
  ProfileVisibilitySection: () => <div data-testid="profile-visibility" />,
}));
vi.mock('../settings/panels/ChannelPanel', () => ({
  ChannelPanel: ({ section }: { section: string }) => (
    <div data-testid={`channel-panel-${section}`} />
  ),
}));

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
  vi.clearAllMocks();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

async function renderChannel(url: string, withChannel = true) {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      email: 'artist@tahti.live',
      username: 'artist',
      displayName: 'An Artist',
      role: 'ARTIST',
      isBoard: false,
      isMember: true,
      channel: withChannel ? { slug: 'artist', state: 'OFFLINE' } : null,
    },
    hydrated: true,
    loading: false,
    profileLoaded: true,
  });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const stub = (path: string, testId: string) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      validateSearch: (search: Record<string, unknown>) => search,
      component: () => <div data-testid={testId} />,
    });
  const channelRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/channel',
    validateSearch: (
      search: Record<string, unknown>,
    ): { tab?: string; radio?: string } => ({
      ...(typeof search.tab === 'string' ? { tab: search.tab } : {}),
      ...(typeof search.radio === 'string' ? { radio: search.radio } : {}),
    }),
    beforeLoad: ({ search, location }) => {
      throw redirect(
        channelLandingRedirect({
          tab: search.tab,
          radio: search.radio,
          hash: location.hash,
        }) as never,
      );
    },
  });
  const sectionRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/channel/$section',
    validateSearch: (
      search: Record<string, unknown>,
    ): { tab?: ChannelRadioTab } =>
      isChannelRadioTab(search.tab) && search.tab !== 'stream'
        ? { tab: search.tab }
        : {},
    component: function Section() {
      const { section } = sectionRoute.useParams();
      return isStudioChannelSection(section) ? (
        <StudioChannelView section={section} />
      ) : null;
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      channelRoute,
      sectionRoute,
      stub('/studio/schedule', 'schedule-stub'),
      stub('/studio/go-live', 'go-live-stub'),
      stub('/studio/profile/$section', 'profile-stub'),
      stub('/admin/tahti-selects', 'selects-stub'),
    ]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return { router };
}

const clickTab = (name: string) =>
  act(async () => fireEvent.click(screen.getByRole('tab', { name })));

describe('StudioChannelView sections', () => {
  it('shows Radio as Stream · Pinned with links to the stream’s other homes', async () => {
    await renderChannel('/studio/channel/radio');

    expect(screen.getByTestId('studio-channel-section-radio')).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Stream' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Pinned' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Multicast' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Tahti Selects' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Open Schedule' })).toHaveAttribute(
      'href',
      '/studio/schedule?tab=programme',
    );
    expect(
      screen.getByRole('link', { name: 'Live destinations' }),
    ).toHaveAttribute('href', '/studio/go-live?step=destinations');
  });

  it('keeps the Radio tab in ?tab=', async () => {
    const { router } = await renderChannel('/studio/channel/radio');

    await clickTab('Pinned');
    expect(router.state.location.pathname).toBe('/studio/channel/radio');
    expect(router.state.location.search).toEqual({ tab: 'pinned' });

    await clickTab('Stream');
    expect(router.state.location.search).toEqual({});
  });

  it('offers channel setup on Radio while there is no channel', async () => {
    await renderChannel('/studio/channel/radio', false);
    expect(document.body.textContent).toContain('Create artist.tahti.live');
  });

  it('merges discovery and profile visibility into one Visibility page', async () => {
    await renderChannel('/studio/channel/visibility');
    expect(screen.getByTestId('channel-panel-visibility')).toBeInTheDocument();
    expect(screen.getByTestId('profile-visibility')).toBeInTheDocument();
  });

  it.each(['design', 'address'])(
    'shows the channel %s settings on their own page',
    async (section) => {
      await renderChannel(`/studio/channel/${section}`);
      expect(
        screen.getByTestId(`channel-panel-${section}`),
      ).toBeInTheDocument();
    },
  );

  it.each([
    ['/studio/channel', '/studio/channel/design', {}],
    ['/studio/channel?tab=design', '/studio/channel/design', {}],
    ['/studio/channel?tab=radio', '/studio/channel/radio', {}],
    ['/studio/channel#radio', '/studio/channel/radio', {}],
    ['/studio/channel?tab=pinned', '/studio/channel/radio', { tab: 'pinned' }],
    [
      '/studio/channel?radio=pinned',
      '/studio/channel/radio',
      { tab: 'pinned' },
    ],
    ['/studio/channel?tab=profile', '/studio/profile/branding', {}],
    ['/studio/channel?tab=rotation', '/studio/schedule', { tab: 'programme' }],
    [
      '/studio/channel?radio=rotation',
      '/studio/schedule',
      { tab: 'programme' },
    ],
    [
      '/studio/channel?tab=multicast',
      '/studio/go-live',
      { step: 'destinations' },
    ],
    [
      '/studio/channel?tab=green-room',
      '/studio/go-live',
      { step: 'green-room' },
    ],
    ['/studio/channel?tab=selects', '/admin/tahti-selects', {}],
  ])('redirects %s to %s', async (url, path, search) => {
    const { router } = await renderChannel(url);
    expect(router.state.location.pathname).toBe(path);
    expect(router.state.location.search).toEqual(search);
  });

  it('builds Radio tab links', () => {
    expect(channelRadioPath()).toBe('/studio/channel/radio');
    expect(channelRadioPath('pinned')).toBe('/studio/channel/radio?tab=pinned');
  });
});
