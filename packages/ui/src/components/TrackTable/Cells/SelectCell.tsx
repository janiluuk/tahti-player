import { CellContext } from '@tanstack/react-table';

import { Track } from '@tahti-player/model';

import { useTrackTableContext } from '../TrackTableContext';

type SelectCellMeta = {
  isRowSelected: (id: string) => boolean;
  onToggleRowSelected: (id: string) => void;
};

export const SelectCell = <T extends Track>({
  row,
  table,
}: CellContext<T, unknown>) => {
  const { getItemId } = useTrackTableContext<T>();
  const meta = table.options.meta as SelectCellMeta;
  const track = row.original;
  const id = getItemId(track, row.index);
  const selected = meta.isRowSelected(id);

  return (
    <td className="w-10 text-center">
      <input
        type="checkbox"
        className="accent-primary h-4 w-4 cursor-pointer align-middle"
        checked={selected}
        onChange={(e) => {
          e.stopPropagation();
          meta.onToggleRowSelected(id);
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label={
          selected ? `Deselect ${track.title}` : `Select ${track.title}`
        }
      />
    </td>
  );
};
