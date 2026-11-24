import { Track } from '@tahti-player/model';

import { cn } from '../../../utils';
import { TrackTableProps } from '../types';

/** Columns folded away in a narrow table (phones, side panels). The artist
 * then shows under the title instead, see TitleCell. */
const COLLAPSIBLE_COLUMN_IDS = new Set(['artist', 'album']);

/** Folded away a step earlier: in a table only a little wider than a phone
 * their headers ("Duration", "Released") no longer fit. */
const SECONDARY_COLUMN_IDS = new Set(['duration', 'releaseDate']);

/** The table is `table-fixed`, so columns without a width split the row
 * evenly; these keep short values narrow and leave the rest to the title. */
const COLUMN_WIDTH_CLASS: Record<string, string> = {
  artist: 'w-1/4',
  album: 'w-1/5',
  duration: 'w-20 tabular-nums',
  releaseDate: 'w-28',
};

export const collapsibleColumnClass = (columnId: string) =>
  cn(
    COLUMN_WIDTH_CLASS[columnId],
    COLLAPSIBLE_COLUMN_IDS.has(columnId) && '@max-md:hidden',
    SECONDARY_COLUMN_IDS.has(columnId) && '@max-xl:hidden',
  );

export const narrowOnlyClass = '@md:hidden';

export const narrowHiddenClass = '@max-md:hidden';

const ACTIONS_WIDTH = ['w-10', 'w-10', 'w-20', 'w-28', 'w-28'];

const NARROW_ACTIONS_WIDTH = [
  '@max-md:w-10',
  '@max-md:w-10',
  '@max-md:w-20',
  '@max-md:w-28',
  '@max-md:w-28',
];

export const getActionsColumn = <T extends Track>({
  tracks,
  displayQueueControls,
  actions,
  meta,
}: {
  tracks: T[];
  displayQueueControls?: boolean;
  actions?: TrackTableProps<T>['actions'];
  meta?: TrackTableProps<T>['meta'];
}) => {
  const canEdit =
    Boolean(actions?.onEdit) &&
    (!meta?.canEditTrack || tracks.some(meta.canEditTrack));
  const canOpen =
    Boolean(actions?.onOpenDetail) &&
    (!meta?.canOpenDetail || tracks.some(meta.canOpenDetail));
  const hasQueueButton = Boolean(displayQueueControls && actions?.onAddToQueue);
  const hasContextMenu = Boolean(meta?.ContextMenuWrapper);
  const always = [hasQueueButton, canEdit, hasContextMenu].filter(
    Boolean,
  ).length;
  const wide = Math.min(always + (canOpen ? 1 : 0), 4);
  const narrow = Math.min(
    always -
      (hasQueueButton && hasContextMenu ? 1 : 0) +
      (canOpen && !actions?.onOpenDetails ? 1 : 0),
    4,
  );
  return {
    show: Boolean(displayQueueControls) && wide > 0,
    className: cn(
      ACTIONS_WIDTH[wide],
      narrow !== wide && NARROW_ACTIONS_WIDTH[narrow],
    ),
  };
};
