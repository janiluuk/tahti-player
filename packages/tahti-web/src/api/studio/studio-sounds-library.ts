import type { FetchMeta } from '../client';
import { mockFixture } from '../mock-overrides';
import {
  allowMockFallback,
  apiErrorMeta,
  isForceMock,
  mockFallbackMeta,
} from '../mode';
import { RequestJsonError } from '../request-json';
import type { StudioSound } from '../studio-types';
import { mockSoundStore } from './studio-mock';
import { requestJson } from './studio-request';
import { applySavedMockSoundAccess } from './studio-sounds';

/** Cap aligned with tahti-org `SOUND_BULK_MAX_IDS` for the ids bulk form. */
export const STUDIO_SOUND_BULK_MAX_IDS = 5_000;

function bulkOpFailure(
  err: unknown,
  fallback: string,
): { ok: false; error: string; totalMatched?: number } {
  const message = err instanceof Error ? err.message : fallback;
  let totalMatched: number | undefined;
  if (
    err instanceof RequestJsonError &&
    err.body &&
    typeof err.body === 'object'
  ) {
    const raw = (err.body as { totalMatched?: unknown }).totalMatched;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      totalMatched = raw;
    }
  }
  if (totalMatched === undefined) {
    const matched = /:\s*(\d+)\s+sounds match/.exec(message);
    if (matched) {
      totalMatched = Number(matched[1]);
    }
  }
  return {
    ok: false,
    error: message,
    ...(totalMatched !== undefined ? { totalMatched } : {}),
  };
}

// ── Sounds ─────────────────────────────────────────────────────────────────

