import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

type LibraryItemRowProps = {
  artwork?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function LibraryItemRow({
  artwork,
  title,
  subtitle,
  meta,
  actions,
  className,
}: LibraryItemRowProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0',
        className,
      )}
      data-testid="library-item-row"
    >
      <div className="flex min-w-0 items-start gap-3">
        {artwork ? <div className="shrink-0">{artwork}</div> : null}
        <div className="min-w-0">
          {typeof title === 'string' ? (
            <p className="truncate text-sm font-semibold">{title}</p>
          ) : (
            <div className="text-sm font-medium">{title}</div>
          )}
          {subtitle ? (
            <p className="text-foreground-secondary text-xs">{subtitle}</p>
          ) : null}
          {meta ? (
            <p className="text-foreground-secondary mt-1 text-xs">{meta}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
