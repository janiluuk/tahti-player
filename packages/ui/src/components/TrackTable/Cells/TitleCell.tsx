import { CellContext } from '@tanstack/react-table';
import { Check, EllipsisVertical, ListPlus, Pencil } from 'lucide-react';
import { FC, forwardRef, useEffect, useState } from 'react';

import { Track } from '@nuclearplayer/model';

import { cn } from '../../../utils';
import { Button } from '../../Button';
import { useTrackTableContext } from '../TrackTableContext';
import { ContextMenuWrapperProps } from '../types';

type TitleCellMeta = {
  displayQueueControls?: boolean;
  displayThumbnail?: boolean;
  onAddToQueue?: (track: Track) => void;
  onEdit?: (track: Track) => void;
  isCurrentTrack?: (track: Track) => boolean;
  isTrackQueued?: (track: Track) => boolean;
  canEditTrack?: (track: Track) => boolean;
  ContextMenuWrapper?: FC<ContextMenuWrapperProps>;
};

type EditButtonProps = {
  label: string;
  onClick: () => void;
};

const EditButton: FC<EditButtonProps> = ({ label, onClick }) => (
  <Button
    data-testid="edit-track-button"
    size="icon-sm"
    variant="text"
    className="opacity-100 transition-none [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    aria-label={label}
    title={label}
  >
    <Pencil size={14} />
  </Button>
);

type AddToQueueButtonProps = {
  label: string;
  queued: boolean;
  onClick: () => void;
};

const QUEUE_FEEDBACK_MS = 700;

const AddToQueueButton: FC<AddToQueueButtonProps> = ({
  label,
  queued,
  onClick,
}) => {
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (!flashing) {
      return;
    }
    const timeout = window.setTimeout(
      () => setFlashing(false),
      QUEUE_FEEDBACK_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [flashing]);

  return (
    <Button
      data-testid="add-to-queue-button"
      size="icon-sm"
      variant="text"
      disabled={queued || flashing}
      className={cn(
        'size-7 opacity-100 transition-colors [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100',
        (queued || flashing) &&
          'bg-primary/20 text-primary opacity-100! motion-safe:animate-pulse',
      )}
      onClick={(event) => {
        event.stopPropagation();
        setFlashing(true);
        onClick();
      }}
      aria-label={label}
      aria-pressed={queued}
      title={label}
    >
      {queued ? <Check size={14} /> : <ListPlus size={14} />}
    </Button>
  );
};

type ContextMenuButtonProps = {
  label: string;
};

const ContextMenuButton = forwardRef<HTMLElement, ContextMenuButtonProps>(
  function ContextMenuButton({ label, ...props }, ref) {
    return (
      <Button
        {...props}
        ref={ref}
        data-testid="track-context-menu-button"
        size="icon-sm"
        variant="text"
        className="opacity-100 transition-none [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
        aria-label={label}
      >
        <EllipsisVertical size={16} />
      </Button>
    );
  },
);

export const TitleCell = <T extends Track>({
  getValue,
  row,
  table,
}: CellContext<T, string | number | undefined>) => {
  const meta = table.options.meta as TitleCellMeta | undefined;
  const { actions, labels } = useTrackTableContext<T>();
  const showControls = meta?.displayQueueControls;
  const ContextMenuWrapper = meta?.ContextMenuWrapper;
  const track = row.original;
  const hasAddToQueue = Boolean(meta?.onAddToQueue && !meta.displayThumbnail);
  const hasContextMenu = Boolean(ContextMenuWrapper);
  const canEdit = Boolean(meta?.onEdit && meta.canEditTrack?.(track));
  const hasActions = hasAddToQueue || hasContextMenu || canEdit;
  const isCurrent = meta?.isCurrentTrack?.(track) ?? false;
  const isQueued = meta?.isTrackQueued?.(track) ?? false;

  return (
    <td className="truncate px-2">
      <div className="flex items-center justify-between gap-2">
        <button
          className={cn(
            'min-w-0 flex-1 cursor-pointer truncate text-left hover:underline',
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
        {showControls && hasActions && (
          <div className="flex items-center gap-1">
            {hasAddToQueue && (
              <AddToQueueButton
                label={isQueued ? labels.inQueue : labels.addToQueue}
                queued={isQueued}
                onClick={() => meta?.onAddToQueue?.(track)}
              />
            )}
            {canEdit && (
              <EditButton
                label="Edit track"
                onClick={() => meta?.onEdit?.(track)}
              />
            )}
            {ContextMenuWrapper && (
              <ContextMenuWrapper track={track}>
                <ContextMenuButton label={labels.trackOptions} />
              </ContextMenuWrapper>
            )}
          </div>
        )}
      </div>
    </td>
  );
};
