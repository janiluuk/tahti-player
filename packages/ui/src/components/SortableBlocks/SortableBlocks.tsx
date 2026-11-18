import { GripVerticalIcon, XIcon } from 'lucide-react';
import {
  FC,
  ReactNode,
  useEffect,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type Ref,
} from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';

export type SortableBlock = {
  id: string;
  label: string;
  content: ReactNode;
};

export type SortableBlocksProps = {
  blocks: SortableBlock[];
  reordering: boolean;
  onReorder: (ids: string[]) => void;
  moveLabel?: (label: string) => string;
  /** Shown on each block only while reordering. */
  onRemove?: (id: string) => void;
  removeLabel?: (label: string) => string;
  className?: string;
};

/** What the drag layer adds to a block once dnd-kit has loaded. */
export type BlockFrameSortable = {
  setNodeRef: Ref<HTMLDivElement>;
  setActivatorNodeRef: Ref<HTMLButtonElement>;
  style: CSSProperties | undefined;
  isDragging: boolean;
  handleProps: HTMLAttributes<HTMLButtonElement>;
};

export type BlockFrameProps = {
  block: SortableBlock;
  reordering: boolean;
  moveLabel: (label: string) => string;
  onRemove?: (id: string) => void;
  removeLabel: (label: string) => string;
  sortable?: BlockFrameSortable;
};

export const BlockFrame: FC<BlockFrameProps> = ({
  block,
  reordering,
  moveLabel,
  onRemove,
  removeLabel,
  sortable,
}) => (
  <div
    ref={sortable?.setNodeRef}
    data-sortable-block={block.id}
    style={reordering ? sortable?.style : undefined}
    className={cn(
      'relative flex min-w-0 flex-col',
      reordering &&
        'border-border bg-background gap-2 rounded-xl border border-dashed p-2',
      sortable?.isDragging && 'z-10 opacity-70 shadow-lg',
    )}
  >
    {reordering ? (
      <div className="text-foreground-secondary flex items-center gap-2 text-xs font-bold tracking-wide uppercase">
        <Button
          ref={sortable?.setActivatorNodeRef}
          type="button"
          size="icon-sm"
          variant="text"
          className="cursor-grab touch-none active:cursor-grabbing"
          aria-label={moveLabel(block.label)}
          {...sortable?.handleProps}
        >
          <GripVerticalIcon size={16} aria-hidden />
        </Button>
        <span className="truncate">{block.label}</span>
        {onRemove ? (
          <Button
            type="button"
            size="icon-sm"
            variant="text"
            className="ml-auto"
            aria-label={removeLabel(block.label)}
            onClick={() => onRemove(block.id)}
          >
            <XIcon size={16} aria-hidden />
          </Button>
        ) : null}
      </div>
    ) : null}
    {block.content}
  </div>
);

type BlocksDndModule = typeof import('./sortableBlocksDnd');

let loadedDnd: BlocksDndModule | null = null;

/** dnd-kit loads in its own chunk the first time a stack starts
 * reordering, so pages that only show blocks keep it out of the shell. */
function useBlocksDnd(wanted: boolean): BlocksDndModule | null {
  const [module, setModule] = useState<BlocksDndModule | null>(loadedDnd);
  useEffect(() => {
    if (!wanted || module) {
      return;
    }
    let cancelled = false;
    void import('./sortableBlocksDnd').then((next) => {
      loadedDnd = next;
      if (!cancelled) {
        setModule(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [wanted, module]);
  return module;
}

/** A vertical stack of page blocks. With `reordering` on, each block gets a
 * dashed frame and a drag handle (pointer or keyboard: Space, arrows,
 * Space); off, the blocks render as a plain stack. The drag layer joins the
 * tree the first time reordering turns on (block content mounts again
 * once, then); after that, toggling never remounts a block's content. */
export const SortableBlocks: FC<SortableBlocksProps> = (props) => {
  const {
    blocks,
    reordering,
    moveLabel = (label) => `Move ${label}`,
    onRemove,
    removeLabel = (label) => `Remove ${label}`,
    className,
  } = props;
  const [hasReordered, setHasReordered] = useState(reordering);
  if (reordering && !hasReordered) {
    setHasReordered(true);
  }
  const dnd = useBlocksDnd(hasReordered);

  if (dnd && hasReordered) {
    return <dnd.SortableBlocksDnd {...props} />;
  }
  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      data-reordering={reordering ? '' : undefined}
    >
      {blocks.map((block) => (
        <BlockFrame
          key={block.id}
          block={block}
          reordering={reordering}
          moveLabel={moveLabel}
          onRemove={onRemove}
          removeLabel={removeLabel}
        />
      ))}
    </div>
  );
};
