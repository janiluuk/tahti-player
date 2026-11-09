import { ListPlusIcon } from 'lucide-react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
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

function browseTabs(
  t: TFunction<'web'>,
): Array<{ id: BrowseKind; label: string }> {
  return [
    { id: 'tracks', label: t('localLibraryBrowseMore.tracks') },
    { id: 'artists', label: t('localLibraryBrowseMore.artists') },
    { id: 'albums', label: t('localLibraryBrowseMore.albums') },
    { id: 'genres', label: t('localLibraryBrowseMore.genres') },
    { id: 'composers', label: t('localLibraryBrowseMore.composers') },
    { id: 'folders', label: t('localLibraryBrowseMore.folders') },
    { id: 'playlists', label: t('localLibraryBrowseMore.playlists') },
  ];
}

export const FACET_KIND_LABEL: Record<NativeFacetKind, string> = {
  artists: 'Artist',
  albums: 'Album',
  genres: 'Genre',
  composers: 'Composer',
  folders: 'Folder',
};

const UNKNOWN_LABEL: Record<NativeFacetKind, string> = {
  artists: 'Unknown artist',
  albums: 'Unknown album',
  genres: 'No genre',
  composers: 'No composer',
  folders: 'Loose files',
};

export function BrowseTabs({
  value,
  onChange,
}: {
  value: BrowseKind;
  onChange: (kind: BrowseKind) => void;
}) {
  const { t } = useTranslation('web');
  return (
    <Tabs.Root
      selectedIndex={Math.max(
        0,
        browseTabs(t).findIndex((item) => item.id === value),
      )}
      onChange={(index) => {
        const next = browseTabs(t)[index];
        if (next) {
          onChange(next.id);
        }
      }}
    >
      <Tabs.List
        aria-label={t('localLibraryBrowse.browseLocalLibrary')}
        className="overflow-x-auto"
      >
        {browseTabs(t).map((item) => (
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
  const { t } = useTranslation('web');
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
          <Tooltip
            content={group.name}
            side="top"
            disabled={kind !== 'folders'}
            wrapperClassName="flex min-w-0 flex-1"
          >
            <Button
              variant="text"
              className="border-border h-auto w-full min-w-0 justify-start rounded-md border px-2 py-1.5 text-left"
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
          </Tooltip>
          {onAddToPlaylist ? (
            <Tooltip content={t('localLibraryBrowse.addToPlaylist')} side="top">
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
