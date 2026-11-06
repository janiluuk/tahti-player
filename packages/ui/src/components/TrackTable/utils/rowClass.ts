import { cn } from '../../../utils';

/** Stripes, divider and the current-row marker shared by every track list
 * row: `TrackTable` rows and `CardsRow` list rows look the same. */
export function trackRowClass(index: number, isCurrent: boolean): string {
  return cn(
    'border-border border-b-(length:--border-width)',
    index % 2 === 0 ? 'bg-background-secondary' : 'bg-background',
    isCurrent && 'border-l-primary bg-primary/10 border-l-2',
  );
}

/** Matches `DEFAULT_ROW_HEIGHT`; a literal so Tailwind sees the class. */
export const trackRowMinHeightClass = 'min-h-[52px]';
