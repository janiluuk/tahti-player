import { CassetteTape } from 'lucide-react';
import { FC, KeyboardEvent } from 'react';

import { cn } from '../../utils';
import type { TopListEntry } from './types';

type TopListRowProps = {
  entry: TopListEntry;
  rank: number;
  fillRatio: number;
  formatValue: (value: number) => string;
};

export const TopListRow: FC<TopListRowProps> = ({
  entry,
  rank,
  fillRatio,
  formatValue,
}) => {
  const interactive = Boolean(entry.onClick);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!entry.onClick) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      entry.onClick();
    }
  };

  return (
    <div
      data-testid="top-list-row"
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={entry.onClick}
      onKeyDown={interactive ? onKeyDown : undefined}
      className={cn(
        'border-border grid grid-cols-[auto_auto_1fr_1fr] items-center gap-3 border-b-(length:--border-width) py-1.5 last:border-b-0',
        interactive &&
          'hover:bg-background-secondary/60 focus-visible:ring-primary cursor-pointer rounded-sm focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <span className="text-foreground-secondary w-5 text-right text-sm tabular-nums">
        {rank}
      </span>
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden">
        {entry.imageUrl ? (
          <img
            src={entry.imageUrl}
            alt={entry.label}
            className="h-full w-full object-cover"
          />
        ) : (
          <CassetteTape
            size={32}
            absoluteStrokeWidth
            className="text-foreground opacity-20"
          />
        )}
      </div>
      <div className="min-w-0">
        <div data-testid="top-list-label" className="truncate font-medium">
          {entry.label}
        </div>
        {entry.sublabel && (
          <div
            data-testid="top-list-sublabel"
            className="text-foreground-secondary truncate text-sm"
          >
            {entry.sublabel}
          </div>
        )}
      </div>
      <div
        data-testid="top-list-value"
        className="bg-primary/50 text-foreground min-w-fit px-2 py-1 whitespace-nowrap tabular-nums"
        style={{ width: `${fillRatio * 100}%` }}
      >
        {formatValue(entry.value)}
      </div>
    </div>
  );
};
