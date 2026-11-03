import { SortMenuButton } from '@tahti-player/ui';

import { TRACK_SORT_OPTIONS, type TrackSort } from '../lib/trackSort';

/** The track lists' sort control (see `SortMenuButton`). */
export function TrackSortButton({
  value,
  onChange,
}: {
  value: TrackSort;
  onChange: (sort: TrackSort) => void;
}) {
  return (
    <SortMenuButton
      options={TRACK_SORT_OPTIONS}
      value={value}
      onChange={onChange}
      label="Sort tracks"
      defaultValue="default"
      data-testid="track-sort-button"
    />
  );
}
