import { SearchIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Input } from '@tahti-player/ui';

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
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {onQueryChange ? (
        <Input
          enterKeyHint="search"
          type="search"
          value={query ?? ''}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchLabel ?? searchPlaceholder}
          className="max-w-md"
          startAddon={
            <SearchIcon size={14} aria-hidden className="opacity-70" />
          }
        />
      ) : null}
      {children}
    </div>
  );
}
