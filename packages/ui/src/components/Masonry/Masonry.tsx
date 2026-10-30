import { Children, useSyncExternalStore, type FC, type ReactNode } from 'react';

import { cn } from '../../utils';

/** Column counts per breakpoint; `md` and `xl` match Tailwind's 768px and
 * 1280px. */
export type MasonryColumns = { base: number; md?: number; xl?: number };

const MD_QUERY = '(min-width: 768px)';
const XL_QUERY = '(min-width: 1280px)';

function query(media: string): MediaQueryList | null {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return null;
  }
  return window.matchMedia(media) ?? null;
}

function subscribe(onChange: () => void): () => void {
  const lists = [query(MD_QUERY), query(XL_QUERY)].filter(
    (list): list is MediaQueryList => list !== null,
  );
  for (const list of lists) {
    list.addEventListener('change', onChange);
  }
  return () => {
    for (const list of lists) {
      list.removeEventListener('change', onChange);
    }
  };
}

function breakpoint(): 'base' | 'md' | 'xl' {
  if (query(XL_QUERY)?.matches) {
    return 'xl';
  }
  return query(MD_QUERY)?.matches ? 'md' : 'base';
}

function columnCount(columns: MasonryColumns, at: 'base' | 'md' | 'xl') {
  const md = columns.md ?? columns.base;
  const count =
    at === 'xl' ? (columns.xl ?? md) : at === 'md' ? md : columns.base;
  return Math.max(1, count);
}

export type MasonryProps = {
  children: ReactNode;
  columns?: MasonryColumns;
  className?: string;
  columnClassName?: string;
  'data-testid'?: string;
};

/** Stacks variable-height children in independent columns, so a short item
 * never leaves a gap beside a tall one. Children are dealt round-robin, so
 * reading order stays left to right, then down. */
export const Masonry: FC<MasonryProps> = ({
  children,
  columns = { base: 1, md: 2, xl: 3 },
  className,
  columnClassName,
  'data-testid': testId,
}) => {
  const at = useSyncExternalStore(subscribe, breakpoint, () => 'base' as const);
  const count = columnCount(columns, at);
  const stacks: ReactNode[][] = Array.from({ length: count }, () => []);
  Children.toArray(children).forEach((child, index) => {
    stacks[index % count]?.push(child);
  });

  return (
    <div
      className={cn('flex items-start gap-2', className)}
      data-testid={testId}
      data-columns={count}
    >
      {stacks.map((stack, index) => (
        <div
          key={index}
          className={cn('flex min-w-0 flex-1 flex-col gap-2', columnClassName)}
          data-testid="masonry-column"
        >
          {stack}
        </div>
      ))}
    </div>
  );
};
