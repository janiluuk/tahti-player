import {
  ArrowDownWideNarrowIcon,
  ArrowUpNarrowWideIcon,
  ChevronDownIcon,
  FilterIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Input,
  Select,
  SortMenuButton,
  Tooltip,
} from '@tahti-player/ui';

import {
  trackViewOptions,
  TrackViewPicker,
} from '../../../components/TrackViewPicker';
import { useTrackListViewStore } from '../../../stores/trackListViewStore';
import {
  contentTypeFilters,
  embedFilters,
  sortFields,
  type ContentTypeFilter,
  type EmbedFilter,
  type FallbackFilter,
  type PinnedFilter,
  type SortField,
  type StatusFilter,
  type VisibilityFilter,
} from './studioSoundsFilters';
import type { StudioSoundsState } from './useStudioSoundsState';

export function SoundFilters({ state }: { state: StudioSoundsState }) {
  const { t } = useTranslation('web');
  const {
    query,
    setQuery,
    filtersOpen,
    setFiltersOpen,
    clearFilters,
    filtersActive,
    pinnedCount,
    embedFilter,
    setEmbedFilter,
    contentTypeFilter,
    setContentTypeFilter,
    sortField,
    setSortField,
    sortDescending,
    setSortDescending,
    uploadedFrom,
    setUploadedFrom,
    uploadedTo,
    setUploadedTo,
    genreFilter,
    setGenreFilter,
    tagFilters,
    addTagFilter,
    bpmMin,
    setBpmMin,
    bpmMax,
    setBpmMax,
    keyFilter,
    setKeyFilter,
    yearFilter,
    setUploadedYearFilter,
    clearYearLabel,
    statusFilter,
    setStatusFilter,
    visibilityFilter,
    setVisibilityFilter,
    pinnedFilter,
    setPinnedFilter,
    fallbackFilter,
    setFallbackFilter,
    facets,
  } = state;
  const storedView = useTrackListViewStore((store) => store.view);
  const setView = useTrackListViewStore((store) => store.setView);
  const view =
    storedView === null || storedView === 'grid' ? 'comfortable' : storedView;
  const sortLabel = sortDescending
    ? t('library.sortDescending')
    : t('library.sortAscending');
  const leaveAll = t('library.allFilter');
  const filtersModified =
    embedFilter !== 'ALL' ||
    Boolean(genreFilter) ||
    tagFilters.length > 0 ||
    Boolean(uploadedFrom) ||
    Boolean(uploadedTo) ||
    Boolean(yearFilter) ||
    Boolean(bpmMin.trim()) ||
    Boolean(bpmMax.trim()) ||
    Boolean(keyFilter.trim()) ||
    statusFilter !== 'ALL' ||
    visibilityFilter !== 'ALL' ||
    pinnedFilter !== 'ALL' ||
    fallbackFilter !== 'ALL';
  const queryActive = Boolean(query.trim());
  const facetCount = (
    field: keyof typeof facets,
    value: string,
  ): number | undefined =>
    facets[field].find((facet) => facet.value === value)?.count;
  const withCount = (label: string, count: number | undefined) =>
    count == null ? label : t('library.facetOption', { value: label, count });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          enterKeyHint="search"
          type="search"
          aria-label={t('library.searchSounds')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('library.searchPlaceholder')}
          className="max-w-md flex-1"
          startAddon={
            <SearchIcon size={14} aria-hidden className="opacity-70" />
          }
          endAddon={
            queryActive ? (
              <button
                type="button"
                className="inline-flex items-center justify-center"
                aria-label={t('library.clearSearch')}
                onClick={() => setQuery('')}
              >
                <XIcon size={14} aria-hidden />
              </button>
            ) : (
              <SearchIcon size={14} aria-hidden className="opacity-0" />
            )
          }
          endAddonActive={queryActive}
        />
        {filtersActive ? (
          <Button
            type="button"
            size="sm"
            variant="text"
            aria-label={t('library.clearFilters')}
            onClick={clearFilters}
          >
            {t('library.clearFilters')}
          </Button>
        ) : null}
        <Select
          aria-label={t('library.typeFilter')}
          value={contentTypeFilter}
          onValueChange={(value) =>
            setContentTypeFilter(value as ContentTypeFilter)
          }
          options={contentTypeFilters(t).map((filterOption) => ({
            id: filterOption.id,
            label:
              filterOption.id === 'ALL'
                ? filterOption.label
                : withCount(
                    filterOption.label,
                    facetCount('contentType', filterOption.id),
                  ),
          }))}
          className="min-w-36"
        />
        <Tooltip
          content={
            filtersOpen
              ? t('library.collapseFilters')
              : t('library.expandFilters')
          }
          side="top"
        >
          <Button
            type="button"
            size="icon-sm"
            variant={filtersModified ? 'secondary' : 'text'}
            aria-expanded={filtersOpen}
            aria-pressed={filtersModified || undefined}
            aria-label={
              filtersOpen
                ? t('library.collapseFilters')
                : t('library.expandFilters')
            }
            onClick={() => setFiltersOpen((current) => !current)}
          >
            <FilterIcon size={15} aria-hidden />
            <ChevronDownIcon
              size={13}
              aria-hidden
              className={filtersOpen ? 'rotate-180' : ''}
            />
          </Button>
        </Tooltip>
        <div
          className="flex shrink-0 items-center gap-2"
          data-testid="sound-sort-size"
        >
          <SortMenuButton
            label={t('library.sortBy')}
            value={sortField}
            onChange={(value) => setSortField(value as SortField)}
            options={sortFields(t).map((sortOption) => ({
              id: sortOption.id,
              label: t('library.sortByField', {
                field: sortOption.label.toLowerCase(),
              }),
            }))}
          />
          <Tooltip content={sortLabel} side="top">
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              aria-label={t('library.sortOrder', { order: sortLabel })}
              onClick={() => setSortDescending((current) => !current)}
            >
              {sortDescending ? (
                <ArrowDownWideNarrowIcon size={15} aria-hidden />
              ) : (
                <ArrowUpNarrowWideIcon size={15} aria-hidden />
              )}
            </Button>
          </Tooltip>
          <TrackViewPicker
            options={trackViewOptions({ allowList: true })}
            value={view}
            onChange={setView}
          />
        </div>
        <span className="text-foreground-secondary text-xs">
          {t('library.pinnedCount', { count: pinnedCount })}
        </span>
      </div>
      {filtersOpen && (
        <div className="border-border mb-4 flex flex-wrap items-end gap-3 border-b pb-4">
          <Select
            label={t('library.source')}
            value={embedFilter}
            onValueChange={(value) => setEmbedFilter(value as EmbedFilter)}
            options={embedFilters(t).map((filterOption) => {
              const sourceKey =
                filterOption.id === 'NATIVE'
                  ? 'native'
                  : filterOption.id === 'ALL'
                    ? null
                    : filterOption.id;
              return {
                id: filterOption.id,
                label:
                  sourceKey == null
                    ? filterOption.label
                    : withCount(
                        filterOption.label,
                        facetCount('source', sourceKey),
                      ),
              };
            })}
            className="min-w-40"
          />
          <Select
            label={t('library.genreFilter')}
            value={genreFilter || 'ALL'}
            onValueChange={(value) =>
              setGenreFilter(value === 'ALL' ? '' : value)
            }
            options={[
              { id: 'ALL', label: t('library.allGenres') },
              ...facets.genre.map((facet) => ({
                id: facet.value,
                label: t('library.facetOption', {
                  value: facet.value,
                  count: facet.count,
                }),
              })),
            ]}
            className="min-w-40"
          />
          <Select
            label={t('library.tagFilter')}
            value="ALL"
            onValueChange={(value) => {
              if (value !== 'ALL') {
                addTagFilter(value);
              }
            }}
            options={[
              {
                id: 'ALL',
                label:
                  tagFilters.length > 0
                    ? t('library.addTagFilter')
                    : t('library.allTags'),
              },
              ...facets.tag
                .filter((facet) => !tagFilters.includes(facet.value))
                .map((facet) => ({
                  id: facet.value,
                  label: t('library.facetOption', {
                    value: facet.value,
                    count: facet.count,
                  }),
                })),
            ]}
            className="min-w-40"
          />
          <Select
            label={t('library.yearFilter')}
            value={yearFilter || 'ALL'}
            onValueChange={(value) =>
              setUploadedYearFilter(value === 'ALL' ? '' : value)
            }
            options={[
              { id: 'ALL', label: t('library.allYears') },
              ...facets.uploadedYear.map((facet) => ({
                id: facet.value,
                label: t('library.facetOption', {
                  value: facet.value,
                  count: facet.count,
                }),
              })),
            ]}
            className="min-w-36"
          />
          <Select
            label={t('library.statusFilter')}
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            options={[
              { id: 'ALL', label: leaveAll },
              {
                id: 'READY',
                label: withCount(
                  t('library.statusReady'),
                  facetCount('status', 'READY'),
                ),
              },
              {
                id: 'PROCESSING',
                label: withCount(
                  t('library.statusProcessing'),
                  facetCount('status', 'PROCESSING'),
                ),
              },
              {
                id: 'PENDING',
                label: withCount(
                  t('library.statusPending'),
                  facetCount('status', 'PENDING'),
                ),
              },
              {
                id: 'ERROR',
                label: withCount(
                  t('library.statusError'),
                  facetCount('status', 'ERROR'),
                ),
              },
            ]}
            className="min-w-36"
          />
          <Select
            label={t('library.visibilityFilter')}
            value={visibilityFilter}
            onValueChange={(value) =>
              setVisibilityFilter(value as VisibilityFilter)
            }
            options={[
              { id: 'ALL', label: leaveAll },
              { id: 'public', label: t('library.soundsBulkPublic') },
              { id: 'private', label: t('library.soundsBulkPrivate') },
            ]}
            className="min-w-36"
          />
          <Select
            label={t('library.pinnedFilter')}
            value={pinnedFilter}
            onValueChange={(value) => setPinnedFilter(value as PinnedFilter)}
            options={[
              { id: 'ALL', label: leaveAll },
              { id: 'pinned', label: t('library.pinnedOnly') },
              { id: 'unpinned', label: t('library.unpinnedOnly') },
            ]}
            className="min-w-36"
          />
          <Select
            label={t('library.fallbackFilter')}
            value={fallbackFilter}
            onValueChange={(value) =>
              setFallbackFilter(value as FallbackFilter)
            }
            options={[
              { id: 'ALL', label: leaveAll },
              { id: 'fallback', label: t('library.fallbackOnly') },
              { id: 'not-fallback', label: t('library.notFallbackOnly') },
            ]}
            className="min-w-40"
          />
          <Input
            type="number"
            inputMode="numeric"
            min={40}
            max={300}
            label={t('library.bpmMin')}
            value={bpmMin}
            onChange={(event) => setBpmMin(event.target.value)}
            className="min-w-24"
          />
          <Input
            type="number"
            inputMode="numeric"
            min={40}
            max={300}
            label={t('library.bpmMax')}
            value={bpmMax}
            onChange={(event) => setBpmMax(event.target.value)}
            className="min-w-24"
          />
          {facets.musicalKey.length > 0 ? (
            <Select
              label={t('library.keyFilter')}
              value={keyFilter || 'ALL'}
              onValueChange={(value) =>
                setKeyFilter(value === 'ALL' ? '' : value)
              }
              options={[
                { id: 'ALL', label: leaveAll },
                ...facets.musicalKey.map((facet) => ({
                  id: facet.value,
                  label: t('library.facetOption', {
                    value: facet.value,
                    count: facet.count,
                  }),
                })),
              ]}
              className="min-w-28"
            />
          ) : (
            <Input
              type="text"
              label={t('library.keyFilter')}
              value={keyFilter}
              onChange={(event) => setKeyFilter(event.target.value)}
              placeholder={t('library.keyFilterPlaceholder')}
              className="min-w-28"
            />
          )}
          <Input
            type="date"
            label={t('library.uploadedFrom')}
            value={uploadedFrom}
            onChange={(event) => {
              setUploadedFrom(event.target.value);
              clearYearLabel();
            }}
            className="min-w-36"
          />
          <Input
            type="date"
            label={t('library.uploadedTo')}
            value={uploadedTo}
            onChange={(event) => {
              setUploadedTo(event.target.value);
              clearYearLabel();
            }}
            className="min-w-36"
          />
        </div>
      )}
    </>
  );
}
