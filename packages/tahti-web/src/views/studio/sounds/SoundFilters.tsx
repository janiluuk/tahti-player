import {
  ArrowDownWideNarrowIcon,
  ArrowUpNarrowWideIcon,
  ChevronDownIcon,
  FilterIcon,
  SearchIcon,
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
  CONTENT_TYPE_FILTERS,
  EMBED_FILTERS,
  SORT_FIELDS,
  type ContentTypeFilter,
  type EmbedFilter,
  type SortField,
  type StudioSoundsState,
} from './useStudioSoundsState';

export function SoundFilters({ state }: { state: StudioSoundsState }) {
  const { t } = useTranslation('web');
  const {
    query,
    setQuery,
    filtersOpen,
    setFiltersOpen,
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
    tagFilter,
    setTagFilter,
    facets,
  } = state;
  const storedView = useTrackListViewStore((store) => store.view);
  const setView = useTrackListViewStore((store) => store.setView);
  const view =
    storedView === null || storedView === 'grid' ? 'comfortable' : storedView;
  const sortLabel = sortDescending
    ? t('library.sortDescending')
    : t('library.sortAscending');

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
        />
        <Select
          aria-label={t('library.typeFilter')}
          value={contentTypeFilter}
          onValueChange={(value) =>
            setContentTypeFilter(value as ContentTypeFilter)
          }
          options={CONTENT_TYPE_FILTERS.map((filterOption) => ({
            id: filterOption.id,
            label: filterOption.label,
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
            variant="secondary"
            aria-expanded={filtersOpen}
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
            options={SORT_FIELDS.map((sortOption) => ({
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
            options={EMBED_FILTERS.map((filterOption) => ({
              id: filterOption.id,
              label: filterOption.label,
            }))}
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
            value={tagFilter || 'ALL'}
            onValueChange={(value) =>
              setTagFilter(value === 'ALL' ? '' : value)
            }
            options={[
              { id: 'ALL', label: t('library.allTags') },
              ...facets.tag.map((facet) => ({
                id: facet.value,
                label: t('library.facetOption', {
                  value: facet.value,
                  count: facet.count,
                }),
              })),
            ]}
            className="min-w-40"
          />
          <Input
            type="date"
            label={t('library.uploadedFrom')}
            value={uploadedFrom}
            onChange={(event) => setUploadedFrom(event.target.value)}
            className="min-w-36"
          />
          <Input
            type="date"
            label={t('library.uploadedTo')}
            value={uploadedTo}
            onChange={(event) => setUploadedTo(event.target.value)}
            className="min-w-36"
          />
        </div>
      )}
    </>
  );
}
