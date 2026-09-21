import type { FetchMeta } from '.././client';
import { failMeta, isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import { mockPress, setMockPress } from './mock';

export type PublicPressKitImage = {
  id: string;
  imageUrl: string;
  title: string | null;
};

export type PressKitImageItem = PublicPressKitImage & {
  position: number;
  includeInZip: boolean;
};

export const MAX_PRESS_KIT_SELECTED_IMAGES = 10;

export const ACCEPTED_PRESS_KIT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];
export const MAX_PRESS_KIT_IMAGES = 30;

/** Starts empty so the artist-page “add images” affordance is exercisable offline. */
export let mockGalleryImages: PressKitImageItem[] = [];

export let mockGalleryPublic = false;
export let mockGalleryImageCounter = 0;

/** Public gallery on `/u/:username` — empty unless the artist opted in. */
export async function fetchPublicPressKitImages(
  username: string,
): Promise<{ data: PublicPressKitImage[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockGalleryPublic
        ? mockGalleryImages.map(({ id, imageUrl, title }) => ({
            id,
            imageUrl,
            title,
          }))
        : [],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PublicPressKitImage[]>(
      `/api/v1/u/${encodeURIComponent(username)}/press-kit-images.json`,
    );
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

/** Owner list — includes images even when the public gallery is off. */
export async function fetchMyPressKitImages(): Promise<{
  data: PressKitImageItem[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockGalleryImages.map((i) => ({ ...i })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PressKitImageItem[]>(
      '/api/me/press-kit/images',
    );
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function setPressKitGalleryPublic(
  pressKitGalleryPublic: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockGalleryPublic = pressKitGalleryPublic;
    return { ok: true };
  }
  try {
    await requestJson('/api/me/press-kit/gallery-settings', {
      method: 'PATCH',
      body: JSON.stringify({ pressKitGalleryPublic }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Gallery setting failed',
    };
  }
}

export async function uploadPressKitImage(
  file: File,
): Promise<
  { ok: true; image: PressKitImageItem } | { ok: false; error: string }
> {
  const type = file.type || 'image/jpeg';
  if (!ACCEPTED_PRESS_KIT_TYPES.includes(type)) {
    return { ok: false, error: 'Use JPEG, PNG, or WebP' };
  }
  if (isForceMock()) {
    if (mockGalleryImages.length >= MAX_PRESS_KIT_IMAGES) {
      return {
        ok: false,
        error: `Press kit is limited to ${MAX_PRESS_KIT_IMAGES} images`,
      };
    }
    const image: PressKitImageItem = {
      id: `pk-mock-${Date.now()}-${mockGalleryImageCounter++}`,
      imageUrl: URL.createObjectURL(file),
      title: null,
      position: mockGalleryImages.length,
      includeInZip: true,
    };
    mockGalleryImages = [...mockGalleryImages, image];
    setMockPress({ ...mockPress, photoCount: mockGalleryImages.length });
    return { ok: true, image };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>('/api/me/press-kit/images/prepare', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType: type }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': type },
    });
    if (!put.ok) {
      throw new Error(`Upload PUT failed (${put.status})`);
    }
    const { data: image } = await requestJson<PressKitImageItem>(
      '/api/me/press-kit/images/complete',
      {
        method: 'POST',
        body: JSON.stringify({ uploadKey: prep.uploadKey }),
      },
    );
    return { ok: true, image };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

/** Sequential multi-file upload (matches dashboard press-kit builder). */
export async function uploadPressKitImages(files: FileList | File[]): Promise<{
  ok: true;
  images: PressKitImageItem[];
  errors: string[];
}> {
  const list = Array.from(files).slice(0, MAX_PRESS_KIT_IMAGES);
  const images: PressKitImageItem[] = [];
  const errors: string[] = [];
  for (const file of list) {
    const result = await uploadPressKitImage(file);
    if (result.ok) {
      images.push(result.image);
    } else {
      errors.push(`${file.name}: ${result.error}`);
    }
  }
  return { ok: true, images, errors };
}

export async function updatePressKitImage(
  id: string,
  patch: Partial<
    Pick<PressKitImageItem, 'title' | 'includeInZip' | 'position'>
  >,
): Promise<
  { ok: true; data: PressKitImageItem } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const current = mockGalleryImages.find((image) => image.id === id);
    if (!current) {
      return { ok: false, error: 'Image not found' };
    }
    Object.assign(current, patch);
    return { ok: true, data: { ...current } };
  }
  try {
    const { data } = await requestJson<PressKitImageItem>(
      `/api/me/press-kit/images/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Image update failed',
    };
  }
}

export async function deletePressKitImage(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockGalleryImages = mockGalleryImages.filter((i) => i.id !== id);
    setMockPress({ ...mockPress, photoCount: mockGalleryImages.length });
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/press-kit/images/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}
