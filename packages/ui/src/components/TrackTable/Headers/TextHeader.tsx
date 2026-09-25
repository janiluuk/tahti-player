import { HeaderContext } from '@tanstack/react-table';
import { SortAsc, SortDesc } from 'lucide-react';
import { PropsWithChildren, useCallback } from 'react';

import { Track } from '@tahti-player/model';
import { cn } from '@tahti-player/ui';

import { collapsibleColumnClass } from '../utils/columns';

type HeaderValue = string | undefined;

export function TextHeader<T extends Track>({
  children,
  context,
}: PropsWithChildren<{ context: HeaderContext<T, HeaderValue> }>) {
  const { getCanSort, getIsSorted, toggleSorting } = context.column;

  const isSorted = getIsSorted();
  const canSort = getCanSort();

  const onClick = useCallback(() => {
    if (canSort) {
      toggleSorting();
    }
  }, []);

  return (
    <th
      role="columnheader"
      className={cn(
        'px-2 text-left',
        { 'cursor-pointer': canSort },
        collapsibleColumnClass(context.column.id),
      )}
      onClick={onClick}
    >
      <span className="flex items-center">
        {children}
        {isSorted === 'desc' && <SortDesc className="ml-1 h-4 w-4" />}
        {isSorted === 'asc' && <SortAsc className="ml-1 h-4 w-4" />}
      </span>
    </th>
  );
}
