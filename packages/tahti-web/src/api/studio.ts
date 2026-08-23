import type { FetchMeta } from './client';
import { DEMO_MP3 } from './mock';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';
import type {
  EditList,
  EditorDraft,
  EditorProjectDetail,
  EditorProjectRow,
  EditorSource,
  StudioArchiveItem,
  StudioArchivePatch,
  StudioCollection,
  StudioRelease,
  StudioReleaseList,
} from './studio-types';
import { createDefaultEditList } from './studio-types';

const forceMock = isForceMock;

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

// ── Mock fixtures ───────────────────────────────────────────────────────────

const mockArchiveStore: StudioArchiveItem[] = [
  {
    id: 'arch-mock-1',
    title: 'Northern Lights — Live Set',
    status: 'READY',
    durationSec: 3720,
    description: 'Mock archive item for studio POC.',
    genre: 'ambient',
    contentType: 'DJ_MIX',
    isPublic: true,
    visibility: 'PUBLIC',
    releaseDate: '2026-07-15',
    downloadsEnabled: true,
    commentsEnabled: true,
    pinnedAt: '2026-07-15T12:00:00.000Z',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'arch-mock-2',
    title: 'Studio sketch A',
    status: 'READY',
    durationSec: 214,
    genre: 'electronic',
    contentType: 'STUDIO',
    isPublic: false,
    visibility: 'PRIVATE',
    releaseDate: null,
    downloadsEnabled: false,
    commentsEnabled: true,
    createdAt: new Date().toISOString(),
  },
];

let mockProjects: EditorProjectRow[] = [
  {
    id: 'proj-mock-1',
    title: 'Northern Lights — edit',
    archiveItemId: 'arch-mock-1',
    updatedAt: new Date().toISOString(),
  },
];

const mockDrafts = new Map<string, EditorDraft>();

function mockPeaks(durationSec: number) {
  const n = 256;
  const level = Array.from({ length: n }, (_, i) => {
    const t = i / n;
    return (
      0.15 +
      0.7 * Math.abs(Math.sin(t * Math.PI * 8)) * (0.4 + 0.6 * Math.random())
    );
  });
  return { sampleRate: 44100, durationSec, levels: [level] };
}

// ── Archive ─────────────────────────────────────────────────────────────────

export async function fetchStudioArchive(): Promise<{
  data: StudioArchiveItem[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [...mockArchiveStore],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioArchiveItem[]>('/api/me/archive');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: [...mockArchiveStore], meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchStudioArchiveItem(id: string): Promise<{
  data: StudioArchiveItem;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const item = mockArchiveStore.find((a) => a.id === id) ?? {
      ...mockArchiveStore[0]!,
      id,
      title: `Mock ${id}`,
    };
    return { data: item, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<StudioArchiveItem>(
      `/api/me/archive/${encodeURIComponent(id)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      const item =
        mockArchiveStore.find((a) => a.id === id) ?? mockArchiveStore[0]!;
      return { data: { ...item, id }, meta: failMeta(err) };
    }
    throw err instanceof Error ? err : new Error('Archive item fetch failed');
  }
}

export async function patchStudioArchiveItem(
  id: string,
  patch: StudioArchivePatch,
): Promise<
  { ok: true; data: StudioArchiveItem } | { ok: false; error: string }
> {
  if (forceMock()) {
    const idx = mockArchiveStore.findIndex((a) => a.id === id);
    const { pinned, ...rest } = patch;
    if (idx >= 0) {
      const next: StudioArchiveItem = {
        ...mockArchiveStore[idx]!,
        ...rest,
        title: patch.title ?? mockArchiveStore[idx]!.title,
      };
      if (pinned !== undefined) {
        next.pinnedAt = pinned ? new Date().toISOString() : null;
      }
      mockArchiveStore[idx] = next;
      return { ok: true, data: mockArchiveStore[idx]! };
    }
    return {
      ok: true,
      data: {
        id,
        title: patch.title ?? 'Untitled',
        status: 'READY',
        ...rest,
        ...(pinned !== undefined
          ? { pinnedAt: pinned ? new Date().toISOString() : null }
          : {}),
      },
    };
  }
  try {
    const { data } = await requestJson<StudioArchiveItem>(
      `/api/me/archive/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Patch failed',
    };
  }
}

export async function uploadArchiveBanner(
  archiveItemId: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true, url: URL.createObjectURL(file) };
  }
  try {
    const { data: prepared } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>(`/api/me/archive/${encodeURIComponent(archiveItemId)}/banner/prepare`, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'image/jpeg',
      }),
    });
    const upload = await fetch(prepared.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'image/jpeg' },
    });
    if (!upload.ok) {
      throw new Error(`Artwork upload failed (${upload.status})`);
    }
    const { data: completed } = await requestJson<{ url: string }>(
      `/api/me/archive/${encodeURIComponent(archiveItemId)}/banner/complete`,
      {
        method: 'POST',
        body: JSON.stringify({ uploadKey: prepared.uploadKey }),
      },
    );
    return { ok: true, url: completed.url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Artwork upload failed',
    };
  }
}

