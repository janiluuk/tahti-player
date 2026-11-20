import { CheckSquareIcon, DownloadIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Input, Select, Toggle } from '@tahti-player/ui';

import type { StudioCollection } from '../../../api/studio-types';

export const NEW_PLAYLIST_DESTINATION = '__new_playlist__';

type Props = {
  playlistDestinations: StudioCollection[];
  destinationId: string;
  onDestinationIdChange: (value: string) => void;
  newDestinationName: string;
  onNewDestinationNameChange: (value: string) => void;
  visibleTrackCount: number;
  selectedCount: number;
  busy: boolean;
  importCoverArt: boolean;
  onImportCoverArtChange: (value: boolean) => void;
  onSelectAll: () => void;
  onImport: () => void;
};

export function HearthisImportDestination({
  playlistDestinations,
  destinationId,
  onDestinationIdChange,
  newDestinationName,
  onNewDestinationNameChange,
  visibleTrackCount,
  selectedCount,
  busy,
  importCoverArt,
  onImportCoverArtChange,
  onSelectAll,
  onImport,
}: Props) {
  const { t } = useTranslation('web');
  return (
    <div className="border-border bg-background-secondary/40 flex flex-wrap items-center gap-2 rounded-lg border p-3">
      <Select
        aria-label={t('hearthisCardStates.destinationPlaylist')}
        className="min-w-0 flex-1 basis-40"
        options={[
          { id: '', label: t('hearthisCard.destination') },
          {
            id: NEW_PLAYLIST_DESTINATION,
            label: t('hearthisCard.new'),
          },
          ...playlistDestinations.map((c) => ({
            id: c.id ?? c.slug,
            label: c.name,
          })),
        ]}
        value={destinationId}
        onValueChange={onDestinationIdChange}
      />
      {destinationId === NEW_PLAYLIST_DESTINATION ? (
        <Input
          size="sm"
          value={newDestinationName}
          onChange={(e) => onNewDestinationNameChange(e.target.value)}
          aria-label={t('hearthisCardStates.newPlaylistName')}
          placeholder={t('hearthisCardStates.playlistName')}
          className="min-w-0 flex-1 basis-40"
        />
      ) : null}
      <Toggle
        label={t('hearthisCardBatch34.importCoverArt')}
        checked={importCoverArt}
        onChange={onImportCoverArtChange}
      />
      <Button
        size="sm"
        variant="secondary"
        disabled={visibleTrackCount === 0}
        onClick={onSelectAll}
      >
        <CheckSquareIcon size={15} className="mr-1.5" aria-hidden />
        {t('hearthisCardStates.selectAll')}
      </Button>
      <Button
        size="sm"
        disabled={
          busy ||
          !destinationId ||
          (destinationId === NEW_PLAYLIST_DESTINATION &&
            !newDestinationName.trim()) ||
          selectedCount === 0
        }
        onClick={onImport}
      >
        <DownloadIcon size={15} className="mr-1.5" aria-hidden />
        {t('hearthisCardBatch34.importSelected', {
          count: selectedCount,
        })}
      </Button>
    </div>
  );
}
