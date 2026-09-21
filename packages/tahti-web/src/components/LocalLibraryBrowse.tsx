import { ListPlusIcon } from 'lucide-react';

import { Button, TabLabel, Tabs, Tooltip } from '@tahti-player/ui';

import {
  formatLibrarySize,
  formatTotalDuration,
  pluralTracks,
} from '../lib/libraryFormat';
import type {
  NativeFacetGroup,
  NativeFacetKind,
  NativeLibraryTotals,
} from '../lib/nativeLibrary';

export type BrowseKind = 'tracks' | 'playlists' | NativeFacetKind;

const BROWSE_TABS: Array<{ id: BrowseKind; label: string }> = [
  { id: 'tracks', label: 'Tracks' },
  { id: 'artists', label: 'Artists' },
  { id: 'albums', label: 'Albums' },
  { id: 'genres', label: 'Genres' },
  { id: 'folders', label: 'Folders' },
  { id: 'playlists', label: 'Playlists' },
];

export const FACET_KIND_LABEL: Record<NativeFacetKind, string> = {
  artists: 'Artist',
  albums: 'Album',
  genres: 'Genre',
  folders: 'Folder',
};

const UNKNOWN_LABEL: Record<NativeFacetKind, string> = {
  artists: 'Unknown artist',
  albums: 'Unknown album',
  genres: 'No genre',
  folders: 'Loose files',
};

export function BrowseTabs({
  value,
  onChange,
}: {
  value: BrowseKind;
  onChange: (kind: BrowseKind) => void;
}) {
  return (
    <Tabs.Root
      selectedIndex={Math.max(
        0,
        BROWSE_TABS.findIndex((item) => item.id === value),
      )}
      onChange={(index) => {
        const next = BROWSE_TABS[index];
        if (next) {
          onChange(next.id);
        }
      }}
    >
      <Tabs.List aria-label="Browse local library" className="overflow-x-auto">
        {BROWSE_TABS.map((item) => (
          <Tabs.Tab key={item.id}>
            <TabLabel>{item.label}</TabLabel>
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

export function LibraryTotalsLine({
  totals,
}: {
  totals: NativeLibraryTotals | null;
}) {
  if (!totals || totals.trackCount === 0) {
    return null;
  }
  return (
    <p
      className="text-foreground-secondary text-xs"
      data-testid="library-totals"
    >
      {pluralTracks(totals.trackCount)} ·{' '}
      {formatTotalDuration(totals.durationSec)} ·{' '}
      {formatLibrarySize(totals.sizeBytes)} on this device
    </p>
  );
}

export function facetTitle(kind: NativeFacetKind, group: NativeFacetGroup) {
  if (!group.name) {
    return UNKNOWN_LABEL[kind];
  }
  if (kind === 'folders') {
    const trimmed = group.name.replace(/[\\/]+$/, '');
    return trimmed.split(/[\\/]/).pop() || group.name;
  }
  return group.name;
}

function facetSubtitle(kind: NativeFacetKind, group: NativeFacetGroup) {
  const parts: string[] = [];
  if (kind === 'albums') {
    parts.push(group.secondary || 'Unknown artist');
    if (group.year) {
      parts.push(String(group.year));
    }
  }
  parts.push(
    pluralTracks(group.trackCount),
    formatTotalDuration(group.durationSec),
    formatLibrarySize(group.sizeBytes),
  );
  return parts.join(' · ');
}

export function FacetGroupList({
  kind,
  groups,
  onSelect,
  onAddToPlaylist,
}: {
  kind: NativeFacetKind;
  groups: NativeFacetGroup[];
  onSelect: (group: NativeFacetGroup) => void;
  /** Adds every track in the group to a local playlist. */
  onAddToPlaylist?: (group: NativeFacetGroup) => void;
}) {
  return (
    <ul
      className="tahti-hide-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
      aria-label={`${FACET_KIND_LABEL[kind]} groups`}
    >
      {groups.map((group) => (
        <li
          key={`${group.name}\u0000${group.secondary}`}
          className="flex items-center gap-1"
        >
          <Button
            variant="text"
            className="border-border h-auto min-w-0 flex-1 justify-start rounded-md border px-2 py-1.5 text-left"
            title={kind === 'folders' ? group.name : undefined}
            onClick={() => onSelect(group)}
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">
                {facetTitle(kind, group)}
              </span>
              <span className="text-foreground-secondary truncate text-xs font-normal">
                {facetSubtitle(kind, group)}
              </span>
            </span>
          </Button>
          {onAddToPlaylist ? (
            <Tooltip content="Add to playlist" side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label={`Add ${facetTitle(kind, group)} to playlist`}
                onClick={() => onAddToPlaylist(group)}
              >
                <ListPlusIcon size={14} aria-hidden />
              </Button>
            </Tooltip>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
