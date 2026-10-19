// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../api/studio';
import type { StudioRelease } from '../../api/studio-types';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioReleasesView } from './StudioReleasesView';

const { toast } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock('sonner', () => ({ toast, Toaster: () => null }));

vi.mock('../../components/StudioGate', () => ({
  StudioGate: ({ children }: { children: ReactNode }) => children,
}));

const release = {
  id: 'rel-1',
  title: 'After Hours',
  type: 'ALBUM',
  state: 'PUBLISHED',
  releaseDate: '2026-06-01',
  smartLinkSlug: 'after-hours',
  _count: { tracks: 3 },
} as unknown as StudioRelease;

const list = (releases: StudioRelease[]) => ({
  page: 1,
  limit: 100,
  total: releases.length,
  releases,
});

describe('StudioReleasesView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the list failed to load instead of "No releases yet"', async () => {
    const fetch = vi.spyOn(studio, 'fetchStudioReleases').mockResolvedValue({
      data: list([]),
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<StudioReleasesView />);
    expect(
      await screen.findByText('Could not load your releases'),
    ).toBeTruthy();
    expect(screen.queryByText('No releases yet')).toBeNull();

    fetch.mockResolvedValue({ data: list([release]), meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('After Hours')).toBeTruthy();
  });

  it('reports a failed create as a toast and keeps the dialog open', async () => {
    vi.spyOn(studio, 'fetchStudioReleases').mockResolvedValue({
      data: list([release]),
      meta: { source: 'api' },
    });
    vi.spyOn(studio, 'createStudioRelease').mockResolvedValue({
      ok: false,
      error: 'Title already used',
    } as never);
    await renderWithRouter(<StudioReleasesView />);
    await screen.findByText('After Hours');
    fireEvent.click(screen.getAllByRole('button', { name: 'New release' })[0]!);
    fireEvent.change(await screen.findByLabelText('Title'), {
      target: { value: 'Night Drive' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Title already used'),
    );
    expect(screen.getByLabelText('Title')).toBeTruthy();
  });

  it('links each release to its Stats tab', async () => {
    vi.spyOn(studio, 'fetchStudioReleases').mockResolvedValue({
      data: list([release]),
      meta: { source: 'api' },
    });
    await renderWithRouter(<StudioReleasesView />);
    const link = await screen.findByRole('link', {
      name: 'Stats for After Hours',
    });
    expect(link.getAttribute('href')).toBe('/studio/releases/rel-1?tab=stats');
  });
});
