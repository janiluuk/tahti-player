import { MessageCircleIcon, MicIcon } from 'lucide-react';

import {
  FilterChips,
  Input,
  SegmentedControl,
  Select,
  Textarea,
} from '@tahti-player/ui';

import type { ShowType, StudioShowSeries } from '../api/shows';
import { ShowImagePicker } from './ShowImagePicker';

export type BroadcastDetailsValues = {
  title: string;
  description: string;
  coverUrl: string;
  mode: 'SINGLE' | 'SERIES';
  showType: ShowType;
  durationHours: 1 | 2;
};

type Props = {
  values: BroadcastDetailsValues;
  shows?: StudioShowSeries[];
  selectedShowId?: string;
  episodeNumber?: number;
  onChange: (values: BroadcastDetailsValues) => void;
  onShowChange?: (showId: string) => void;
};

export function BroadcastDetailsFields({
  values,
  shows = [],
  selectedShowId = '',
  episodeNumber = 1,
  onChange,
  onShowChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {onShowChange && shows.length > 0 ? (
        <div className="flex flex-col gap-1 text-sm">
          <Select
            label="Prepared show"
            placeholder="Create a new show"
            options={shows.map((show) => ({
              id: show.id,
              label: show.title,
            }))}
            value={selectedShowId}
            onValueChange={onShowChange}
          />
          <span className="text-foreground-secondary text-xs">
            Existing show details fill in below and prepare the next episode
            automatically.
          </span>
        </div>
      ) : null}

      <FilterChips
        aria-label="Broadcast type"
        items={[
          {
            id: 'LIVE_SET',
            label: 'Live set',
            icon: <MicIcon size={13} aria-hidden />,
          },
          {
            id: 'TALK',
            label: 'Talk',
            icon: <MessageCircleIcon size={13} aria-hidden />,
          },
        ]}
        selected={values.showType}
        onChange={(type) => onChange({ ...values, showType: type as ShowType })}
      />

      <div className="flex flex-wrap items-end gap-3">
        <FilterChips
          aria-label="Duration"
          items={[
            { id: '1', label: '1h' },
            { id: '2', label: '2h' },
          ]}
          selected={String(values.durationHours)}
          onChange={(id) =>
            onChange({ ...values, durationHours: Number(id) as 1 | 2 })
          }
        />
        <SegmentedControl
          aria-label="Show format"
          options={[
            { id: 'SERIES', label: 'Continuous show' },
            { id: 'SINGLE', label: 'Single show' },
          ]}
          value={values.mode}
          onChange={(mode) => onChange({ ...values, mode })}
        />
        {values.mode === 'SERIES' ? (
          <span className="text-foreground-secondary text-xs">
            Episode #{episodeNumber}
          </span>
        ) : null}
      </div>

      <Input
        label="Show name"
        value={values.title}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        placeholder="New show name or episode title"
      />
      <Textarea
        label="Show description"
        tone="secondary"
        value={values.description}
        onChange={(event) =>
          onChange({ ...values, description: event.target.value })
        }
        rows={2}
        placeholder="What listeners can expect"
      />
      <ShowImagePicker
        label="Show cover"
        description="JPEG, PNG, WebP, or GIF"
        value={values.coverUrl}
        onUrlChange={(coverUrl) => onChange({ ...values, coverUrl })}
      />
    </div>
  );
}
