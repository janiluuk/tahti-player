import type { FetchMeta } from '../client';
import { mockFixture, onMockOverridesReset } from '../mock-overrides';
import { apiErrorMeta, isForceMock } from '../mode';
import type {
  CollectionTrackSortMode,
  StudioCollection,
} from '../studio-types';
import { mockSoundStore } from './studio-mock';
import { requestJson } from './studio-request';

// ── Collections ─────────────────────────────────────────────────────────────

const MOCK_COLLECTION_SEED: StudioCollection[] = [
  {
    id: 'mock-collection-favorites-mix',
    slug: 'favorites-mix',
    name: 'Favorites mix',
    description: 'Tracks saved for later listening.',
    style: 'PLAYLIST',
    isPublic: true,
    itemCount: 2,
    createdAt: '2026-05-01T12:00:00.000Z',
  },
  {
    id: 'mock-collection-midnight-archive',
    slug: 'midnight-archive',
    name: 'Midnight Archive',
    description: 'A full-length collection of late-night sessions.',
    style: 'ALBUM',
    isPublic: true,
    itemCount: 2,
    createdAt: '2026-07-15T12:00:00.000Z',
  },
  {
    id: 'mock-collection-short-signals',
    slug: 'short-signals',
    name: 'Short Signals',
    description: 'Four connected pieces from the same session.',
    style: 'EP',
    isPublic: true,
    itemCount: 2,
    createdAt: '2026-08-01T12:00:00.000Z',
  },
  {
    id: 'mock-collection-northern-lights-set',
    slug: 'northern-lights-set',
    name: 'Northern Lights DJ set',
    description: 'A continuous club mix arranged for radio.',
    style: 'DJ_SET_SERIES',
    isPublic: false,
    itemCount: 2,
    createdAt: '2026-06-10T12:00:00.000Z',
  },
];

/** Mutable mock list so create/Design matches the collection just made. */
let mockCollectionStore: StudioCollection[] | null = null;

onMockOverridesReset(() => {
  mockCollectionStore = null;
});

function getMockCollectionStore(): StudioCollection[] {
  if (!mockCollectionStore) {
    mockCollectionStore = mockFixture(
      'studioCollections',
      MOCK_COLLECTION_SEED,
    ).map((row) => ({ ...row }));
  }
  return mockCollectionStore;
}

type StudioCollectionsResult = {
  data: StudioCollection[];
  meta: FetchMeta;
};

let inflightCollections: Promise<StudioCollectionsResult> | null = null;

/** The artist's collections with items. Callers that ask while a request is
 * already running share it: every track row's context menu asks on mount,
 * which sent the same request once per row. Nothing is cached after it
 * settles, so edits are always re-read. */
export function fetchStudioCollections(): Promise<StudioCollectionsResult> {
  if (!inflightCollections) {
    inflightCollections = loadStudioCollections().finally(() => {
      inflightCollections = null;
    });
  }
  return inflightCollections.then((result) => ({
    data: result.data.map((row) => ({ ...row })),
    meta: result.meta,
  }));
}

