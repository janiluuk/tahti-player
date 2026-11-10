import { XIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button } from '@tahti-player/ui';

import type { StudioSoundsState } from './useStudioSoundsState';

export function SoundActiveFilterChips({
  state,
}: {
  state: StudioSoundsState;
}) {
  const { t } = useTranslation('web');
  const {
    query,
    setQuery,
    embedFilter,
    setEmbedFilter,
    contentTypeFilter,
    setContentTypeFilter,
    genreFilter,
    setGenreFilter,
    tagFilters,
    removeTagFilter,
    uploadedFrom,
    setUploadedFrom,
    uploadedTo,
    setUploadedTo,
    yearFilter,
    setUploadedYearFilter,
    bpmMin,
    setBpmMin,
    bpmMax,
    setBpmMax,
    keyFilter,
    setKeyFilter,
    statusFilter,
    setStatusFilter,
    visibilityFilter,
    setVisibilityFilter,
    pinnedFilter,
    setPinnedFilter,
    fallbackFilter,
    setFallbackFilter,
    filtersActive,
  } = state;

  if (!filtersActive) {
    return null;
  }

  const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];
  if (query.trim()) {
    chips.push({
      id: 'q',
      label: t('library.filterChipSearch', { value: query.trim() }),
      onRemove: () => setQuery(''),
    });
  }
  if (contentTypeFilter !== 'ALL') {
    chips.push({
      id: 'type',
      label: t('library.filterChipType', { value: contentTypeFilter }),
      onRemove: () => setContentTypeFilter('ALL'),
    });
  }
  if (embedFilter !== 'ALL') {
    chips.push({
      id: 'source',
      label: t('library.filterChipSource', { value: embedFilter }),
      onRemove: () => setEmbedFilter('ALL'),
    });
  }
  if (genreFilter) {
    chips.push({
      id: 'genre',
      label: t('library.filterChipGenre', { value: genreFilter }),
      onRemove: () => setGenreFilter(''),
    });
  }
  for (const tag of tagFilters) {
    chips.push({
      id: `tag-${tag}`,
      label: t('library.filterChipTag', { value: tag }),
      onRemove: () => removeTagFilter(tag),
    });
  }
  if (yearFilter) {
    chips.push({
      id: 'year',
      label: t('library.filterChipYear', { value: yearFilter }),
      onRemove: () => setUploadedYearFilter(''),
    });
  } else {
    if (uploadedFrom) {
      chips.push({
        id: 'from',
        label: t('library.filterChipFrom', { value: uploadedFrom }),
        onRemove: () => setUploadedFrom(''),
      });
    }
    if (uploadedTo) {
      chips.push({
        id: 'to',
        label: t('library.filterChipTo', { value: uploadedTo }),
        onRemove: () => setUploadedTo(''),
      });
    }
  }
  if (bpmMin.trim()) {
    chips.push({
      id: 'bpmMin',
      label: t('library.filterChipBpmMin', { value: bpmMin.trim() }),
      onRemove: () => setBpmMin(''),
    });
  }
  if (bpmMax.trim()) {
    chips.push({
      id: 'bpmMax',
      label: t('library.filterChipBpmMax', { value: bpmMax.trim() }),
      onRemove: () => setBpmMax(''),
    });
  }
  if (keyFilter.trim()) {
    chips.push({
      id: 'key',
      label: t('library.filterChipKey', { value: keyFilter.trim() }),
      onRemove: () => setKeyFilter(''),
    });
  }
  if (statusFilter !== 'ALL') {
    chips.push({
      id: 'status',
      label: t('library.filterChipStatus', { value: statusFilter }),
      onRemove: () => setStatusFilter('ALL'),
    });
  }
  if (visibilityFilter !== 'ALL') {
    chips.push({
      id: 'visibility',
      label: t('library.filterChipVisibility', { value: visibilityFilter }),
      onRemove: () => setVisibilityFilter('ALL'),
    });
  }
  if (pinnedFilter !== 'ALL') {
    chips.push({
      id: 'pinned',
      label: t('library.filterChipPinned', { value: pinnedFilter }),
      onRemove: () => setPinnedFilter('ALL'),
    });
  }
  if (fallbackFilter !== 'ALL') {
    chips.push({
      id: 'fallback',
      label: t('library.filterChipFallback', { value: fallbackFilter }),
      onRemove: () => setFallbackFilter('ALL'),
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <ul
      className="mb-3 flex flex-wrap gap-2"
      aria-label={t('library.activeFilters')}
    >
      {chips.map((chip) => (
        <li key={chip.id}>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            aria-label={t('library.removeFilter', { label: chip.label })}
            onClick={chip.onRemove}
          >
            {chip.label}
            <XIcon size={12} aria-hidden className="ml-1.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
