import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addStudioCollectionItem,
  fetchCollectionGallery,
  removeStudioCollectionItem,
} from './studio-collections';

const { requestJson } = vi.hoisted(() => ({ requestJson: vi.fn() }));
vi.mock('./studio-request', () => ({ requestJson }));

describe('addStudioCollectionItem', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
    requestJson.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('returns the id of the item it created, so the add can be undone', async () => {
    requestJson.mockResolvedValue({
      data: { id: 'item-9', position: 3 },
      status: 201,
    });
    expect(await addStudioCollectionItem('night', { soundId: 's1' })).toEqual({
      ok: true,
      itemId: 'item-9',
    });
    expect(requestJson).toHaveBeenCalledWith(
      '/api/me/collections/night/items',
      {
        method: 'POST',
        body: JSON.stringify({ soundId: 's1' }),
      },
    );
  });

  it('reports no id when the API sends none', async () => {
    requestJson.mockResolvedValue({ data: null, status: 201 });
    expect(await addStudioCollectionItem('night', 's1')).toEqual({
      ok: true,
      itemId: null,
    });
  });

  it('marks gallery fetch as not loaded when the API fails', async () => {
    requestJson.mockRejectedValue(new Error('network'));
    await expect(fetchCollectionGallery('night')).resolves.toEqual({
      data: {
        galleryMode: 'NONE',
        slideshowImages: [],
        videoBackgroundUrl: null,
      },
      meta: { loaded: false },
    });
  });

  it('removes an item by id', async () => {
    requestJson.mockResolvedValue({ data: null, status: 204 });
    expect(await removeStudioCollectionItem('night', 'item-9')).toEqual({
      ok: true,
    });
    expect(requestJson).toHaveBeenCalledWith(
      '/api/me/collections/night/items/item-9',
      {
        method: 'DELETE',
      },
    );
  });
});
