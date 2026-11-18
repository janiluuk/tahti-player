import type { ReactNode } from 'react';

import { FilterBar } from '@tahti-player/ui';

import { cn } from '../../lib/cn';

export function LibrarySectionToolbar({
  query,
  onQueryChange,
  searchPlaceholder,
  searchLabel,
  className,
  children,
}: {
  query?: string;
  onQueryChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  className?: string;
  children?: ReactNode;
}) {
  if (!onQueryChange) {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {children}
      </div>
    );
  }
  return (
    <FilterBar
      className={className}
      searchValue={query ?? ''}
      onSearchChange={onQueryChange}
      searchPlaceholder={searchPlaceholder}
      searchLabel={searchLabel ?? searchPlaceholder}
    >
      {children}
    </FilterBar>
  );
}