async function loadStudioCollections(): Promise<StudioCollectionsResult> {
  if (isForceMock()) {
    return {
      data: getMockCollectionStore().map((row) => ({ ...row })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioCollection[]>(
      '/api/me/collections?expand=items',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchStudioCollectionCount(): Promise<{
  data: number;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const { data } = await fetchStudioCollections();
    return {
      data: data.length,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ count: number }>(
      '/api/me/collections/count',
    );
    return { data: data.count, meta: { source: 'api' } };
  } catch (err) {
    return { data: 0, meta: apiErrorMeta(err) };
  }
}

/** The editor says "Private" where the API stores `DRAFT`. */
type ServerVisibility = 'PUBLIC' | 'UNLISTED' | 'DRAFT';

function withEditorVisibility(collection: StudioCollection): StudioCollection {
  const visibility = collection.visibility as
    ServerVisibility | StudioCollection['visibility'];
  const items = collection.items?.map((item) =>
    item.sound
      ? { ...item, sound: { ...item.sound, audioUrl: item.audioUrl ?? null } }
      : item,
  );
  return {
    ...collection,
    ...(items ? { items } : {}),
    ...(visibility === 'DRAFT' ? { visibility: 'PRIVATE' as const } : {}),
  };
}

const toServerVisibility = (
  visibility: NonNullable<StudioCollection['visibility']>,
): ServerVisibility => (visibility === 'PRIVATE' ? 'DRAFT' : visibility);

export async function fetchStudioCollection(slug: string): Promise<{
  data: StudioCollection;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const listed = getMockCollectionStore().find((row) => row.slug === slug);
    return {
      data: {
        id: `mock-collection-${slug}`,
        slug,
        name: slug,
        style:
          slug === 'short-signals'
            ? 'EP'
            : slug === 'midnight-archive'
              ? 'ALBUM'
              : 'PLAYLIST',
        isPublic: true,
        ...listed,
        items: mockSoundStore.map((a, i) => ({
          id: `ci-${a.id}`,
          position: i,
          soundId: a.id,
          sound: { id: a.id, title: a.title, durationSec: a.durationSec },
        })),
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioCollection>(
      `/api/me/collections/${encodeURIComponent(slug)}`,
    );
    return { data: withEditorVisibility(data), meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { slug, name: slug, items: [] },
      meta: apiErrorMeta(err),
    };
  }
}

export async function addStudioCollectionItem(
  slug: string,
  item:
    | string
    | { soundId: string; releaseId?: never }
    | { releaseId: string; soundId?: never },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const body =
    typeof item === 'string'
      ? { soundId: item }
      : item.soundId
        ? { soundId: item.soundId }
        : { releaseId: item.releaseId };
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/collections/${encodeURIComponent(slug)}/items`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Add failed',
    };
  }
}

export async function reorderStudioCollectionItems(
  slug: string,
  itemIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/collections/${encodeURIComponent(slug)}/reorder`,
      {
        method: 'PUT',
        body: JSON.stringify({ itemIds }),
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Reorder failed',
    };
  }
}

export async function removeStudioCollectionItem(
  slug: string,
  itemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/collections/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemId)}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Remove failed',
    };
  }
}

