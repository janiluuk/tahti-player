// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, fireEvent, screen } from '@testing-library/react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { StudioCollection } from '../../../api/studio-types';
import { useAuthStore } from '../../../stores/authStore';
import { StudioPlaylistEditorView } from './StudioPlaylistEditorView';

const TEST_ROW_HEIGHT = 42;

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (opts: { count: number }) => {
    const count = Math.max(0, Number(opts?.count ?? 0));
    return {
      getVirtualItems: () =>
        Array.from({ length: count }).map((_, i) => ({
          index: i,
          start: i * TEST_ROW_HEIGHT,
          end: (i + 1) * TEST_ROW_HEIGHT,
          key: i,
          size: TEST_ROW_HEIGHT,
        })),
      getTotalSize: () => count * TEST_ROW_HEIGHT,
    };
  },
}));

let collection: StudioCollection;
const removeStudioCollectionItem = vi.fn();

vi.mock('../../../api/studio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/studio')>();
  return {
    ...actual,
    fetchStudioCollection: async () => ({
      data: collection,
      meta: { source: 'mock' as const },
    }),
    fetchStudioSounds: async () => ({
      data: [],
      meta: { source: 'mock' as const },
    }),
    fetchStudioReleases: async () => ({
      data: { page: 1, limit: 100, total: 0, releases: [] },
      meta: { source: 'mock' as const },
    }),
    removeStudioCollectionItem: (...args: unknown[]) =>
      removeStudioCollectionItem(...args),
  };
});

function createEditorRouter() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const editorRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/playlists/$slug',
    component: () => <StudioPlaylistEditorView slug="my-list" />,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([editorRoute]),
    history: createMemoryHistory({
      initialEntries: ['/studio/playlists/my-list'],
    }),
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubEnv('VITE_FORCE_MOCK', '1');
  removeStudioCollectionItem.mockResolvedValue({ ok: true });
  collection = {
    slug: 'my-list',
    name: 'My List',
    isPublic: true,
    items: [
      {
        id: 'item-1',
        position: 0,
        soundId: 'sound-1',
        sound: { id: 'sound-1', title: 'First Track' },
      },
    ],
  };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

async function renderEditor() {
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
  });
  const router = createEditorRouter();
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('StudioPlaylistEditorView track removal', () => {
  it('asks for confirmation before removing a track, and only removes on confirm', async () => {
    await renderEditor();

    expect(screen.getByText('First Track')).toBeInTheDocument();

    const removeButton = screen.getByLabelText('Remove from list');
    await act(async () => fireEvent.click(removeButton));

    expect(removeStudioCollectionItem).not.toHaveBeenCalled();
    expect(screen.getByText('Remove "First Track"?')).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: 'Remove' });
    await act(async () => fireEvent.click(confirmButton));

    expect(removeStudioCollectionItem).toHaveBeenCalledWith(
      'my-list',
      'item-1',
    );
  });

  it('removes nothing when the confirmation is cancelled', async () => {
    await renderEditor();

    await act(async () =>
      fireEvent.click(screen.getByLabelText('Remove from list')),
    );
    const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
    expect(cancelButtons).toHaveLength(1);
    await act(async () => {
      fireEvent.click(cancelButtons[0]!);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(removeStudioCollectionItem).not.toHaveBeenCalled();
    expect(screen.getByText('First Track')).toBeInTheDocument();
  });
});
