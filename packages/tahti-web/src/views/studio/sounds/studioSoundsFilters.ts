import { type TFunction } from '@tahti-player/i18n';

import type { StudioSoundListFilter } from '../../../api/studio';
import {
  resolveContentTypeId,
  selectableContentTypes,
  type ContentTypeId,
} from '../../../content/contentTypes';
import type { EmbedProvider } from '../../../lib/embedSrc';
import { webT } from '../../../lib/webT';

export type EmbedFilter = 'ALL' | 'NATIVE' | EmbedProvider;
export type SortField = 'title' | 'uploaded' | 'duration';
export type ContentTypeFilter = 'ALL' | ContentTypeId;
export type StatusFilter = 'ALL' | 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR';
export type VisibilityFilter = 'ALL' | 'public' | 'private';
export type PinnedFilter = 'ALL' | 'pinned' | 'unpinned';
export type FallbackFilter = 'ALL' | 'fallback' | 'not-fallback';

export function embedFilters(
  t: TFunction<'web'>,
): Array<{ id: EmbedFilter; label: string }> {
  return [
    { id: 'ALL', label: t('useStudioSoundsState.allSources') },
    { id: 'NATIVE', label: 'Tahti audio' },
    { id: 'HEARTHIS', label: 'hearthis.at' },
    { id: 'MIXCLOUD', label: 'Mixcloud' },
    { id: 'SPOTIFY', label: 'Spotify' },
    { id: 'BANDCAMP', label: 'Bandcamp' },
    { id: 'MIKSERI', label: 'Mikseri.net' },
  ];
}

export function sortFields(
  t: TFunction<'web'>,
): Array<{ id: SortField; label: string }> {
  return [
    { id: 'title', label: t('useStudioSoundsState.title') },
    { id: 'uploaded', label: t('useStudioSoundsState.uploadDate') },
    { id: 'duration', label: t('useStudioSoundsState.duration') },
  ];
}

export function contentTypeFilters(t: TFunction<'web'>): Array<{
  id: ContentTypeFilter;
  label: string;
}> {
  return [
    { id: 'ALL', label: 'All types' },
    ...selectableContentTypes(t).map((type) => ({
      id: type.id,
      label: type.label,
    })),
  ];
}

export function parseContentTypeFilter(
  value: string | undefined,
): ContentTypeFilter {
  const resolved = resolveContentTypeId(value);
  if (!resolved) {
    return 'ALL';
  }
  if (selectableContentTypes(webT()).some((type) => type.id === resolved)) {
    return resolved;
  }
  return 'ALL';
}

export function apiSort(
  field: SortField,
  descending: boolean,
): 'newest' | 'oldest' | 'title' | 'duration' {
  if (field === 'title') {
    return 'title';
  }
  if (field === 'duration') {
    return 'duration';
  }
  return descending ? 'newest' : 'oldest';
}

export function toServerFilter(input: {
  query: string;
  contentTypeFilter: ContentTypeFilter;
  embedFilter: EmbedFilter;
  uploadedFrom: string;
  uploadedTo: string;
  genre?: string;
  tag?: string;
  tags?: string[];
  bpmMin?: string;
  bpmMax?: string;
  key?: string;
  statusFilter?: StatusFilter;
  visibilityFilter?: VisibilityFilter;
  pinnedFilter?: PinnedFilter;
  fallbackFilter?: FallbackFilter;
}): StudioSoundListFilter {
  const bpmMin = input.bpmMin?.trim() ? Number(input.bpmMin) : undefined;
  const bpmMax = input.bpmMax?.trim() ? Number(input.bpmMax) : undefined;
  const tags = (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  return {
    ...(input.query.trim() ? { q: input.query.trim() } : {}),
    ...(input.contentTypeFilter !== 'ALL'
      ? { contentType: input.contentTypeFilter }
      : {}),
    ...(input.embedFilter === 'NATIVE'
      ? { source: 'native' }
      : input.embedFilter !== 'ALL'
        ? { source: input.embedFilter }
        : {}),
    ...(input.uploadedFrom ? { uploadedFrom: input.uploadedFrom } : {}),
    ...(input.uploadedTo ? { uploadedTo: input.uploadedTo } : {}),
    ...(input.genre ? { genre: input.genre } : {}),
    ...(tags.length > 1
      ? { tags }
      : tags.length === 1
        ? { tag: tags[0] }
        : input.tag
          ? { tag: input.tag }
          : {}),
    ...(bpmMin != null && Number.isFinite(bpmMin) ? { bpmMin } : {}),
    ...(bpmMax != null && Number.isFinite(bpmMax) ? { bpmMax } : {}),
    ...(input.key?.trim() ? { key: input.key.trim() } : {}),
    ...(input.statusFilter && input.statusFilter !== 'ALL'
      ? { status: input.statusFilter }
      : {}),
    ...(input.visibilityFilter === 'public'
      ? { isPublic: true }
      : input.visibilityFilter === 'private'
        ? { isPublic: false }
        : {}),
    ...(input.pinnedFilter === 'pinned'
      ? { pinned: true }
      : input.pinnedFilter === 'unpinned'
        ? { pinned: false }
        : {}),
    ...(input.fallbackFilter === 'fallback'
      ? { isFallback: true }
      : input.fallbackFilter === 'not-fallback'
        ? { isFallback: false }
        : {}),
  };
}

export function yearBounds(year: string): {
  uploadedFrom: string;
  uploadedTo: string;
} {
  return {
    uploadedFrom: `${year}-01-01`,
    uploadedTo: `${year}-12-31`,
  };
}
