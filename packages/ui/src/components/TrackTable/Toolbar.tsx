import {
  CheckIcon,
  FilterIcon,
  ListChecksIcon,
  PlayIcon,
  PlusIcon,
  Trash2,
  XIcon,
} from 'lucide-react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { Input } from '../Input';
import { Tooltip } from '../Tooltip';
import { useUiLabels } from '../UiLabels';
import { useTrackTableContext } from './TrackTableContext';

type ToolbarProps = {
  filterValue: string;
  onFilterChange: (value: string) => void;
  selectedIds: string[];
  onClearSelection: () => void;
  selection?: {
    onDemand: boolean;
    selecting: boolean;
    start: () => void;
    stop: () => void;
  };
  className?: string;
};

function SelectionToggle({
  selection,
}: {
  selection: NonNullable<ToolbarProps['selection']>;
}) {
  const uiLabels = useUiLabels();
  if (!selection.onDemand) {
    return null;
  }
  return selection.selecting ? (
    <Button
      variant="text"
      size="sm"
      onClick={selection.stop}
      data-testid="done-selecting-button"
    >
      <CheckIcon size={14} className="mr-1" aria-hidden />
      {uiLabels.doneSelecting}
    </Button>
  ) : (
    <Button
      variant="text"
      size="sm"
      onClick={selection.start}
      data-testid="start-selecting-button"
    >
      <ListChecksIcon size={14} className="mr-1" aria-hidden />
      {uiLabels.startSelecting}
    </Button>
  );
}

export function Toolbar({
  filterValue,
  onFilterChange,
  selectedIds,
  onClearSelection,
  selection,
  className,
}: ToolbarProps) {
  const { features, actions, labels } = useTrackTableContext();

  if (features.selectable && selectedIds.length > 0) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-sm font-medium">
          {selectedIds.length} selected
        </span>
        <Button
          variant="text"
          size="sm"
          onClick={onClearSelection}
          data-testid="clear-selection-button"
        >
          <XIcon size={14} className="mr-1" aria-hidden />
          {labels.clearSelection ?? 'Clear selection'}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {actions.onAddSelectedToQueue && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                actions.onAddSelectedToQueue?.(selectedIds);
                onClearSelection();
              }}
              data-testid="add-selected-to-queue-button"
            >
              <PlusIcon size={14} className="mr-1" aria-hidden />
              {labels.addSelectedToQueue ?? 'Add to queue'}
            </Button>
          )}
          {actions.onRemoveSelected && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                actions.onRemoveSelected?.(selectedIds);
                onClearSelection();
              }}
              data-testid="remove-selected-button"
            >
              <Trash2 size={14} className="mr-1" aria-hidden />
              {labels.removeSelected ?? 'Remove'}
            </Button>
          )}
          {selection ? <SelectionToggle selection={selection} /> : null}
        </div>
      </div>
    );
  }

  const showToggle = Boolean(selection?.onDemand);
  if (
    !features.playAll &&
    !features.addAllToQueue &&
    !features.filterable &&
    !showToggle
  ) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {features.playAll && (
        <Tooltip content={labels.playAll} side="bottom">
          <Button
            size="icon"
            onClick={actions.onPlayAll}
            aria-label={labels.playAll}
            data-testid="play-all-button"
          >
            <PlayIcon size={16} strokeWidth={3} />
          </Button>
        </Tooltip>
      )}
      {features.addAllToQueue && (
        <Tooltip content={labels.addAllToQueue} side="bottom">
          <Button
            variant="secondary"
            size="icon"
            onClick={actions.onAddAllToQueue}
            aria-label={labels.addAllToQueue}
            data-testid="add-all-to-queue-button"
          >
            <PlusIcon size={16} strokeWidth={3} />
          </Button>
        </Tooltip>
      )}
      {features.filterable && (
        <div className="ml-auto inline-flex w-full max-w-sm items-stretch">
          <Input
            size="sm"
            value={filterValue}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder={labels.filterPlaceholder}
            aria-label={labels.filterPlaceholder.replace(/(…|\.{3})$/, '')}
            endAddon={
              <FilterIcon
                className="h-4 w-4"
                aria-hidden="true"
                strokeWidth={3}
              />
            }
          />
        </div>
      )}
      {selection && showToggle ? (
        <div className={cn(!features.filterable && 'ml-auto')}>
          <SelectionToggle selection={selection} />
        </div>
      ) : null}
    </div>
  );
}
