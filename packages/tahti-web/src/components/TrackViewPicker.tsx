import {
  AlignJustifyIcon,
  CheckIcon,
  LayoutGridIcon,
  ListIcon,
  Rows2Icon,
  Rows3Icon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, Popover } from '@tahti-player/ui';

import type { TrackListView } from '../stores/trackListViewStore';

export type TrackViewOption = {
  id: TrackListView;
  label: string;
  icon: ReactNode;
};

const SIZE_OPTIONS: TrackViewOption[] = [
  {
    id: 'comfortable',
    label: 'Large',
    icon: <Rows3Icon size={16} aria-hidden />,
  },
  { id: 'compact', label: 'Medium', icon: <Rows2Icon size={16} aria-hidden /> },
  {
    id: 'dense',
    label: 'Small',
    icon: <AlignJustifyIcon size={16} aria-hidden />,
  },
];

const GRID_OPTION: TrackViewOption = {
  id: 'grid',
  label: 'Grid',
  icon: <LayoutGridIcon size={16} aria-hidden />,
};

const LIST_OPTION: TrackViewOption = {
  id: 'list',
  label: 'List',
  icon: <ListIcon size={16} aria-hidden />,
};

/** The views a track listing offers: three row sizes, then Grid and List
 * when the listing supports them. */
export function trackViewOptions({
  allowGrid = false,
  allowList = false,
}: {
  allowGrid?: boolean;
  allowList?: boolean;
}): TrackViewOption[] {
  return [
    ...SIZE_OPTIONS,
    ...(allowGrid ? [GRID_OPTION] : []),
    ...(allowList ? [LIST_OPTION] : []),
  ];
}

export type TrackViewPickerProps = {
  options: TrackViewOption[];
  value: TrackListView;
  onChange: (view: TrackListView) => void;
};

/** Icon button showing the current view; opens a popover to pick another. */
export function TrackViewPicker({
  options,
  value,
  onChange,
}: TrackViewPickerProps) {
  const current = options.find((option) => option.id === value) ?? options[0];
  return (
    <Popover
      anchor="bottom end"
      tooltip={{ content: 'Track size', side: 'top' }}
      panelClassName="min-w-40"
      trigger={
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label={`Track size: ${current?.label ?? ''}`}
          data-testid="track-view-picker"
        >
          {current?.icon}
        </Button>
      }
    >
      <Popover.Menu role="menu" aria-label="Track size">
        {options.map((option) => (
          <Popover.Item
            key={option.id}
            closeOnClick
            role="menuitemradio"
            aria-checked={option.id === value}
            icon={option.icon}
            onClick={() => onChange(option.id)}
          >
            <span className="flex items-center gap-3">
              {option.label}
              {option.id === value ? (
                <CheckIcon size={14} aria-hidden className="text-accent" />
              ) : null}
            </span>
          </Popover.Item>
        ))}
      </Popover.Menu>
    </Popover>
  );
}
