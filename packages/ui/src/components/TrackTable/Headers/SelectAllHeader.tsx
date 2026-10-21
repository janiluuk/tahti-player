import { HeaderContext } from '@tanstack/react-table';

import { Track } from '@tahti-player/model';

import { useTrackTableContext } from '../TrackTableContext';

type SelectAllHeaderMeta = {
  isRowSelected: (id: string) => boolean;
  onToggleAllRows: (ids: string[]) => void;
};

export function SelectAllHeader<T extends Track>(
  context: HeaderContext<T, unknown>,
) {
  const { getItemId } = useTrackTableContext<T>();
  const meta = context.table.options.meta as SelectAllHeaderMeta;
  const rows = context.table.getRowModel().rows;
  const ids = rows.map((row) => getItemId(row.original, row.index));
  const allSelected =
    ids.length > 0 && ids.every((id) => meta.isRowSelected(id));
  const someSelected = !allSelected && ids.some((id) => meta.isRowSelected(id));

  return (
    <th role="columnheader" className="w-10 text-center">
      <input
        type="checkbox"
        className="accent-primary h-4 w-4 cursor-pointer align-middle"
        checked={allSelected}
        ref={(el) => {
          if (el) {
            el.indeterminate = someSelected;
          }
        }}
        onChange={() => meta.onToggleAllRows(ids)}
        aria-label={allSelected ? 'Deselect all rows' : 'Select all rows'}
      />
    </th>
  );
}