export async function importArchiveBanner(
  archiveItemId: string,
  sourceUrl: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true, url: sourceUrl };
  }
  try {
    const { data } = await requestJson<{ url: string }>(
      `/api/me/archive/${encodeURIComponent(archiveItemId)}/banner/from-url`,
      {
        method: 'POST',
        body: JSON.stringify({ sourceUrl }),
      },
    );
    return { ok: true, url: data.url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Artwork import failed',
    };
  }
}

export async function deleteStudioArchiveItem(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    const idx = mockArchiveStore.findIndex((a) => a.id === id);
    if (idx >= 0) {
      mockArchiveStore.splice(idx, 1);
    }
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/archive/${encodeURIComponent(id)}`, {
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

export async function fetchEditorSource(archiveItemId: string): Promise<{
  data: EditorSource;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const item = mockArchiveStore.find((a) => a.id === archiveItemId);
    return {
      data: {
        url: DEMO_MP3,
        durationSec: item?.durationSec ?? 180,
        title: item?.title ?? 'Mock source',
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<EditorSource>(
      `/api/me/archive/${encodeURIComponent(archiveItemId)}/editor/source`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { url: DEMO_MP3, durationSec: 180, title: 'Fallback demo audio' },
      meta: apiErrorMeta(err),
    };
  }
}

// ── Releases ────────────────────────────────────────────────────────────────

export async function fetchStudioReleases(): Promise<{
  data: StudioReleaseList;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: {
        page: 1,
        limit: 100,
        total: 3,
        releases: [
          {
            id: 'rel-mock-1',
            title: 'After Hours',
            type: 'ALBUM',
            state: 'PUBLISHED',
            releaseDate: '2026-06-01',
            smartLinkSlug: 'after-hours',
            smartLinkViewCount: 214,
            tracks: [
              {
                id: 't1',
                position: 1,
                title: 'Moonlight Drive',
                archiveItemId: 'arch-mock-1',
              },
              {
                id: 't2',
                position: 2,
                title: 'Blue Hour',
                archiveItemId: 'arch-mock-2',
              },
            ],
            _count: { tracks: 2 },
          },
          {
            id: 'rel-mock-2',
            title: 'Neon Tide',
            type: 'SINGLE',
            state: 'PUBLISHED',
            releaseDate: '2026-04-12',
            smartLinkSlug: 'neon-tide',
            smartLinkViewCount: 88,
            tracks: [
              {
                id: 't3',
                position: 1,
                title: 'Neon Tide',
                archiveItemId: 'arch-mock-3',
              },
            ],
            _count: { tracks: 1 },
          },
          {
            id: 'rel-mock-3',
            title: 'Studio Sessions Vol. 1',
            type: 'EP',
            state: 'DRAFT',
            releaseDate: '2026-08-01',
            smartLinkSlug: 'studio-sessions-vol-1',
            smartLinkViewCount: 0,
            tracks: [
              {
                id: 't4',
                position: 1,
                title: 'Session One',
                archiveItemId: 'arch-mock-4',
              },
            ],
            _count: { tracks: 1 },
          },
        ],
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioReleaseList>(
      '/api/me/releases?page=1&limit=100',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { page: 1, limit: 100, total: 0, releases: [] },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchStudioRelease(
  id: string,
  patch: {
    state?: string;
    description?: string;
    smartLinkTargets?: Record<string, string>;
  },
): Promise<{ ok: true; data: StudioRelease } | { ok: false; error: string }> {
  if (forceMock()) {
    return {
      ok: true,
      data: {
        id,
        title: 'Mock EP',
        type: 'EP',
        state: patch.state ?? 'PUBLISHED',
        releaseDate: '2026-01-01',
        description: patch.description,
        smartLinkSlug: 'mock-ep',
        smartLinkTargets: patch.smartLinkTargets ?? null,
      },
    };
  }
  try {
    const { data } = await requestJson<StudioRelease>(
      `/api/me/releases/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Patch failed',
    };
  }
}

