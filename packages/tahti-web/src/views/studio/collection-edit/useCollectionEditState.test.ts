// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StudioCollection } from '../../../api/studio-types';
import { useCollectionEditState } from './useCollectionEditState';

let collection: StudioCollection;
const patchStudioCollection = vi.fn();

vi.mock('../../../api/studio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/studio')>();
  return {
    ...actual,
    fetchStudioCollection: async () => ({
      data: collection,
      meta: { source: 'mock' as const },
    }),
    fetchStudioSounds: async () => ({
      data: [],
      meta: { source: 'mock' as const },
    }),
    fetchCollectionGallery: async () => ({
      data: {
        galleryMode: 'NONE',
        slideshowImages: [],
        videoBackgroundUrl: null,
      },
    }),
    patchStudioCollection: (...args: unknown[]) =>
      patchStudioCollection(...args),
  };
});

describe('useCollectionEditState track order', () => {
  beforeEach(() => {
    collection = { slug: 'my-album', name: 'My Album', items: [] };
    patchStudioCollection.mockReset();
    patchStudioCollection.mockImplementation(
      async (slug: string, patch: Partial<StudioCollection>) => ({
        ok: true,
        data: { ...collection, slug, ...patch },
      }),
    );
  });

  it('defaults to manual order when the collection has none stored', async () => {
    const { result } = renderHook(() => useCollectionEditState('my-album'));
    await waitFor(() => expect(result.current.col).not.toBeNull());
    expect(result.current.trackSortMode).toBe('MANUAL');
  });

  it('loads the stored order and saves a changed one with the details', async () => {
    collection = { ...collection, trackSortMode: 'NAME' };
    const { result } = renderHook(() => useCollectionEditState('my-album'));
    await waitFor(() => expect(result.current.trackSortMode).toBe('NAME'));

    act(() => result.current.setTrackSortMode('TIME'));
    await act(async () => {
      await result.current.saveMeta();
    });

    expect(patchStudioCollection).toHaveBeenCalledWith(
      'my-album',
      expect.objectContaining({ trackSortMode: 'TIME' }),
    );
  });
});
