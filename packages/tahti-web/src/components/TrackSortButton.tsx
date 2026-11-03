import { CheckIcon, ListFilterIcon } from 'lucide-react';

import { Button, Popover } from '@tahti-player/ui';

import { TRACK_SORT_OPTIONS, type TrackSort } from '../lib/trackSort';

/** Icon button that opens the track sort options; the current one is
 * checked. Replaces a full-width select in list toolbars. */
export function TrackSortButton({
  value,
  onChange,
}: {
  value: TrackSort;
  onChange: (sort: TrackSort) => void;
}) {
  const current =
    TRACK_SORT_OPTIONS.find((option) => option.id === value)?.label ??
    TRACK_SORT_OPTIONS[0]!.label;
  return (
    <Popover
      anchor="bottom end"
      tooltip={{ content: `Sort: ${current}`, side: 'top' }}
      trigger={
        <Button
          size="icon-sm"
          variant={value === 'default' ? 'secondary' : 'default'}
          aria-label={`Sort tracks (${current})`}
          data-testid="track-sort-button"
        >
          <ListFilterIcon size={16} aria-hidden />
        </Button>
      }
      panelClassName="min-w-44"
    >
      <Popover.Menu aria-label="Sort tracks">
        {TRACK_SORT_OPTIONS.map((option) => (
          <Popover.Item
            key={option.id}
            role="menuitemradio"
            aria-checked={option.id === value}
            icon={
              <CheckIcon
                size={16}
                className={option.id === value ? undefined : 'invisible'}
              />
            }
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </Popover.Item>
        ))}
      </Popover.Menu>
    </Popover>
  );
}
