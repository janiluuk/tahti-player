// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StudioShowSeries } from '../../../api/shows';
import { useShowDetail } from './useShowDetail';

const baseShow: StudioShowSeries = {
  id: 'show-1',
  title: 'My Show',
  description: 'desc',
  coverUrl: 'https://example.com/old-cover.jpg',
  backdropUrl: 'https://example.com/old-backdrop.jpg',
  showType: 'MUSIC',
  nextEpisodeNumber: 1,
  intervalHours: 1,
  scheduleNote: null,
  createdAt: new Date().toISOString(),
};

const patchShowSeries = vi.fn();

vi.mock('../../../api/shows', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/shows')>();
  return {
    ...actual,
    fetchShowSeriesById: async () => ({
      data: baseShow,
      meta: { source: 'mock' as const },
    }),
    fetchEpisodesForShow: async () => ({
      data: [],
      meta: { source: 'mock' as const },
    }),
    fetchShowBookings: async () => ({
      data: [],
      meta: { source: 'mock' as const },
    }),
    patchShowSeries: (...args: unknown[]) => patchShowSeries(...args),
  };
});

const uploadUserMediaFile = vi.fn();

vi.mock('../../../api/user-media', () => ({
  uploadUserMediaFile: (...args: unknown[]) => uploadUserMediaFile(...args),
}));

describe('useShowDetail — saveMeta uploads picked images', () => {
  beforeEach(() => {
    patchShowSeries.mockReset();
    uploadUserMediaFile.mockReset();
  });

  it('uploads a picked thumbnail/backdrop file and saves the uploaded URL, never the local blob: preview', async () => {
    uploadUserMediaFile.mockImplementation(async (file: File) => ({
      ok: true,
      data: { url: `https://cdn.example.com/uploaded-${file.name}` },
    }));
    patchShowSeries.mockImplementation(async (id: string, patch: unknown) => ({
      ok: true,
      data: { ...baseShow, ...(patch as object) },
    }));

    const { result } = renderHook(() => useShowDetail('show-1'));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    const thumbFile = new File(['x'], 'thumb.png', { type: 'image/png' });
    act(() => {
      result.current.setThumbnailFile(thumbFile);
      result.current.setThumbnailUrl('blob:local-preview-thumb');
    });

    await act(async () => {
      await result.current.saveMeta();
    });

    expect(uploadUserMediaFile).toHaveBeenCalledWith(thumbFile);
    expect(patchShowSeries).toHaveBeenCalledTimes(1);
    const [, patch] = patchShowSeries.mock.calls[0] as [
      string,
      { coverUrl: string },
    ];
    expect(patch.coverUrl).toBe('https://cdn.example.com/uploaded-thumb.png');
    expect(patch.coverUrl).not.toContain('blob:');
  });

  it('reports the upload failure and never calls patchShowSeries with the unsaved blob preview', async () => {
    uploadUserMediaFile.mockResolvedValue({
      ok: false,
      error: 'Upload failed',
    });

    const { result } = renderHook(() => useShowDetail('show-1'));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    const thumbFile = new File(['x'], 'thumb.png', { type: 'image/png' });
    act(() => {
      result.current.setThumbnailFile(thumbFile);
    });

    await act(async () => {
      await result.current.saveMeta();
    });

    expect(patchShowSeries).not.toHaveBeenCalled();
  });
});
