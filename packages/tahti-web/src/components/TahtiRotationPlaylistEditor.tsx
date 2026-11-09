import { FC, useMemo } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import type { Track } from '@tahti-player/model';
import { TrackTable } from '@tahti-player/ui';

import type { AdminSelectsItem } from '../api/admin';
import { trackTableLabels } from '../lib/trackTableLabels';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

const formatTotalDuration = (seconds: number) => {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const remainingSeconds = seconds % SECONDS_PER_MINUTE;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const toTrack = (item: AdminSelectsItem): Track => ({
  title: item.title,
  artists: [{ name: item.artistName, roles: ['performer'] }],
  durationMs: item.durationSec == null ? undefined : item.durationSec * 1000,
  source: { provider: 'tahti', id: item.id },
});

type TahtiRotationPlaylistEditorProps = {
  items: AdminSelectsItem[];
  onReorder: (items: AdminSelectsItem[]) => void;
  onRemove: (item: AdminSelectsItem) => void;
  onPreview: (item: AdminSelectsItem) => void;
  readOnly?: boolean;
};

export const TahtiRotationPlaylistEditor: FC<
  TahtiRotationPlaylistEditorProps
> = ({ items, onReorder, onRemove, onPreview, readOnly = false }) => {
  const { t } = useTranslation('web');
  const tracks = useMemo(() => items.map(toTrack), [items]);
  const totalSeconds = items.reduce(
    (total, item) => total + (item.durationSec ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold">
          {items.length} track{items.length === 1 ? '' : 's'}
        </span>
        <span className="text-foreground-secondary font-mono">
          {formatTotalDuration(totalSeconds)} total
        </span>
      </div>
      <TrackTable
        aria-label={t(
          'tahtiRotationPlaylistEditorText.tahtiRadioRotationPlaylist',
        )}
        tracks={tracks}
        labels={trackTableLabels}
        getItemId={(_track, index) => items[index]?.id ?? String(index)}
        features={{
          header: true,
          reorderable: !readOnly,
          filterable: false,
          sortable: false,
        }}
        display={{
          displayPosition: true,
          displayArtist: true,
          displayDuration: true,
          displayDeleteButton: !readOnly,
          displayQueueControls: !readOnly,
          displayThumbnail: false,
        }}
        actions={{
          onReorder: (fromIndex, toIndex) => {
            if (readOnly) {
              return;
            }
            const next = [...items];
            const [moved] = next.splice(fromIndex, 1);
            if (!moved) {
              return;
            }
            next.splice(toIndex, 0, moved);
            onReorder(next);
          },
          onRemove: (_track, index) => {
            if (readOnly) {
              return;
            }
            const item = items[index];
            if (item) {
              onRemove(item);
            }
          },
          onPlayNow: (track) => {
            const item = items.find(
              (candidate) => candidate.id === track.source.id,
            );
            if (item) {
              onPreview(item);
            }
          },
        }}
      />
    </div>
  );
};
