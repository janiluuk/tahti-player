import {
  ArrowDownWideNarrowIcon,
  ArrowUpNarrowWideIcon,
  ChevronDownIcon,
  FilterIcon,
  SearchIcon,
} from 'lucide-react';

import { Button, Input, Select, Tooltip } from '@tahti-player/ui';

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
  } = state;
  const storedView = useTrackListViewStore((store) => store.view);
  const setView = useTrackListViewStore((store) => store.setView);
  const view =
    storedView === null || storedView === 'grid' ? 'comfortable' : storedView;
  const sortLabel = sortDescending ? 'Descending' : 'Ascending';

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          enterKeyHint="search"
          type="search"
          aria-label="Search sounds"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search…"
          className="max-w-md flex-1"
          startAddon={
            <SearchIcon size={14} aria-hidden className="opacity-70" />
          }
        />
        <Select
          aria-label="Type"
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
          content={filtersOpen ? 'Collapse filters' : 'Expand filters'}
          side="top"
        >
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            aria-expanded={filtersOpen}
            aria-label={filtersOpen ? 'Collapse filters' : 'Expand filters'}
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
        <Select
          aria-label="Sort by"
          value={sortField}
          onValueChange={(value) => setSortField(value as SortField)}
          options={SORT_FIELDS.map((sortOption) => ({
            id: sortOption.id,
            label: `By ${sortOption.label.toLowerCase()}`,
          }))}
          className="min-w-40"
        />
        <Tooltip content={sortLabel} side="top">
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            aria-label={`Sort order: ${sortLabel}`}
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
        <span className="text-foreground-secondary text-xs">
          Pinned {pinnedCount}
        </span>
      </div>
      {filtersOpen && (
        <div className="border-border mb-4 flex flex-wrap items-end gap-3 border-b pb-4">
          <Select
            label="Source"
            value={embedFilter}
            onValueChange={(value) => setEmbedFilter(value as EmbedFilter)}
            options={EMBED_FILTERS.map((filterOption) => ({
              id: filterOption.id,
              label: filterOption.label,
            }))}
            className="min-w-40"
          />
          <Input
            type="date"
            label="Uploaded from"
            value={uploadedFrom}
            onChange={(event) => setUploadedFrom(event.target.value)}
            className="min-w-36"
          />
          <Input
            type="date"
            label="Uploaded to"
            value={uploadedTo}
            onChange={(event) => setUploadedTo(event.target.value)}
            className="min-w-36"
          />
        </div>
      )}
    </>
  );
}
