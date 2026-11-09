import {
  AlignJustifyIcon,
  LayoutGridIcon,
  ListIcon,
  Rows2Icon,
  Rows3Icon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { Button, Popover, Tooltip } from '@tahti-player/ui';

import { cn } from '../lib/cn';
import { webT } from '../lib/webT';
import type { TrackListView } from '../stores/trackListViewStore';

export type TrackViewOption = {
  id: TrackListView;
  label: string;
  icon: ReactNode;
};

function sizeOptions(t: TFunction<'web'>): TrackViewOption[] {
  return [
    {
      id: 'comfortable',
      label: t('trackViewPicker.large'),
      icon: <Rows3Icon size={16} aria-hidden />,
    },
    {
      id: 'compact',
      label: t('trackViewPicker.medium'),
      icon: <Rows2Icon size={16} aria-hidden />,
    },
    {
      id: 'dense',
      label: t('trackViewPicker.small'),
      icon: <AlignJustifyIcon size={16} aria-hidden />,
    },
  ];
}

function gridOption(t: TFunction<'web'>): TrackViewOption {
  return {
    id: 'grid',
    label: t('trackViewPicker.grid'),
    icon: <LayoutGridIcon size={16} aria-hidden />,
  };
}

function listOption(t: TFunction<'web'>): TrackViewOption {
  return {
    id: 'list',
    label: t('trackViewPicker.list'),
    icon: <ListIcon size={16} aria-hidden />,
  };
}

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
    ...sizeOptions(webT()),
    ...(allowGrid ? [gridOption(webT())] : []),
    ...(allowList ? [listOption(webT())] : []),
  ];
}

export type TrackViewPickerProps = {
  options: TrackViewOption[];
  value: TrackListView;
  onChange: (view: TrackListView) => void;
};

/** Icon button showing the current view; opens a vertical strip of view
 * icons to pick another. */
export function TrackViewPicker({
  options,
  value,
  onChange,
}: TrackViewPickerProps) {
  const { t } = useTranslation('web');
  const current = options.find((option) => option.id === value) ?? options[0];
  return (
    <Popover
      anchor="bottom end"
      tooltip={{ content: 'Track size', side: 'top' }}
      panelClassName="p-1"
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
      <Popover.Menu
        role="menu"
        aria-label={t('trackViewPickerText.trackSize')}
        className="min-w-0"
      >
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <Tooltip key={option.id} content={option.label} side="left">
              <Popover.Item
                closeOnClick
                role="menuitemradio"
                aria-checked={selected}
                align="center"
                icon={option.icon}
                className={cn(
                  'rounded-sm px-2',
                  selected && 'bg-background-secondary text-accent',
                )}
                onClick={() => onChange(option.id)}
              >
                <span className="sr-only">{option.label}</span>
              </Popover.Item>
            </Tooltip>
          );
        })}
      </Popover.Menu>
    </Popover>
  );
}
