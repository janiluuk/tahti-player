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
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as publish from '../../api/publish-to-release';
import * as versions from '../../api/sound-versions';
import * as studio from '../../api/studio';
import type { StudioRelease } from '../../api/studio-types';
import { PublishToReleaseSection } from './PublishToReleaseSection';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

async function renderSection(releases: StudioRelease[]) {
  vi.spyOn(studio, 'fetchStudioReleases').mockResolvedValue({
    data: { page: 1, limit: 50, total: releases.length, releases },
    meta: { source: 'api' },
  });
  vi.spyOn(versions, 'fetchSoundVersions').mockResolvedValue({
    data: [
      {
        id: 'v2',
        versionNumber: 2,
        versionLabel: 'Radio edit',
        status: 'READY',
      },
      {
        id: 'v3',
        versionNumber: 3,
        versionLabel: 'Draft',
        status: 'PROCESSING',
      },
    ] as versions.SoundVersion[],
    meta: { source: 'api' },
  });
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <PublishToReleaseSection soundId="s1" title="Night Drive" />
      ),
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

async function pick(label: RegExp, option: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: label }));
  });
  const choice = await screen.findByRole('option', { name: option });
  await act(async () => {
    fireEvent.click(choice);
  });
}

describe('PublishToReleaseSection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('adds a ready version to the chosen release', async () => {
    await renderSection([
      {
        id: 'r1',
        title: 'Night EP',
        type: 'EP',
        state: 'DRAFT',
        releaseDate: '',
      },
    ] as StudioRelease[]);
    const add = vi.spyOn(publish, 'publishSoundToRelease').mockResolvedValue({
      ok: true,
      data: { trackId: 't9', status: 'SCANNING' },
    });
    await pick(/Release/, 'Night EP · draft');
    await pick(/Audio/, 'v2 · Radio edit');
    expect(screen.queryByRole('option', { name: /Draft/ })).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add to release' }));
    });
    expect(add).toHaveBeenCalledWith('s1', {
      releaseId: 'r1',
      versionId: 'v2',
      title: '',
    });
    expect(screen.getByRole('status').textContent).toContain('Night EP');
  });

  it('points to Releases when there is none yet', async () => {
    await renderSection([]);
    expect(
      screen.getByRole('link', { name: 'Create one in Studio → Releases' }),
    ).toBeTruthy();
  });
});
