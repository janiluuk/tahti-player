// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { createRoot, type Root } from 'react-dom/client';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../../stores/authStore';
import { StudioCollectionsView } from './StudioCollectionsView';

const createStudioCollection = vi.fn();

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
}));

const fetchStudioCollections = vi.fn(async () => ({
  data: [] as Array<{
    slug: string;
    name: string;
    style: string;
    createdAt?: string;
  }>,
  meta: { source: 'mock' as const },
}));

vi.mock('../../api/studio', () => ({
  createStudioCollection: (...args: unknown[]) =>
    createStudioCollection(...args),
  fetchStudioCollections: (...args: unknown[]) =>
    fetchStudioCollections(...args),
}));

vi.mock('../../components/library/SubscribedCollections', () => ({
  SubscribedCollections: () => null,
}));

vi.mock('./CollectionOrderButton', () => ({
  CollectionOrderButton: () => null,
}));

vi.mock('../LibraryView', () => ({
  LibrarySectionTabs: () => null,
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

async function renderCollections() {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      email: 'artist@tahti.live',
      username: 'artist',
      displayName: 'An Artist',
      role: 'ARTIST',
      isBoard: false,
      isMember: true,
      channel: { slug: 'artist', state: 'OFFLINE' },
    },
    hydrated: true,
    loading: false,
    profileLoaded: true,
  });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const listRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/collections',
    component: StudioCollectionsView,
  });
  const designerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/collections/$slug',
    component: function Designer() {
      const { slug } = designerRoute.useParams();
      return <div>Designer {slug}</div>;
    },
  });
  const playlistRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/playlists/$slug',
    component: function Playlist() {
      const { slug } = playlistRoute.useParams();
      return <div>Playlist editor {slug}</div>;
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([listRoute, designerRoute, playlistRoute]),
    history: createMemoryHistory({ initialEntries: ['/studio/collections'] }),
  });
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return router;
}

async function createCollection(name: string, styleLabel?: string) {
  await act(async () =>
    fireEvent.click(
      screen.getAllByRole('button', { name: 'New collection' })[0]!,
    ),
  );
  await act(async () =>
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: name },
    }),
  );
  if (styleLabel) {
    await act(async () =>
      fireEvent.click(screen.getByRole('radio', { name: styleLabel })),
    );
  }
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Create' })),
  );
}

describe('StudioCollectionsView create', () => {
  it('opens the new album in the Design editor', async () => {
    createStudioCollection.mockResolvedValue({
      ok: true,
      data: { slug: 'night-drive', name: 'Night drive', style: 'ALBUM' },
    });
    const router = await renderCollections();

    await createCollection('Night drive');

    expect(createStudioCollection).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Night drive', style: 'ALBUM' }),
    );
    expect(await screen.findByText('Designer night-drive')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      '/studio/collections/night-drive',
    );
  });

  it('opens a new playlist in the playlist editor', async () => {
    createStudioCollection.mockResolvedValue({
      ok: true,
      data: { slug: 'warmup', name: 'Warmup', style: 'PLAYLIST' },
    });
    const router = await renderCollections();

    await createCollection('Warmup', 'Playlist');

    expect(createStudioCollection).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Warmup', style: 'PLAYLIST' }),
    );
    expect(
      await screen.findByText('Playlist editor warmup'),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/studio/playlists/warmup');
  });

  it('stays on the list when creating fails', async () => {
    createStudioCollection.mockResolvedValue({ ok: false, error: 'Nope' });
    const router = await renderCollections();

    await createCollection('Night drive');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Nope'));
    expect(router.state.location.pathname).toBe('/studio/collections');
  });
});

describe('StudioCollectionsView list order', () => {
  it('lists collections newest-first by createdAt', async () => {
    fetchStudioCollections.mockResolvedValue({
      data: [
        {
          slug: 'older',
          name: 'Older mix',
          style: 'PLAYLIST',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          slug: 'newer',
          name: 'Newer mix',
          style: 'PLAYLIST',
          createdAt: '2026-08-01T00:00:00.000Z',
        },
      ],
      meta: { source: 'mock' as const },
    });
    await renderCollections();
    const newer = await screen.findByText('Newer mix');
    const older = screen.getByText('Older mix');
    expect(
      newer.compareDocumentPosition(older) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
