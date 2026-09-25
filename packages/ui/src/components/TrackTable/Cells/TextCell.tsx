import { CellContext } from '@tanstack/react-table';

import { Track } from '@tahti-player/model';

import { cn } from '../../../utils';
import { collapsibleColumnClass } from '../utils/columns';

export const TextCell = <T extends Track>({
  getValue,
  column,
}: CellContext<T, string | number | undefined>) => (
  <td
    className={cn(
      'cursor-default truncate px-2',
      collapsibleColumnClass(column.id),
    )}
  >
    <div className="truncate">{getValue()}</div>
  </td>
);
