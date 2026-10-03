import { CellContext } from '@tanstack/react-table';
import { ReactNode } from 'react';

import { Track } from '@tahti-player/model';

import { cn } from '../../../utils';
import { useTrackTableContext } from '../TrackTableContext';
import { narrowOnlyClass } from '../utils/columns';

type TitleCellMeta = {
  isCurrentTrack?: (track: Track) => boolean;
  getTrackAnnotation?: (track: Track) => ReactNode;
};

export const TitleCell = <T extends Track>({
  getValue,
  row,
  table,
}: CellContext<T, string | number | undefined>) => {
  const meta = table.options.meta as TitleCellMeta | undefined;
  const { actions } = useTrackTableContext<T>();
  const track = row.original;
  const isCurrent = meta?.isCurrentTrack?.(track) ?? false;
  const annotation = meta?.getTrackAnnotation?.(track);

  return (
    <td className="truncate px-2">
      <button
        className={cn(
          'block w-full min-w-0 cursor-pointer truncate text-left hover:underline',
          isCurrent && 'text-primary font-semibold',
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (actions.onOpenDetails) {
            actions.onOpenDetails(track);
          } else {
            actions.onPlayNow?.(track);
          }
        }}
      >
        {getValue()}
      </button>
      <div
        className={cn(
          'text-foreground-secondary truncate text-xs',
          narrowOnlyClass,
        )}
      >
        {track.artists[0]?.name}
      </div>
      {annotation ? (
        <div
          className="text-foreground-secondary truncate text-xs"
          data-testid="track-annotation"
        >
          {annotation}
        </div>
      ) : null}
    </td>
  );
};
