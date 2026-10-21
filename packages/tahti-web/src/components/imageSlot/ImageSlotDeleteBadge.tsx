import { XIcon } from 'lucide-react';

import { Button } from '@tahti-player/ui';

import { cn } from '../../lib/cn';

type Props = {
  label: string;
  onClick: () => void;
  className?: string;
};

/** Corner "X" shown on hover/focus over a set image slot. Stops the click
 * from bubbling to the slot's own onClick (which opens the preview). */
export function ImageSlotDeleteBadge({ label, onClick, className }: Props) {
  return (
    <Button
      variant="plain"
      size="flexible"
      type="button"
      aria-label={`Remove ${label.toLowerCase()}`}
      title={`Remove ${label.toLowerCase()}`}
      className={cn(
        'bg-background/90 text-foreground border-border hover:bg-accent-red absolute top-1 right-1 z-10 flex size-6 items-center justify-center rounded-full border whitespace-normal opacity-0 shadow-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-white active:scale-100',
        className,
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <XIcon size={14} aria-hidden />
    </Button>
  );
}