export async function fetchStudioSounds(): Promise<{
  data: StudioSound[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    applySavedMockSoundAccess();
    return {
      data: mockFixture('studioSounds', [...mockSoundStore]),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioSound[]>('/api/me/sound');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: mockFixture('studioSounds', [...mockSoundStore]),
        meta: mockFallbackMeta(err),
      };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

/** Filters shared by the paged list, ids, facets, stats and bulk-by-filter. */
export type StudioSoundListFilter = {
  q?: string;
  contentType?: string;
  source?: string;
  status?: string;
  uploadedFrom?: string;
  uploadedTo?: string;
  genre?: string;
  tag?: string;
  bpmMin?: number;
  bpmMax?: number;
  key?: string;
  isPublic?: boolean;
  isFallback?: boolean;
  pinned?: boolean;
};

export type StudioSoundListQuery = StudioSoundListFilter & {
  sort?: 'newest' | 'oldest' | 'title' | 'duration' | 'bpm' | 'genre';
  limit?: number;
  offset?: number;
};

export type StudioSoundListPage = {
  items: StudioSound[];
  total: number;
};

export type StudioSoundFacetValue = { value: string; count: number };

export type StudioSoundFacets = {
  facets: Record<string, StudioSoundFacetValue[]>;
  total: number;
};

export type StudioSoundStats = {
  total: number;
  durationSec: number;
  publicCount: number;
  privateCount: number;
  processingCount: number;
  errorCount: number;
  readyCount: number;
};

export type StudioSoundBulkFailure = { id: string; error: string };

export type StudioSoundBulkDeleteResult = {
  deleted: number;
  failed: StudioSoundBulkFailure[];
  totalMatched: number;
};

export type StudioSoundBulkPatchResult = {
  updated: number;
  failed: StudioSoundBulkFailure[];
  totalMatched: number;
};

export type StudioSoundBulkPatch = {
  genre?: string | null;
  genreCustom?: string | null;
  tags?: string[];
  subGenres?: string[];
  contentType?: string;
  isPublic?: boolean;
  isFallback?: boolean;
  downloadsEnabled?: boolean;
  commentsEnabled?: boolean;
  license?: string;
  releasedAt?: string | null;
};

function soundListQueryString(
  query: StudioSoundListQuery & { fields?: string },
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}

function filterMockSounds(
  items: StudioSound[],
  filter: StudioSoundListFilter,
): StudioSound[] {
  const q = filter.q?.trim().toLowerCase();
  return items.filter((item) => {
    if (
      q &&
      !(
        item.title.toLowerCase().includes(q) ||
        (item.genre?.toLowerCase().includes(q) ?? false) ||
        (item.contentType?.toLowerCase().includes(q) ?? false)
      )
    ) {
      return false;
    }
    if (filter.contentType && item.contentType !== filter.contentType) {
      return false;
    }
    if (filter.source === 'native' && item.embedProvider) {
      return false;
    }
    if (
      filter.source &&
      filter.source !== 'native' &&
      item.embedProvider !== filter.source
    ) {
      return false;
    }
    if (filter.status && item.status !== filter.status) {
      return false;
    }
    if (filter.genre && item.genre !== filter.genre) {
      return false;
    }
    if (filter.tag && !(item.tags ?? []).includes(filter.tag)) {
      return false;
    }
    if (filter.isPublic != null && Boolean(item.isPublic) !== filter.isPublic) {
      return false;
    }
    if (
      filter.isFallback != null &&
      Boolean(item.isFallback) !== filter.isFallback
    ) {
      return false;
    }
    if (filter.pinned === true && !item.pinnedAt) {
      return false;
    }
    if (filter.pinned === false && item.pinnedAt) {
      return false;
    }
    if (filter.uploadedFrom || filter.uploadedTo) {
      if (!item.createdAt) {
        return false;
      }
      const at = new Date(item.createdAt).getTime();
      if (filter.uploadedFrom) {
        const from = new Date(`${filter.uploadedFrom}T00:00:00`).getTime();
        if (at < from) {
          return false;
        }
      }
      if (filter.uploadedTo) {
        const to = new Date(`${filter.uploadedTo}T00:00:00`);
        to.setDate(to.getDate() + 1);
        if (at >= to.getTime()) {
          return false;
        }
      }
    }
    const bpm = item.bpm ?? null;
    if (filter.bpmMin != null && (bpm == null || bpm < filter.bpmMin)) {
      return false;
    }
    if (filter.bpmMax != null && (bpm == null || bpm > filter.bpmMax)) {
      return false;
    }
    if (
      filter.key &&
      !(item.musicalKey ?? '').toLowerCase().includes(filter.key.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

export type StudioSoundCoversBackfillResult = {
  assigned: number;
  totalMatched: number;
};

export async function backfillStudioSoundCovers(): Promise<
  | { ok: true; data: StudioSoundCoversBackfillResult }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    let assigned = 0;
    for (const sound of mockSoundStore) {
      if (!sound.bannerUrl) {
        sound.bannerUrl = '/presets/cover-mock.png';
        assigned += 1;
      }
    }
    return { ok: true, data: { assigned, totalMatched: assigned } };
  }
  try {
    const { data } = await requestJson<StudioSoundCoversBackfillResult>(
      '/api/me/sound/covers/backfill',
      { method: 'POST', body: '{}' },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not backfill covers',
    };
  }
}

/** Paged Sounds list (`limit` required so the API returns `{ items, total }`). */
export async function fetchStudioSoundsPage(
  query: StudioSoundListQuery,
): Promise<{ data: StudioSoundListPage; meta: FetchMeta }> {
  const limit = query.limit ?? 50;
  if (isForceMock()) {
    applySavedMockSoundAccess();
    const filtered = filterMockSounds([...mockSoundStore], query);
    const offset = query.offset ?? 0;
    return {
      data: {
        items: filtered.slice(offset, offset + limit),
        total: filtered.length,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioSoundListPage>(
      `/api/me/sound${soundListQueryString({ ...query, limit })}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      const filtered = filterMockSounds([...mockSoundStore], query);
      const offset = query.offset ?? 0;
      return {
        data: {
          items: filtered.slice(offset, offset + limit),
          total: filtered.length,
        },
        meta: mockFallbackMeta(err),
      };
    }
    return { data: { items: [], total: 0 }, meta: apiErrorMeta(err) };
  }
}

export async function fetchStudioSoundIds(
  filter: StudioSoundListFilter = {},
): Promise<{
  data: { ids: string[]; total: number };
  meta: FetchMeta;
  /** Present when the API refused the select-all (ids cap). */
  tooLarge?: { totalMatched: number; error: string };
}> {
  if (isForceMock()) {
    const filtered = filterMockSounds([...mockSoundStore], filter);
    return {
      data: { ids: filtered.map((item) => item.id), total: filtered.length },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ ids: string[]; total: number }>(
      `/api/me/sound/ids${soundListQueryString(filter)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (err instanceof RequestJsonError && err.status === 413) {
      const body = err.body as
        { error?: string; totalMatched?: number } | undefined;
      const totalMatched =
        typeof body?.totalMatched === 'number' ? body.totalMatched : 0;
      return {
        data: { ids: [], total: 0 },
        meta: apiErrorMeta(err),
        tooLarge: {
          totalMatched,
          error:
            typeof body?.error === 'string'
              ? body.error
              : err.message || 'Too many matches; refine the filter.',
        },
      };
    }
    if (allowMockFallback()) {
      const filtered = filterMockSounds([...mockSoundStore], filter);
      return {
        data: { ids: filtered.map((item) => item.id), total: filtered.length },
        meta: mockFallbackMeta(err),
      };
    }
    return { data: { ids: [], total: 0 }, meta: apiErrorMeta(err) };
  }
}

export async function fetchStudioSoundFacets(
  fields: readonly string[],
  filter: StudioSoundListFilter = {},
): Promise<{ data: StudioSoundFacets; meta: FetchMeta }> {
  if (isForceMock()) {
    const filtered = filterMockSounds([...mockSoundStore], filter);
    const facets: Record<string, StudioSoundFacetValue[]> = {};
    if (fields.includes('genre')) {
      const counts = new Map<string, number>();
      for (const item of filtered) {
        if (!item.genre) {
          continue;
        }
        counts.set(item.genre, (counts.get(item.genre) ?? 0) + 1);
      }
      facets.genre = [...counts.entries()].map(([value, count]) => ({
        value,
        count,
      }));
    }
    if (fields.includes('tag')) {
      const counts = new Map<string, number>();
      for (const item of filtered) {
        for (const tag of item.tags ?? []) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
      facets.tag = [...counts.entries()].map(([value, count]) => ({
        value,
        count,
      }));
    }
    return {
      data: { facets, total: filtered.length },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioSoundFacets>(
      `/api/me/sound/facets${soundListQueryString({
        ...filter,
        fields: fields.join(','),
      })}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: { facets: {}, total: 0 },
        meta: mockFallbackMeta(err),
      };
    }
    return { data: { facets: {}, total: 0 }, meta: apiErrorMeta(err) };
  }
}

export async function fetchStudioSoundStats(
  filter: StudioSoundListFilter = {},
): Promise<{ data: StudioSoundStats; meta: FetchMeta }> {
  const empty: StudioSoundStats = {
    total: 0,
    durationSec: 0,
    publicCount: 0,
    privateCount: 0,
    processingCount: 0,
    errorCount: 0,
    readyCount: 0,
  };
  if (isForceMock()) {
    const filtered = filterMockSounds([...mockSoundStore], filter);
    return {
      data: {
        total: filtered.length,
        durationSec: filtered.reduce(
          (sum, item) => sum + (item.durationSec ?? 0),
          0,
        ),
        publicCount: filtered.filter((item) => item.isPublic !== false).length,
        privateCount: filtered.filter((item) => item.isPublic === false).length,
        processingCount: filtered.filter(
          (item) => item.status === 'PENDING' || item.status === 'PROCESSING',
        ).length,
        errorCount: filtered.filter((item) => item.status === 'ERROR').length,
        readyCount: filtered.filter((item) => item.status === 'READY').length,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StudioSoundStats>(
      `/api/me/sound/stats${soundListQueryString(filter)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: empty, meta: mockFallbackMeta(err) };
    }
    return { data: empty, meta: apiErrorMeta(err) };
  }
}

export async function bulkDeleteStudioSounds(
  body:
    | { ids: string[] }
    | { filter: StudioSoundListFilter; confirmTotal: number; all?: boolean },
): Promise<
  | { ok: true; data: StudioSoundBulkDeleteResult }
  | { ok: false; error: string; totalMatched?: number }
> {
  if (isForceMock()) {
    const ids =
      'ids' in body
        ? body.ids
        : filterMockSounds([...mockSoundStore], body.filter).map(
            (item) => item.id,
          );
    if ('filter' in body && ids.length !== body.confirmTotal) {
      return {
        ok: false,
        error: `the library changed: ${ids.length} sounds match, not ${body.confirmTotal}`,
        totalMatched: ids.length,
      };
    }
    for (const id of ids) {
      const idx = mockSoundStore.findIndex((item) => item.id === id);
      if (idx >= 0) {
        mockSoundStore.splice(idx, 1);
      }
    }
    return {
      ok: true,
      data: { deleted: ids.length, failed: [], totalMatched: ids.length },
    };
  }
  try {
    const { data } = await requestJson<StudioSoundBulkDeleteResult>(
      '/api/me/sound/bulk-delete',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return { ok: true, data };
  } catch (err) {
    return bulkOpFailure(err, 'Bulk delete failed');
  }
}

export async function bulkPatchStudioSounds(
  body:
    | { ids: string[]; patch: StudioSoundBulkPatch }
    | {
        filter: StudioSoundListFilter;
        confirmTotal: number;
        all?: boolean;
        patch: StudioSoundBulkPatch;
      },
): Promise<
  | { ok: true; data: StudioSoundBulkPatchResult }
  | { ok: false; error: string; totalMatched?: number }
> {
  if (isForceMock()) {
    const ids =
      'ids' in body
        ? body.ids
        : filterMockSounds([...mockSoundStore], body.filter).map(
            (item) => item.id,
          );
    if ('filter' in body && ids.length !== body.confirmTotal) {
      return {
        ok: false,
        error: `the library changed: ${ids.length} sounds match, not ${body.confirmTotal}`,
        totalMatched: ids.length,
      };
    }
    for (const id of ids) {
      const idx = mockSoundStore.findIndex((item) => item.id === id);
      if (idx < 0) {
        continue;
      }
      mockSoundStore[idx] = { ...mockSoundStore[idx]!, ...body.patch };
    }
    return {
      ok: true,
      data: { updated: ids.length, failed: [], totalMatched: ids.length },
    };
  }
  try {
    const { data } = await requestJson<StudioSoundBulkPatchResult>(
      '/api/me/sound/bulk-patch',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return { ok: true, data };
  } catch (err) {
    return bulkOpFailure(err, 'Bulk edit failed');
  }
}
