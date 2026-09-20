import { FC, ReactNode } from 'react';

import { Track } from '@tahti-player/model';

export type TrackTableLabels = {
  headers: {
    artist: string;
    title: string;
    album: string;
    duration: string;
    /** Optional -- older label sets that predate the release-date column
     * still type-check; the column falls back to a default when absent. */
    releaseDate?: string;
  };
  favorite: string;
  unfavorite: string;
  play: string;
  pause: string;
  playAll: string;
  addAllToQueue: string;
  addToQueue: string;
  inQueue: string;
  trackOptions: string;
  remove: string;
  filterPlaceholder: string;
  /** Bulk-selection toolbar strings -- optional, only rendered when
   * `features.selectable` is on. Fall back to sensible English defaults
   * so existing label sets that predate bulk selection still type-check. */
  clearSelection?: string;
  removeSelected?: string;
  addSelectedToQueue?: string;
};

export type TrackTableClasses = {
  root?: string;
};

export type TrackTableActions<T extends Track = Track> = {
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onPlayNow?: (track: T) => void;
  onOpenDetails?: (track: T) => void;
  onPlayNext?: (track: T) => void;
  onAddToQueue?: (track: T) => void;
  onToggleFavorite?: (track: T) => void;
  onRemove?: (track: T, index: number) => void;
  onPlayAll?: () => void;
  onAddAllToQueue?: () => void;
  /** Opens an edit affordance for a track the caller has already decided
   * is editable -- paired with meta.canEditTrack, which gates whether
   * the icon renders at all per-row. */
  onEdit?: (track: T) => void;
  /** Opens a track's full detail page -- paired with meta.canOpenDetail,
   * which gates whether the icon renders at all per-row (e.g. hidden for
   * tracks with no detail page to open, such as embed-only sources). */
  onOpenDetail?: (track: T) => void;
  /** Bulk actions over the current checkbox selection -- paired with
   * `features.selectable`. The selection-toolbar button for each only
   * renders when the matching callback is provided, same convention as
   * onEdit/onOpenDetail being absent hiding their icons. Selection state
   * itself lives inside TrackTable (like sorting/filtering), not here. */
  onRemoveSelected?: (ids: string[]) => void;
  onAddSelectedToQueue?: (ids: string[]) => void;
};

export type ContextMenuWrapperProps<T extends Track = Track> = {
  track: T;
  children: ReactNode;
};

export type TrackTableProps<T extends Track = Track> = {
  tracks: T[];
  getItemId?: (track: T, index: number) => string;
  customColumns?: unknown[];
  features?: {
    header?: boolean;
    filterable?: boolean;
    sortable?: boolean;
    selectable?: boolean;
    reorderable?: boolean;
    favorites?: boolean;
    playAll?: boolean;
    addAllToQueue?: boolean;
    contextMenu?: boolean;
  };
  display?: {
    displayDeleteButton?: boolean;
    displayPosition?: boolean;
    displayThumbnail?: boolean;
    displayFavorite?: boolean;
    displayArtist?: boolean;
    displayAlbum?: boolean;
    displayDuration?: boolean;
    displayReleaseDate?: boolean;
    displayQueueControls?: boolean;
  };
  actions: TrackTableActions<T>;
  meta?: {
    isTrackFavorite?: (track: T) => boolean;
    isCurrentTrack?: (track: T) => boolean;
    isTrackPlaying?: (track: T) => boolean;
    isTrackQueued?: (track: T) => boolean;
    /** Per-row gate for actions.onEdit's icon -- absent/false hides it,
     * same as onToggleFavorite/onAddToQueue being absent hides theirs. */
    canEditTrack?: (track: T) => boolean;
    /** Per-row gate for actions.onOpenDetail's icon -- same convention as
     * canEditTrack. */
    canOpenDetail?: (track: T) => boolean;
    ContextMenuWrapper?: FC<ContextMenuWrapperProps<T>>;
  };
  rowHeight?: number;
  overscan?: number;
  classes?: TrackTableClasses;
  labels: TrackTableLabels;
  'aria-label'?: string;
};
