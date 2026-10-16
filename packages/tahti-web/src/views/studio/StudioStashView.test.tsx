// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
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

vi.mock('../../api/studio', () => ({
  fetchStudioSounds: async () => ({ data: [], meta: { source: 'mock' } }),
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
