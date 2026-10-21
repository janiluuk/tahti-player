// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '../../api/types';
import { useAuthStore } from '../../stores/authStore';
import { StudioStashView } from './StudioStashView';

vi.mock('../../api/sources', () => ({
  fetchStashFiles: async () => ({ data: [], meta: { source: 'mock' } }),
  createStashShare: vi.fn(),
  deleteStashFile: vi.fn(),
  fetchStashDownload: vi.fn(),
  revokeStashShare: vi.fn(),
  uploadStashFile: vi.fn(),
}));

const fetchStudioSounds = vi.fn(
  async (): Promise<{
    data: Array<{ id: string; title: string; visibility: string }>;
    meta: { source: 'api' | 'mock'; reason?: string };
  }> => ({ data: [], meta: { source: 'mock' } }),
);

vi.mock('../../api/studio', () => ({
  fetchStudioSounds: () => fetchStudioSounds(),
  fetchStudioCollections: async () => ({ data: [], meta: { source: 'mock' } }),
  patchStudioSound: vi.fn(),
  patchStudioCollection: vi.fn(),
}));

vi.mock('../../components/TrackEditDialog', () => ({
  TrackEditDialog: () => null,
}));

vi.mock('../LibraryView', () => ({
  LibrarySectionTabs: () => null,
}));

const listener: AuthUser = {
  id: 'u-listener',
  email: 'listener@tahti.live',
  username: 'listener',
  displayName: 'Listener',
  role: 'LISTENER',
  roles: ['LISTENER'],
};

async function renderStash() {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <StudioStashView embedded />,
    }),
    history: createMemoryHistory({ initialEntries: ['/library/stash'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('StudioStashView for listeners', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: listener,
      profileLoaded: true,
      hydrated: true,
    });
  });

  afterEach(() => {
    cleanup();
    useAuthStore.setState({ user: null, profileLoaded: false, hydrated: true });
  });

  it('shows stash files without the Studio-is-for-artists gate', async () => {
    await renderStash();

    expect(screen.queryByText('Studio is for artists')).toBeNull();
    expect(screen.getByText('Your files')).toBeInTheDocument();
    expect(screen.getByText('No stash files yet')).toBeInTheDocument();
    expect(screen.queryByText('Add from your library')).toBeNull();
  });
});

describe('StudioStashView for artists', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { ...listener, role: 'ARTIST', roles: ['ARTIST'] },
      profileLoaded: true,
      hydrated: true,
    });
  });

  afterEach(() => {
    cleanup();
    fetchStudioSounds.mockReset();
    useAuthStore.setState({ user: null, profileLoaded: false, hydrated: true });
  });

  it('says the stash failed to load instead of "No tracks in your stash yet"', async () => {
    fetchStudioSounds.mockResolvedValueOnce({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderStash();
    expect(
      await screen.findByText('Could not load your stash'),
    ).toBeInTheDocument();
    expect(screen.queryByText('No tracks in your stash yet')).toBeNull();

    fetchStudioSounds.mockResolvedValueOnce({
      data: [{ id: 's1', title: 'Demo take', visibility: 'STASH' }],
      meta: { source: 'api' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(await screen.findByText('Demo take')).toBeInTheDocument();
  });
});