export async function deleteStudioCollection(
  slug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/collections/${encodeURIComponent(slug)}`, {
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

export async function createStudioCollection(input: {
  name: string;
  style?: string;
  description?: string;
  isPublic?: boolean;
  visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  releaseDate?: string | null;
  genres?: string[];
  collaborative?: boolean;
}): Promise<
  { ok: true; data: StudioCollection } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const slug =
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || `mix-${Date.now()}`;
    const created: StudioCollection = {
      id: `mock-collection-${slug}`,
      slug,
      name: input.name,
      description: input.description ?? null,
      style: input.style ?? 'PLAYLIST',
      isPublic: input.isPublic ?? true,
      visibility:
        input.visibility ?? (input.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
      releaseDate: input.releaseDate ?? null,
      genres: input.genres ?? [],
      collaborative: Boolean(input.collaborative && (input.isPublic ?? true)),
      items: [],
      itemCount: 0,
    };
    getMockCollectionStore().unshift(created);
    return { ok: true, data: created };
  }
  try {
    const visibility = toServerVisibility(
      input.visibility ?? (input.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
    );
    const { data } = await requestJson<StudioCollection>(
      '/api/me/collections',
      {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          style: input.style ?? 'PLAYLIST',
          description: input.description,
          isPublic: visibility === 'PUBLIC',
          visibility,
          releaseDate: input.releaseDate,
          genres: input.genres,
          collaborative: Boolean(
            input.collaborative && (input.isPublic ?? true),
          ),
        }),
      },
    );
    return { ok: true, data: withEditorVisibility(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function patchStudioCollection(
  slug: string,
  patch: {
    name?: string;
    description?: string | null;
    style?: string;
    isPublic?: boolean;
    visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
    releaseDate?: string | null;
    genres?: string[];
    collaborative?: boolean;
    trackSortMode?: CollectionTrackSortMode;
    coverUrl?: string | null;
    backdropUrl?: string | null;
    /** Saved in the same request (and the same row update) as the details. */
    gallery?: Partial<CollectionGallery>;
  },
): Promise<
  { ok: true; data: StudioCollection } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      data: {
        slug,
        name: patch.name ?? slug,
        description: patch.description ?? null,
        style: patch.style ?? 'ALBUM',
        isPublic: patch.isPublic ?? true,
        visibility:
          patch.visibility ?? (patch.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
        releaseDate: patch.releaseDate ?? null,
        genres: patch.genres ?? [],
        collaborative: Boolean(patch.collaborative && (patch.isPublic ?? true)),
        trackSortMode: patch.trackSortMode ?? 'MANUAL',
        coverUrl: patch.coverUrl ?? null,
        backdropUrl: patch.backdropUrl ?? null,
        items: [],
      },
    };
  }
  try {
    const body = {
      ...patch,
      ...(patch.visibility
        ? { visibility: toServerVisibility(patch.visibility) }
        : {}),
    };
    const { data } = await requestJson<StudioCollection>(
      `/api/me/collections/${encodeURIComponent(slug)}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
    return { ok: true, data: withEditorVisibility(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function uploadCollectionCover(
  slug: string,
  file: File,
): Promise<{ ok: true; coverUrl: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    const url = URL.createObjectURL(file);
    return { ok: true, coverUrl: url };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>(`/api/me/collections/${encodeURIComponent(slug)}/cover/prepare`, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'image/jpeg',
      }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'image/jpeg' },
    });
    if (!put.ok) {
      throw new Error(`Cover PUT failed (${put.status})`);
    }
    const { data: done } = await requestJson<{ url?: string | null }>(
      `/api/me/collections/${encodeURIComponent(slug)}/cover/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ uploadKey: prep.uploadKey }),
      },
    );
    return { ok: true, coverUrl: done.url ?? '' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Cover upload failed',
    };
  }
}

export type CollectionGalleryMode =
  | 'NONE'
  | 'STATIC_SLIDESHOW'
  | 'TWISTED_WAVE_GLSL'
  | 'ZOOM_BLUR_GLSL'
  | 'RGB_SHIFT_GLSL'
  | 'POSTER_WALL_GLSL'
  | 'SHATTER_CAROUSEL_GLSL';

export type CollectionGallery = {
  galleryMode: CollectionGalleryMode;
  slideshowImages: string[];
  videoBackgroundUrl: string | null;
};

const DEFAULT_COLLECTION_GALLERY: CollectionGallery = {
  galleryMode: 'NONE',
  slideshowImages: [],
  videoBackgroundUrl: null,
};

export async function fetchCollectionGallery(
  slug: string,
): Promise<{ data: CollectionGallery }> {
  if (isForceMock()) {
    return { data: DEFAULT_COLLECTION_GALLERY };
  }
  try {
    const { data } = await requestJson<CollectionGallery>(
      `/api/me/collections/${encodeURIComponent(slug)}/gallery`,
    );
    return { data };
  } catch {
    return { data: DEFAULT_COLLECTION_GALLERY };
  }
}

/** Backdrop can be a single still image (`slideshowImages` with one entry,
 * mode NONE) or an actual slideshow (multiple entries, mode
 * STATIC_SLIDESHOW) — same shape the channel-wide gallery uses
 * (see api/channel-gallery.ts), just scoped to one collection. */
export async function patchCollectionGallery(
  slug: string,
  patch: Partial<CollectionGallery>,
): Promise<
  { ok: true; data: CollectionGallery } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      data: {
        galleryMode: patch.galleryMode ?? 'NONE',
        slideshowImages: patch.slideshowImages ?? [],
        videoBackgroundUrl: patch.videoBackgroundUrl ?? null,
      },
    };
  }
  try {
    const { data } = await requestJson<CollectionGallery>(
      `/api/me/collections/${encodeURIComponent(slug)}/gallery`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not save backdrop images',
    };
  }
}
