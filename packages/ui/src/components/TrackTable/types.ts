import { FC, ReactNode } from 'react';

import { Track } from '@nuclearplayer/model';

export type TrackTableLabels = {
  headers: {
    artist: string;
    title: string;
    album: string;
    duration: string;
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
    ContextMenuWrapper?: FC<ContextMenuWrapperProps<T>>;
  };
  rowHeight?: number;
  overscan?: number;
  classes?: TrackTableClasses;
  labels: TrackTableLabels;
  'aria-label'?: string;
};
