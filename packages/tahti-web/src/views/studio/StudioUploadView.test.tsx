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

import { useAuthStore } from '../../stores/authStore';
import { StudioUploadView } from './StudioUploadView';

const uploadSoundFile = vi.fn();

vi.mock('../../api/studio', () => ({
  uploadSoundFile: (...args: unknown[]) => uploadSoundFile(...args),
  fetchEditorSource: async () => ({
    data: { url: 'https://cdn.example.com/a.mp3' },
    meta: { source: 'mock' as const },
  }),
}));

vi.mock('../../api/broadcast', () => ({
  fetchRecentBroadcasts: async () => ({
    data: [],
    meta: { source: 'mock' as const },
  }),
}));

vi.mock('../../plugins/import-sources', () => ({
  importSourcePlugins: [],
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

async function renderUpload() {
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
  const uploadRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/upload',
    component: StudioUploadView,
  });
  const soundRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/sounds/$id',
    component: function Sound() {
      const { id } = soundRoute.useParams();
      return <div>Sound editor {id}</div>;
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([uploadRoute, soundRoute]),
    history: createMemoryHistory({ initialEntries: ['/studio/upload'] }),
  });
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return router;
}

describe('StudioUploadView', () => {
  it('uploads the chosen file and opens its sound page', async () => {
    uploadSoundFile.mockResolvedValue({
      ok: true,
      itemId: 'sound-42',
      meta: { source: 'mock' },
    });
    const router = await renderUpload();
    const file = new File(['audio'], 'track.wav', { type: 'audio/wav' });

    const upload = screen.getByRole('button', { name: 'Upload file' });
    expect(upload).toBeDisabled();

    await act(async () =>
      fireEvent.change(screen.getByLabelText('Choose audio file'), {
        target: { files: [file] },
      }),
    );
    expect(upload).toBeEnabled();
    await act(async () => fireEvent.click(upload));

    expect(uploadSoundFile).toHaveBeenCalledWith({ file });
    expect(
      await screen.findByText('Sound editor sound-42'),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/studio/sounds/sound-42');
  });

  it('stays on the upload page and shows the error when the upload fails', async () => {
    uploadSoundFile.mockResolvedValue({ ok: false, error: 'File too large' });
    const router = await renderUpload();
    const file = new File(['audio'], 'track.wav', { type: 'audio/wav' });

    await act(async () =>
      fireEvent.change(screen.getByLabelText('Choose audio file'), {
        target: { files: [file] },
      }),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Upload file' })),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'File too large',
    );
    expect(router.state.location.pathname).toBe('/studio/upload');
  });
});
