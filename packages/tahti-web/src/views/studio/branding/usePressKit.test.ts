import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PressKitImageItem } from '../../../api/artist-settings';
import { usePressKit } from './usePressKit';

const { toast } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock('sonner', () => ({ toast }));

const image = (id: string): PressKitImageItem => ({
  id,
  imageUrl: `https://example.test/${id}.jpg`,
  title: null,
  position: 0,
  includeInZip: true,
});

const {
  fetchMeProfile,
  fetchMyPressKitImages,
  fetchPressKitMeta,
  fetchPublicPressKitImages,
  uploadPressKitImages,
  deletePressKitImage,
  setPressKitGalleryPublic,
  updatePressKitImage,
} = vi.hoisted(() => ({
  fetchMeProfile: vi.fn(),
  fetchMyPressKitImages: vi.fn(),
  fetchPressKitMeta: vi.fn(),
  fetchPublicPressKitImages: vi.fn(),
  uploadPressKitImages: vi.fn(),
  deletePressKitImage: vi.fn(),
  setPressKitGalleryPublic: vi.fn(),
  updatePressKitImage: vi.fn(),
}));

vi.mock('../../../api/artist-settings', () => ({
  MAX_PRESS_KIT_SELECTED_IMAGES: 10,
  fetchMyPressKitImages,
  fetchPressKitMeta,
  fetchPublicPressKitImages,
  uploadPressKitImages,
  deletePressKitImage,
  setPressKitGalleryPublic,
  updatePressKitImage,
  removeProfileAvatar: vi.fn(),
  patchPressKitBio: vi.fn(),
}));

vi.mock('../../../api/studio-extras', () => ({ fetchMeProfile }));

describe('usePressKit replace-upload order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMeProfile.mockResolvedValue({
      data: { username: 'artist' },
      meta: { source: 'mock' },
    });
    fetchPressKitMeta.mockResolvedValue({
      data: { bioShort: '' },
      meta: { source: 'mock' },
    });
    fetchPublicPressKitImages.mockResolvedValue({
      data: [],
      meta: { source: 'mock' },
    });
    setPressKitGalleryPublic.mockResolvedValue({ ok: true });
    updatePressKitImage.mockResolvedValue({ ok: true, data: image('new-1') });
  });

  async function setUp(existing: PressKitImageItem[]) {
    fetchMyPressKitImages.mockResolvedValue({
      data: existing,
      meta: { source: 'mock' },
    });
    const { result } = renderHook(() => usePressKit());
    await waitFor(() => expect(result.current.images).toEqual(existing));
    return result;
  }

  it('uploads before deleting the old images on replace', async () => {
    const order: string[] = [];
    uploadPressKitImages.mockImplementation(async () => {
      order.push('upload');
      return { ok: true, images: [image('new-1')], errors: [] };
    });
    deletePressKitImage.mockImplementation(async () => {
      order.push('delete');
      return { ok: true };
    });

    const result = await setUp([image('old-1'), image('old-2')]);
    act(() => result.current.setUploadMode('replace'));

    await act(() => result.current.uploadGallery([new File(['x'], 'a.jpg')]));
    await act(() =>
      result.current.applyGalleryUpload([new File(['x'], 'a.jpg')], true),
    );

    expect(order[0]).toBe('upload');
    expect(order.slice(1)).toEqual(['delete', 'delete']);
    expect(result.current.images.map((i) => i.id)).toEqual(['new-1']);
  });

  it('keeps the old images when the upload fails, never deleting first', async () => {
    uploadPressKitImages.mockResolvedValue({
      ok: true,
      images: [],
      errors: ['a.jpg: too large'],
    });

    const result = await setUp([image('old-1')]);
    act(() => result.current.setUploadMode('replace'));

    await act(() =>
      result.current.applyGalleryUpload([new File(['x'], 'a.jpg')], true),
    );

    expect(deletePressKitImage).not.toHaveBeenCalled();
    expect(result.current.images.map((i) => i.id)).toEqual(['old-1']);
    expect(toast.error).toHaveBeenCalled();
  });

  it('stages a replace-upload behind confirmation when images already exist', async () => {
    const result = await setUp([image('old-1')]);
    act(() => result.current.setUploadMode('replace'));

    await act(() => result.current.uploadGallery([new File(['x'], 'a.jpg')]));

    expect(uploadPressKitImages).not.toHaveBeenCalled();
    expect(result.current.pendingReplaceUpload?.files).toHaveLength(1);
  });
});
