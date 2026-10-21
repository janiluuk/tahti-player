import { type ComponentProps, type FC } from 'react';

import { cn } from '../../utils';

/**
 * Plain read-only table for small static data (ledgers, stats, inventories).
 * Use `CatalogTable` for large server-sorted lists and `TrackTable` for
 * playable tracks.
 */
export const DataTable: FC<ComponentProps<'table'>> = ({
  className,
  ...props
}) => (
  <table
    data-testid="data-table"
    className={cn('w-full border-collapse text-left text-sm', className)}
    {...props}
  />
);

export const DataTableHead: FC<ComponentProps<'thead'>> = ({
  className,
  ...props
}) => (
  <thead
    className={cn(
      'text-foreground-secondary text-[11px] tracking-wide uppercase',
      className,
    )}
    {...props}
  />
);

export const DataTableBody: FC<ComponentProps<'tbody'>> = ({
  className,
  ...props
}) => (
  <tbody className={cn('[&>tr:last-child]:border-b-0', className)} {...props} />
);

export const DataTableRow: FC<ComponentProps<'tr'>> = ({
  className,
  ...props
}) => <tr className={cn('border-border border-b', className)} {...props} />;

export const DataTableHeaderCell: FC<ComponentProps<'th'>> = ({
  className,
  scope = 'col',
  ...props
}) => (
  <th
    scope={scope}
    className={cn('px-3 py-2 font-semibold', className)}
    {...props}
  />
);

export const DataTableCell: FC<ComponentProps<'td'>> = ({
  className,
  ...props
}) => <td className={cn('px-3 py-2.5 align-top', className)} {...props} />;
