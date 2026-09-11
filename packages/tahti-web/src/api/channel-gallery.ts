import type { FetchMeta } from './client';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`${path} → ${response.status}`);
  }
  return (await response.json()) as T;
}

export type ChannelGalleryMode =
  | 'NONE'
  | 'STATIC_SLIDESHOW'
  | 'TWISTED_WAVE_GLSL'
  | 'ZOOM_BLUR_GLSL'
  | 'RGB_SHIFT_GLSL'
  | 'POSTER_WALL_GLSL'
  | 'SHATTER_CAROUSEL_GLSL';

export type ChannelGallery = {
  galleryMode: ChannelGalleryMode;
  slideshowImages: string[];
  videoBackgroundUrl: string | null;
};

const DEFAULT_GALLERY: ChannelGallery = {
  galleryMode: 'NONE',
  slideshowImages: [],
  videoBackgroundUrl: null,
};

export async function fetchChannelGallery(): Promise<{
  data: ChannelGallery;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: DEFAULT_GALLERY,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await requestJson<ChannelGallery>('/api/me/channel/gallery');
    return { data, meta: { source: 'api' } };
  } catch (error) {
    if (allowMockFallback()) {
      return { data: DEFAULT_GALLERY, meta: failMeta(error) };
    }
    return { data: DEFAULT_GALLERY, meta: apiErrorMeta(error) };
  }
}

export async function patchChannelGallery(
  patch: Partial<ChannelGallery>,
): Promise<{ ok: true; data: ChannelGallery } | { ok: false; error: string }> {
  try {
    const data = await requestJson<ChannelGallery>('/api/me/channel/gallery', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not save gallery settings',
    };
  }
}
