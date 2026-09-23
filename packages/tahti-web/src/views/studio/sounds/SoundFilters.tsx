import { ChevronDownIcon, FilterIcon, SearchIcon } from 'lucide-react';

import { Button, Input, Select, Tooltip } from '@tahti-player/ui';

import {
  EMBED_FILTERS,
  SORT_FIELDS,
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
    sortField,
    setSortField,
    sortDescending,
    setSortDescending,
    uploadedFrom,
    setUploadedFrom,
    uploadedTo,
    setUploadedTo,
  } = state;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          type="search"
          aria-label="Search tracks"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search…"
          className="max-w-md flex-1"
          startAddon={
            <SearchIcon size={14} aria-hidden className="opacity-70" />
          }
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
          <Select
            label="Sort by"
            value={sortField}
            onValueChange={(value) => setSortField(value as SortField)}
            options={SORT_FIELDS.map((sortOption) => ({
              id: sortOption.id,
              label: sortOption.label,
            }))}
            className="min-w-40"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSortDescending((current) => !current)}
          >
            {sortDescending ? 'Descending' : 'Ascending'}
          </Button>
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
