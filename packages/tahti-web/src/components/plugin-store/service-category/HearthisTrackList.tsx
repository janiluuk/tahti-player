import { DownloadIcon, ListPlus } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ExternalLink,
  MediaArtwork,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import { playableFromHearthis, type HearthisTrack } from '../../../api/sources';
import { usePlayerStore } from '../../../stores/playerStore';

type Props = {
  tracks: HearthisTrack[];
  selected: Set<string>;
  importedIds: Set<string>;
  importDisabled: boolean;
  onToggle: (id: string) => void;
  onImport: (track: HearthisTrack) => void;
};

export function HearthisTrackList({
  tracks,
  selected,
  importedIds,
  importDisabled,
  onToggle,
  onImport,
}: Props) {
  const { t } = useTranslation('web');
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  return (
    <ul className="flex flex-col gap-2">
      {tracks.map((track) => (
        <li
          key={track.id}
          className="border-border flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2"
        >
          <Toggle
            label={t('hearthisCardBatch34.selectItem', {
              title: track.title,
            })}
            checked={selected.has(track.id)}
            disabled={importedIds.has(track.id)}
            onChange={() => onToggle(track.id)}
          />
          <MediaArtwork
            size="thumb"
            src={track.coverUrl}
            alt={track.title}
            imageReveal={false}
            onPlay={() => play(playableFromHearthis(track))}
            playLabel={t('hearthisCardBatch34.preview')}
            className="border-border shrink-0 rounded border"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{track.title}</div>
            <div className="text-foreground-secondary truncate text-xs">
              {track.username}
            </div>
          </div>
          <Tooltip content={t('actions.queue')} side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label={t('hearthisCardBatch34.queueTrack', {
                title: track.title,
              })}
              onClick={() => enqueue(playableFromHearthis(track))}
            >
              <ListPlus size={15} aria-hidden />
            </Button>
          </Tooltip>
          <Button
            size="sm"
            variant="secondary"
            disabled={importDisabled || importedIds.has(track.id)}
            onClick={() => onImport(track)}
          >
            <DownloadIcon size={15} className="mr-1.5" aria-hidden />
            {importedIds.has(track.id)
              ? t('hearthisCardStates.imported')
              : t('hearthisCardStates.import')}
          </Button>
          <ExternalLink
            href={track.url}
            className="text-foreground-secondary shrink-0 text-xs no-underline hover:underline"
          >
            hearthis.at ↗
          </ExternalLink>
        </li>
      ))}
    </ul>
  );
}
