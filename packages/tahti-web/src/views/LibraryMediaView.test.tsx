// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as userMedia from '../api/user-media';
import { renderWithRouter } from '../test/renderWithRouter';
import { LibraryMediaView } from './LibraryMediaView';

describe('LibraryMediaView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says the media failed to load instead of "No media files yet"', async () => {
    const fetch = vi.spyOn(userMedia, 'fetchUserMedia').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<LibraryMediaView />, {
      paths: ['/studio/branding'],
    });
    expect(
      await screen.findByText('Could not load your media files'),
    ).toBeTruthy();
    expect(screen.queryByText(/No media files yet/)).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/No media files yet/)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Open Branding' }).getAttribute('href'),
    ).toBe('/studio/branding');
  });

  it('filters by kind and clears the filter from the empty state', async () => {
    vi.spyOn(userMedia, 'fetchUserMedia').mockResolvedValue({
      data: [
        {
          id: '1',
          filename: 'bg.png',
          url: 'https://x/bg.png',
          contentType: 'image/png',
          sizeBytes: 1024,
        },
        {
          id: '2',
          filename: 'loop.mp4',
          url: 'https://x/loop.mp4',
          contentType: 'video/mp4',
          sizeBytes: 2048,
        },
      ],
      meta: { source: 'api' },
    } as never);
    await renderWithRouter(<LibraryMediaView />, {
      paths: ['/studio/branding'],
    });
    expect(await screen.findByText('bg.png')).toBeTruthy();
    expect(screen.getByText('loop.mp4')).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'Videos' }));
    expect(screen.queryByText('bg.png')).toBeNull();
    expect(screen.getByText('loop.mp4')).toBeTruthy();
  });

  it('sorts media files by name and newest from the toolbar', async () => {
    vi.spyOn(userMedia, 'fetchUserMedia').mockResolvedValue({
      data: [
        {
          id: '1',
          filename: 'b-old.png',
          url: 'https://x/b.png',
          contentType: 'image/png',
          sizeBytes: 1024,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          filename: 'c-new.png',
          url: 'https://x/c.png',
          contentType: 'image/png',
          sizeBytes: 1024,
          createdAt: '2026-06-01T00:00:00.000Z',
        },
        {
          id: '3',
          filename: 'a-mid.png',
          url: 'https://x/a.png',
          contentType: 'image/png',
          sizeBytes: 1024,
          createdAt: '2026-03-01T00:00:00.000Z',
        },
      ],
      meta: { source: 'api' },
    });
    await renderWithRouter(<LibraryMediaView />, {
      paths: ['/studio/branding'],
    });
    await screen.findByText('b-old.png');

    const names = () =>
      screen
        .getAllByText(/\.png$/)
        .filter((node) => node.tagName === 'P')
        .map((node) => node.textContent);
    expect(names()).toEqual(['c-new.png', 'a-mid.png', 'b-old.png']);

    fireEvent.click(screen.getByRole('button', { name: /^Sort media files/ }));
    fireEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Name A–Z' }),
    );
    expect(names()).toEqual(['a-mid.png', 'b-old.png', 'c-new.png']);
  });

  it('searches media by file name and clears search and filter together', async () => {
    vi.spyOn(userMedia, 'fetchUserMedia').mockResolvedValue({
      data: [
        {
          id: '1',
          filename: 'bg.png',
          url: 'https://x/bg.png',
          contentType: 'image/png',
          sizeBytes: 1024,
        },
        {
          id: '2',
          filename: 'loop.mp4',
          url: 'https://x/loop.mp4',
          contentType: 'video/mp4',
          sizeBytes: 2048,
        },
      ],
      meta: { source: 'api' },
    } as never);
    await renderWithRouter(<LibraryMediaView />, {
      paths: ['/studio/branding'],
    });
    await screen.findByText('bg.png');

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search media files' }),
      {
        target: { value: 'loop' },
      },
    );
    expect(screen.queryByText('bg.png')).toBeNull();
    expect(screen.getByText('loop.mp4')).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'Images' }));
    expect(screen.getByText('No media files match “loop”')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('bg.png')).toBeTruthy();
    expect(screen.getByText('loop.mp4')).toBeTruthy();
  });

  it('removes a media file only after a red confirm', async () => {
    vi.spyOn(userMedia, 'fetchUserMedia').mockResolvedValue({
      data: [
        {
          id: '1',
          filename: 'bg.png',
          url: 'https://x/bg.png',
          contentType: 'image/png',
          sizeBytes: 1024,
        },
      ],
      meta: { source: 'api' },
    } as never);
    const remove = vi
      .spyOn(userMedia, 'deleteUserMedia')
      .mockResolvedValue({ ok: true } as never);
    await renderWithRouter(<LibraryMediaView />, {
      paths: ['/studio/branding'],
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove bg.png' }),
    );
    const confirm = screen.getByRole('button', { name: 'Remove' });
    expect(confirm.className).toContain('bg-accent-red');
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(confirm);
    await waitFor(() => expect(remove).toHaveBeenCalledWith('1'));
  });

  it('purges unused uploads after confirming how many and how big', async () => {
    const file = {
      id: 'media/demo/bg.png',
      filename: 'bg.png',
      url: 'https://x/bg.png',
      contentType: 'image/png',
      sizeBytes: 1024,
      createdAt: '2026-11-01T00:00:00.000Z',
    };
    vi.spyOn(userMedia, 'fetchUserMedia').mockResolvedValue({
      data: [file],
      meta: { source: 'api' },
    });
    vi.spyOn(userMedia, 'fetchUnusedMedia').mockResolvedValue({
      ok: true,
      data: { count: 3, totalBytes: 3 * 1024 * 1024, ids: ['a', 'b', 'c'] },
    });
    const purge = vi.spyOn(userMedia, 'purgeUnusedMedia').mockResolvedValue({
      ok: true,
      data: { deleted: 3, freedBytes: 3 * 1024 * 1024 },
    });
    await renderWithRouter(<LibraryMediaView />, {
      paths: ['/studio/branding'],
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Purge unused' }),
    );
    expect(await screen.findByText('Delete 3 unused files?')).toBeTruthy();
    expect(screen.getByText(/3 files \(3\.0 MB\)/)).toBeTruthy();
    expect(purge).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete unused' }));
    await waitFor(() => expect(purge).toHaveBeenCalledTimes(1));
  });

  it('says so when every file is in use', async () => {
    vi.spyOn(userMedia, 'fetchUserMedia').mockResolvedValue({
      data: [
        {
          id: 'media/demo/bg.png',
          filename: 'bg.png',
          url: 'https://x/bg.png',
          contentType: 'image/png',
          sizeBytes: 1024,
          createdAt: '2026-11-01T00:00:00.000Z',
        },
      ],
      meta: { source: 'api' },
    });
    vi.spyOn(userMedia, 'fetchUnusedMedia').mockResolvedValue({
      ok: true,
      data: { count: 0, totalBytes: 0, ids: [] },
    });
    const purge = vi.spyOn(userMedia, 'purgeUnusedMedia');
    await renderWithRouter(<LibraryMediaView />, {
      paths: ['/studio/branding'],
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Purge unused' }),
    );
    await waitFor(() => expect(screen.queryByText(/unused file/)).toBeNull());
    expect(purge).not.toHaveBeenCalled();
  });
});
