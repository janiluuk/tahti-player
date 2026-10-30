// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StudioCollection } from '../../../api/studio-types';
import { useCollectionEditState } from './useCollectionEditState';

let collection: StudioCollection;
const patchStudioCollection = vi.fn();
const addStudioCollectionItem = vi.fn();
const removeStudioCollectionItem = vi.fn();
const { toast } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock('sonner', () => ({ toast }));

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
    addStudioCollectionItem: (...args: unknown[]) =>
      addStudioCollectionItem(...args),
    removeStudioCollectionItem: (...args: unknown[]) =>
      removeStudioCollectionItem(...args),
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

describe('useCollectionEditState add sound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collection = { slug: 'my-album', name: 'My Album', items: [] };
    addStudioCollectionItem.mockImplementation(async () => {
      collection = {
        ...collection,
        items: [
          {
            id: 'item-7',
            position: 0,
            sound: { id: 'snd-1', title: 'Dawn' },
          },
        ],
      };
      return { ok: true };
    });
    removeStudioCollectionItem.mockImplementation(async () => {
      collection = { ...collection, items: [] };
      return { ok: true };
    });
  });

  it('undo removes the item that was just added', async () => {
    const { result } = renderHook(() => useCollectionEditState('my-album'));
    await waitFor(() => expect(result.current.col).not.toBeNull());

    await act(async () => {
      await result.current.addSound({ id: 'snd-1', title: 'Dawn' } as never);
    });
    expect(result.current.items).toHaveLength(1);
    const options = toast.success.mock.calls.at(-1)?.[1] as {
      action: { label: string; onClick: () => void };
    };
    expect(options.action.label).toBe('Undo');

    await act(async () => {
      options.action.onClick();
    });
    expect(removeStudioCollectionItem).toHaveBeenCalledWith(
      'my-album',
      'item-7',
    );
    await waitFor(() => expect(result.current.items).toHaveLength(0));
  });
});