export async function createStudioRelease(input: {
  title: string;
  type?: string;
  releaseDate: string;
  description?: string;
}): Promise<{ ok: true; data: StudioRelease } | { ok: false; error: string }> {
  if (forceMock()) {
    const id = `rel-mock-${Date.now()}`;
    const row: StudioRelease = {
      id,
      title: input.title,
      type: input.type ?? 'SINGLE',
      state: 'DRAFT',
      releaseDate: input.releaseDate,
      description: input.description ?? null,
      smartLinkSlug: `mock-${id.slice(-6)}`,
      _count: { tracks: 0 },
      tracks: [],
    };
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<StudioRelease>('/api/me/releases', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function uploadReleaseArtwork(
  releaseId: string,
  file: File,
): Promise<{ ok: true; artworkUrl: string } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true, artworkUrl: URL.createObjectURL(file) };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>(`/api/me/releases/${encodeURIComponent(releaseId)}/artwork/prepare`, {
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
      throw new Error(`Artwork PUT failed (${put.status})`);
    }
    const { data: done } = await requestJson<{ artworkUrl: string }>(
      `/api/me/releases/${encodeURIComponent(releaseId)}/artwork/complete`,
      { method: 'POST', body: JSON.stringify({ uploadKey: prep.uploadKey }) },
    );
    return { ok: true, artworkUrl: done.artworkUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Artwork upload failed',
    };
  }
}

export type StemJob = {
  stemSet: string;
  status: string;
  errorMessage?: string | null;
  files?: Array<{ label: string; url: string }>;
};

export async function fetchArchiveStems(archiveItemId: string): Promise<{
  data: StemJob[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [
        {
          stemSet: '2STEMS',
          status: 'READY',
          files: [
            { label: 'Vocals', url: DEMO_MP3 },
            { label: 'Instrumental', url: DEMO_MP3 },
          ],
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ jobs: StemJob[] }>(
      `/api/me/archive/${encodeURIComponent(archiveItemId)}/stems`,
    );
    return { data: data.jobs ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function requestArchiveStems(
  archiveItemId: string,
  stemSet = '2STEMS',
): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true, status: 'PENDING' };
  }
  try {
    const { data } = await requestJson<{ status: string }>(
      `/api/me/archive/${encodeURIComponent(archiveItemId)}/stems/render`,
      { method: 'POST', body: JSON.stringify({ stemSet }) },
    );
    return { ok: true, status: data.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Stem request failed',
    };
  }
}

// ── Collections ─────────────────────────────────────────────────────────────

export async function fetchStudioCollections(): Promise<{
  data: StudioCollection[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [
        {
          id: 'mock-collection-favorites-mix',
          slug: 'favorites-mix',
          name: 'Favorites mix',
          description: 'Tracks saved for later listening.',
          style: 'PLAYLIST',
          isPublic: true,
          itemCount: 2,
        },
        {
          id: 'mock-collection-midnight-archive',
          slug: 'midnight-archive',
          name: 'Midnight Archive',
          description: 'A full-length collection of late-night sessions.',
          style: 'ALBUM',
          isPublic: true,
          itemCount: 2,
        },
        {
          id: 'mock-collection-short-signals',
          slug: 'short-signals',
          name: 'Short Signals',
          description: 'Four connected pieces from the same session.',
          style: 'EP',
          isPublic: true,
          itemCount: 2,
        },
        {
          id: 'mock-collection-northern-lights-set',
          slug: 'northern-lights-set',
          name: 'Northern Lights DJ set',
          description: 'A continuous club mix arranged for radio.',
          style: 'DJ_SET_SERIES',
          isPublic: false,
          itemCount: 2,
        },
      ],
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

export async function fetchStudioCollection(slug: string): Promise<{
  data: StudioCollection;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: {
        id: `mock-collection-${slug}`,
        slug,
        name: slug,
        isPublic: true,
        items: mockArchiveStore.map((a, i) => ({
          id: `ci-${a.id}`,
          position: i,
          archiveItemId: a.id,
          archiveItem: { id: a.id, title: a.title, durationSec: a.durationSec },
        })),
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioCollection>(
      `/api/me/collections/${encodeURIComponent(slug)}`,
    );
    return { data, meta: { source: 'api' } };
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
    | { archiveItemId: string; releaseId?: never }
    | { releaseId: string; archiveItemId?: never },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const body =
    typeof item === 'string'
      ? { archiveItemId: item }
      : item.archiveItemId
        ? { archiveItemId: item.archiveItemId }
        : { releaseId: item.releaseId };
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
    const slug =
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || `mix-${Date.now()}`;
    return {
      ok: true,
      data: {
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
      },
    };
  }
  try {
    const { data } = await requestJson<StudioCollection>(
      '/api/me/collections',
      {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          style: input.style ?? 'PLAYLIST',
          description: input.description,
          isPublic: input.isPublic ?? true,
          visibility:
            input.visibility ??
            (input.isPublic === false ? 'PRIVATE' : 'PUBLIC'),
          releaseDate: input.releaseDate,
          genres: input.genres,
          collaborative: Boolean(
            input.collaborative && (input.isPublic ?? true),
          ),
        }),
      },
    );
    return { ok: true, data };
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
    coverUrl?: string | null;
  },
): Promise<
  { ok: true; data: StudioCollection } | { ok: false; error: string }
> {
  if (forceMock()) {
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
        coverUrl: patch.coverUrl ?? null,
        items: [],
      },
    };
  }
  try {
    const { data } = await requestJson<StudioCollection>(
      `/api/me/collections/${encodeURIComponent(slug)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
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
  if (forceMock()) {
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

// ── Upload ──────────────────────────────────────────────────────────────────

export async function uploadArchiveFile(input: {
  file: File;
  title: string;
}): Promise<
  { ok: true; itemId: string; meta: FetchMeta } | { ok: false; error: string }
> {
  if (forceMock()) {
    const id = `arch-mock-${Date.now()}`;
    mockArchiveStore.unshift({
      id,
      title: input.title || input.file.name,
      status: 'READY',
      durationSec: 180,
      isPublic: false,
      createdAt: new Date().toISOString(),
    });
    return {
      ok: true,
      itemId: id,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadId: string;
      uploadUrl: string;
    }>('/api/uploads/prepare', {
      method: 'POST',
      body: JSON.stringify({
        filename: input.file.name,
        contentType: input.file.type || 'audio/mpeg',
        fileSizeBytes: input.file.size,
        title: input.title || input.file.name,
      }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: input.file,
      headers: { 'Content-Type': input.file.type || 'audio/mpeg' },
    });
    if (!put.ok) {
      throw new Error(`Upload PUT failed (${put.status})`);
    }
    const etag =
      put.headers.get('etag') ?? put.headers.get('ETag') ?? '"mock-etag"';
    const { data: done } = await requestJson<{ itemId: string }>(
      '/api/uploads/complete',
      {
        method: 'POST',
        body: JSON.stringify({
          uploadId: prep.uploadId,
          etag: etag.replace(/"/g, ''),
          title: input.title || input.file.name,
        }),
      },
    );
    return { ok: true, itemId: done.itemId, meta: { source: 'api' } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

// ── Editor projects ─────────────────────────────────────────────────────────

export async function fetchEditorProjects(): Promise<{
  data: EditorProjectRow[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [...mockProjects],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<EditorProjectRow[]>(
      '/api/me/editor/projects',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: [...mockProjects], meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function createEditorProject(input: {
  title?: string;
  archiveItemId?: string;
}): Promise<
  { ok: true; data: EditorProjectRow } | { ok: false; error: string }
> {
  if (forceMock()) {
    const row: EditorProjectRow = {
      id: `proj-mock-${Date.now()}`,
      title: input.title ?? 'Untitled session',
      archiveItemId: input.archiveItemId ?? null,
      updatedAt: new Date().toISOString(),
    };
    mockProjects = [row, ...mockProjects];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<EditorProjectRow>(
      '/api/me/editor/projects',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function fetchEditorProject(id: string): Promise<{
  data: EditorProjectDetail;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const row = mockProjects.find((p) => p.id === id) ?? {
      id,
      title: 'Mock project',
      archiveItemId: 'arch-mock-1',
      updatedAt: new Date().toISOString(),
    };
    return {
      data: { ...row, timeline: { tracks: [] } },
      meta: { source: 'mock' },
    };
  }
  try {
    const { data } = await requestJson<EditorProjectDetail>(
      `/api/me/editor/projects/${encodeURIComponent(id)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { id, title: 'Unavailable', updatedAt: new Date().toISOString() },
      meta: apiErrorMeta(err),
    };
  }
}

// ── Archive pro editor draft / render ───────────────────────────────────────

export async function fetchEditorDraft(archiveItemId: string): Promise<{
  data: EditorDraft;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const existing = mockDrafts.get(archiveItemId);
    if (existing) {
      return {
        data: existing,
        meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      };
    }
    const item = mockArchiveStore.find((a) => a.id === archiveItemId);
    const duration = item?.durationSec ?? 180;
    const draft: EditorDraft = {
      editList: createDefaultEditList(duration),
      updatedAt: new Date().toISOString(),
      editorPeaks: mockPeaks(duration),
    };
    mockDrafts.set(archiveItemId, draft);
    return { data: draft, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<EditorDraft>(
      `/api/me/archive/${encodeURIComponent(archiveItemId)}/editor/draft`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    const draft: EditorDraft = {
      editList: createDefaultEditList(180),
      updatedAt: null,
      editorPeaks: mockPeaks(180),
    };
    return { data: draft, meta: apiErrorMeta(err) };
  }
}

export async function saveEditorDraft(
  archiveItemId: string,
  editList: EditList,
  expectedUpdatedAt?: string | null,
): Promise<{ ok: true; updatedAt: string } | { ok: false; error: string }> {
  if (forceMock()) {
    const updatedAt = new Date().toISOString();
    mockDrafts.set(archiveItemId, {
      editList,
      updatedAt,
      editorPeaks: mockPeaks(editList.sourceDuration),
    });
    return { ok: true, updatedAt };
  }
  try {
    const { data } = await requestJson<{ ok: true; updatedAt: string }>(
      `/api/me/archive/${encodeURIComponent(archiveItemId)}/editor/draft`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          editList,
          ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}),
        }),
      },
    );
    return { ok: true, updatedAt: data.updatedAt };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function renderEditorDraft(
  archiveItemId: string,
  editList: EditList,
  versionLabel: string,
  /** false = "save as new revision" -- rendered and added to Revision
   * history, but the currently-live version keeps playing until someone
   * activates it there. true = "overwrite" -- goes live immediately. */
  activate = true,
): Promise<
  { ok: true; versionId: string; status: string } | { ok: false; error: string }
> {
  if (forceMock()) {
    return { ok: true, versionId: `ver-mock-${Date.now()}`, status: 'READY' };
  }
  try {
    const { data } = await requestJson<{
      ok: true;
      versionId: string;
      versionNumber: number;
      status: string;
    }>(`/api/me/archive/${encodeURIComponent(archiveItemId)}/editor/render`, {
      method: 'POST',
      body: JSON.stringify({
        editList,
        versionLabel,
        activate,
        format: 'flac',
      }),
    });
    return { ok: true, versionId: data.versionId, status: data.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Render failed',
    };
  }
}
