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

  it('offers Undo after creating a release, which deletes it again', async () => {
    const created = {
      ...release,
      id: 'rel-2',
      title: 'Night Drive',
      state: 'DRAFT',
    } as StudioRelease;
    vi.spyOn(studio, 'fetchStudioReleases')
      .mockResolvedValueOnce({ data: list([release]), meta: { source: 'api' } })
      .mockResolvedValue({
        data: list([release, created]),
        meta: { source: 'api' },
      });
    vi.spyOn(studio, 'createStudioRelease').mockResolvedValue({
      ok: true,
      data: created,
    } as never);
    vi.spyOn(studio, 'patchStudioReleaseVisual').mockResolvedValue({
      ok: true,
    } as never);
    const remove = vi
      .spyOn(studio, 'deleteStudioRelease')
      .mockResolvedValue({ ok: true });
    await renderWithRouter(<StudioReleasesView />);
    await screen.findByText('After Hours');
    fireEvent.click(screen.getAllByRole('button', { name: 'New release' })[0]!);
    fireEvent.change(await screen.findByLabelText('Title'), {
      target: { value: 'Night Drive' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Night Drive')).toBeTruthy();

    const [message, options] = toast.success.mock.calls.at(-1) as [
      string,
      { action: { label: string; onClick: () => void } },
    ];
    expect(message).toBe('Created Night Drive.');
    expect(options.action.label).toBe('Undo');
    options.action.onClick();

    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenLastCalledWith('Removed Night Drive.'),
    );
    expect(remove).toHaveBeenCalledWith('rel-2');
    expect(screen.queryByText('Night Drive')).toBeNull();
    expect(screen.getByText('After Hours')).toBeTruthy();
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

  it('clears a search that matches nothing', async () => {
    vi.spyOn(studio, 'fetchStudioReleases').mockResolvedValue({
      data: list([release]),
      meta: { source: 'api' },
    });
    await renderWithRouter(<StudioReleasesView />);
    fireEvent.change(await screen.findByLabelText('Search releases'), {
      target: { value: 'zzz' },
    });
    expect(screen.getByText('No releases match “zzz”')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByText('After Hours')).toBeTruthy();
  });
});
