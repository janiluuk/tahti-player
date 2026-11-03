import {
  FilterChips,
  Input,
  Select,
  Textarea,
  type SelectOption,
} from '@tahti-player/ui';

import type { CollectionTrackSortMode } from '../../../api/studio-types';
import { StudioPanel } from '../../../components/StudioPanel';
import { COLLECTION_STYLES } from '../../../content/collectionStyles';
import type { CollectionEditState } from './useCollectionEditState';

const TRACK_ORDER_OPTIONS: SelectOption[] = [
  { id: 'MANUAL', label: 'Manual (tracklist order)' },
  { id: 'TIME', label: 'Oldest first' },
  { id: 'NAME', label: 'Title (A-Z)' },
];

export function DetailsPanel({ state }: { state: CollectionEditState }) {
  const {
    name,
    setName,
    releaseDate,
    setReleaseDate,
    genres,
    setGenres,
    trackSortMode,
    setTrackSortMode,
    style,
    setStyle,
    description,
    setDescription,
    visibility,
    setVisibility,
  } = state;

  return (
    <StudioPanel title="Details">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Release date"
          type="date"
          value={releaseDate}
          onChange={(event) => setReleaseDate(event.target.value)}
        />
        <Input
          label="Genres"
          value={genres}
          placeholder="Electronic, Ambient"
          onChange={(event) => setGenres(event.target.value)}
        />
        <div className="flex flex-col gap-1 text-sm">
          <span
            className="text-foreground-secondary text-xs uppercase"
            aria-hidden
          >
            Style
          </span>
          <FilterChips
            aria-label="Style"
            items={COLLECTION_STYLES}
            selected={style}
            onChange={setStyle}
          />
        </div>
        <Select
          label="Track order"
          description="How tracks are ordered on the public page."
          value={trackSortMode}
          onValueChange={(value) =>
            setTrackSortMode(value as CollectionTrackSortMode)
          }
          options={TRACK_ORDER_OPTIONS}
        />
        <Textarea
          label="Description"
          fieldClassName="sm:col-span-2"
          tone="secondary"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <section className="border-border bg-background-secondary/30 flex flex-col gap-3 rounded-lg border p-3 sm:col-span-2">
          <Select
            label="Visibility"
            description="Choose who can find this collection."
            value={visibility}
            onValueChange={(value) => setVisibility(value as typeof visibility)}
            options={[
              { id: 'PUBLIC', label: 'Public' },
              { id: 'UNLISTED', label: 'Unlisted — direct link only' },
              { id: 'PRIVATE', label: 'Private — only you' },
            ]}
          />
        </section>
      </div>
    </StudioPanel>
  );
}
