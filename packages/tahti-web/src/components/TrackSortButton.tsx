import { useTranslation } from '@tahti-player/i18n';
import { SortMenuButton } from '@tahti-player/ui';

import { trackSortOptions, type TrackSort } from '../lib/trackSort';

/** The track lists' sort control (see `SortMenuButton`). */
export function TrackSortButton({
  value,
  onChange,
}: {
  value: TrackSort;
  onChange: (sort: TrackSort) => void;
}) {
  const { t } = useTranslation('web');
  return (
    <SortMenuButton
      options={trackSortOptions(t)}
      value={value}
      onChange={onChange}
      label="Sort tracks"
      defaultValue="default"
      data-testid="track-sort-button"
    />
  );
}
