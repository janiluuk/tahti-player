import { CellContext } from '@tanstack/react-table';

import { Track } from '@tahti-player/model';

import { Checkbox } from '../../Checkbox';
import { useUiLabels } from '../../UiLabels';
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
  const uiLabels = useUiLabels();
  const meta = table.options.meta as SelectCellMeta;
  const track = row.original;
  const id = getItemId(track, row.index);
  const selected = meta.isRowSelected(id);

  return (
    <td className="w-10 text-center">
      <Checkbox
        checked={selected}
        onChange={() => meta.onToggleRowSelected(id)}
        onClick={(e) => e.stopPropagation()}
        aria-label={
          selected
            ? uiLabels.deselectRow(track.title)
            : uiLabels.selectRow(track.title)
        }
      />
    </td>
  );
};
