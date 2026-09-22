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

import type { StudioCollection, StudioSound } from '../../api/studio-types';
import { useAuthStore } from '../../stores/authStore';
import { StudioCollectionEditView } from './StudioCollectionEditView';

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

const addStudioCollectionItem = vi.fn();
let collectionName = 'Original Name';
const sounds: StudioSound[] = [
  { id: 'sound-1', title: 'Bonus Track', status: 'READY' },
];

function makeCollection(): StudioCollection {
  return {
    slug: 'my-album',
    name: collectionName,
    isPublic: true,
    items: [],
  };
}

vi.mock('../../api/studio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/studio')>();
  return {
    ...actual,
    fetchStudioCollection: async () => ({
      data: makeCollection(),
      meta: { source: 'mock' as const },
    }),
    fetchStudioSounds: async () => ({
      data: sounds,
      meta: { source: 'mock' as const },
    }),
    fetchCollectionGallery: async () => ({
      data: {
        galleryMode: 'NONE',
        slideshowImages: [],
        videoBackgroundUrl: null,
      },
    }),
    addStudioCollectionItem: (...args: unknown[]) =>
      addStudioCollectionItem(...args),
  };
});

function createRouterFor() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/collections/$slug',
    component: () => <StudioCollectionEditView slug="my-album" />,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({
      initialEntries: ['/studio/collections/my-album'],
    }),
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubEnv('VITE_FORCE_MOCK', '1');
  collectionName = 'Original Name';
  addStudioCollectionItem.mockImplementation(async () => {
    // The server round trip that follows a successful add would normally
    // reflect any concurrent server-side change too — simulate that here.
    collectionName = 'Server Name';
    return { ok: true };
  });
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

async function renderView() {
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
  const router = createRouterFor();
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('StudioCollectionEditView add-track keeps unsaved details edits', () => {
  it('does not overwrite an in-progress title edit when a track is added', async () => {
    await renderView();

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Edit details' })),
    );

    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    await act(async () =>
      fireEvent.change(titleInput, { target: { value: 'My Edited Name' } }),
    );
    expect(titleInput.value).toBe('My Edited Name');

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: /Add content to/ })),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Add' })),
    );

    expect(addStudioCollectionItem).toHaveBeenCalledWith('my-album', 'sound-1');
    // The title input still shows the unsaved edit — a full reload() would
    // have overwritten it with the (changed) server value.
    expect(titleInput.value).toBe('My Edited Name');
  });
});
