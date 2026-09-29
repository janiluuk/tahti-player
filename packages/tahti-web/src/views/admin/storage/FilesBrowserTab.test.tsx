// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../../api/admin';
import { FilesBrowserTab } from './FilesBrowserTab';

const FILE: admin.AdminFileRow = {
  id: 'f1',
  title: 'Moonlight Drive',
  artistName: 'DJ Moonlight',
  genre: 'Downtempo',
  contentType: 'TRACK',
  isPublic: true,
  durationSec: 312,
  sizeBytes: 8_400_000,
  format: 'MP3',
  createdAt: '2026-08-10T12:00:00.000Z',
  channelSlug: 'dj-moonlight',
  userId: 'u1',
  username: 'dj-moonlight',
  displayName: 'DJ Moonlight',
  audioUrl: null,
  revisionCount: 1,
};

async function renderTab() {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <FilesBrowserTab /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}

describe('adminFilesQuery', () => {
  it('sends only the filters that are set, as the API list parameters', () => {
    expect(admin.adminFilesQuery({})).toBe('limit=100');
    expect(
      admin.adminFilesQuery({
        q: ' moon ',
        userId: 'u1',
        genre: 'Downtempo',
        contentType: 'TRACK',
      }),
    ).toBe('limit=100&q=moon&userIds=u1&genres=Downtempo&contentTypes=TRACK');
  });
});

describe('FilesBrowserTab', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('offers the facets as filters and says when the list is capped', async () => {
    vi.spyOn(admin, 'fetchAdminFileFacets').mockResolvedValue({
      users: [
        { id: 'u1', username: 'dj-moonlight', displayName: 'DJ Moonlight' },
      ],
      genres: ['Downtempo'],
      contentTypes: ['TRACK'],
    });
    const fetchFiles = vi.spyOn(admin, 'fetchAdminFiles').mockResolvedValue({
      data: [FILE],
      total: 250,
      meta: { source: 'api' },
    });

    await renderTab();

    expect(fetchFiles).toHaveBeenLastCalledWith({
      q: '',
      userId: '',
      genre: '',
      contentType: '',
    });
    expect(screen.getByText(/Uploader/)).toBeTruthy();
    expect(screen.getByText(/Genre/)).toBeTruthy();
    expect(screen.getByText(/the newest 1 of 250 matching/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '@dj-moonlight' })).toBeTruthy();
  });
});
