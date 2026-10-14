import { CellContext } from '@tanstack/react-table';
import {
  ArrowUpRight,
  Check,
  EllipsisVertical,
  ListPlus,
  Pencil,
} from 'lucide-react';
import { FC, forwardRef, useEffect, useState } from 'react';

import { Track } from '@tahti-player/model';

import { cn } from '../../../utils';
import { Button } from '../../Button';
import { Tooltip } from '../../Tooltip';
import { useTrackTableContext } from '../TrackTableContext';
import { ContextMenuWrapperProps } from '../types';
import { narrowHiddenClass } from '../utils/columns';

type ActionsCellMeta = {
  displayQueueControls?: boolean;
  onAddToQueue?: (track: Track) => void;
  onEdit?: (track: Track) => void;
  onOpenDetail?: (track: Track) => void;
  isTrackQueued?: (track: Track) => boolean;
  canEditTrack?: (track: Track) => boolean;
  canOpenDetail?: (track: Track) => boolean;
  ContextMenuWrapper?: FC<ContextMenuWrapperProps>;
};

type IconButtonProps = {
  label: string;
  onClick: () => void;
};

const EditButton: FC<IconButtonProps> = ({ label, onClick }) => (
  <Tooltip content={label} side="top">
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
    >
      <Pencil size={14} />
    </Button>
  </Tooltip>
);

const OpenDetailButton: FC<IconButtonProps & { className?: string }> = ({
  label,
  onClick,
  className,
}) => (
  <Tooltip content={label} side="top" wrapperClassName={className}>
    <Button
      data-testid="open-track-detail-button"
      size="icon-sm"
      variant="text"
      className="opacity-100 transition-none [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
    >
      <ArrowUpRight size={14} />
    </Button>
  </Tooltip>
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
    <Tooltip content={label} side="top">
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
      >
        {queued ? <Check size={14} /> : <ListPlus size={14} />}
      </Button>
    </Tooltip>
  );
};

type ContextMenuButtonProps = {
  label: string;
};

const ContextMenuButton = forwardRef<HTMLElement, ContextMenuButtonProps>(
  function ContextMenuButton({ label, ...props }, ref) {
    return (
      <Tooltip content={label} side="top">
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
      </Tooltip>
    );
  },
);

/** Trailing, right-aligned cluster of per-row icon actions (queue, edit,
 * context menu, open detail) -- kept in one column, right next to the
 * favorite column, so every row's interactive controls line up at the
 * row's right edge instead of being split between a thumbnail overlay,
 * the leading favorite column, and a mid-row title cell. */
export const ActionsCell = <T extends Track>({
  row,
  table,
}: CellContext<T, unknown>) => {
  const meta = table.options.meta as ActionsCellMeta | undefined;
  const { labels, actions } = useTrackTableContext<T>();
  const track = row.original;
  const showControls = meta?.displayQueueControls;
  const ContextMenuWrapper = meta?.ContextMenuWrapper;
  const hasAddToQueue = Boolean(meta?.onAddToQueue);
  const hasContextMenu = Boolean(ContextMenuWrapper);
  const canEdit = Boolean(meta?.onEdit && meta.canEditTrack?.(track));
  const canOpenDetail = Boolean(
    meta?.onOpenDetail && meta.canOpenDetail?.(track),
  );
  const hasActions =
    hasAddToQueue || hasContextMenu || canEdit || canOpenDetail;
  const isQueued = meta?.isTrackQueued?.(track) ?? false;

  if (!hasActions) {
    return <td className="w-28" />;
  }

  return (
    <td className="w-28 px-1">
      <div className="flex items-center justify-end gap-1">
        {showControls && hasAddToQueue && (
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
        {canOpenDetail && (
          <OpenDetailButton
            label="Open track"
            onClick={() => meta?.onOpenDetail?.(track)}
            className={actions.onOpenDetails ? narrowHiddenClass : undefined}
          />
        )}
      </div>
    </td>
  );
};
