import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Select } from '@tahti-player/ui';

import type {
  StudioCollection,
  StudioRelease,
  StudioSound,
} from '../../../api/studio-types';
import { CatalogTrackSearch } from '../../../components/CatalogTrackSearch';

type AddItemInput = { soundId: string } | { releaseId: string };

export function PlaylistAddItemsPanel({
  sounds,
  releases,
  items,
  addItem,
}: {
  sounds: StudioSound[];
  releases: StudioRelease[];
  items: NonNullable<StudioCollection['items']>;
  addItem: (
    input: AddItemInput,
    success: string,
    onDone?: () => void,
  ) => Promise<boolean>;
}) {
  const { t } = useTranslation('web');
  const [addSoundId, setAddSoundId] = useState('');
  const [addReleaseId, setAddReleaseId] = useState('');

  return (
    <div className="border-border mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Select
          label={t('playlistEditor.addFromLibrary')}
          value={addSoundId}
          onValueChange={setAddSoundId}
          options={[
            {
              id: '',
              label: t('studioPlaylistEditorView.selectTrack'),
            },
            ...sounds
              .filter((a) => !items.some((item) => item.sound?.id === a.id))
              .map((a) => ({ id: a.id, label: a.title })),
          ]}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={!addSoundId}
          onClick={() => {
            void addItem(
              { soundId: addSoundId },
              t('studioPlaylistEditorViewBatch31.trackAdded'),
              () => setAddSoundId(''),
            );
          }}
        >
          <PlusIcon size={14} aria-hidden className="mr-1.5" />
          {t('playlistEditor.addTrack')}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <Select
          label={t('playlistEditor.addRelease')}
          value={addReleaseId}
          onValueChange={setAddReleaseId}
          options={[
            {
              id: '',
              label: t('studioPlaylistEditorView.selectRelease'),
            },
            ...releases.map((r) => ({
              id: r.id,
              label: r.title,
            })),
          ]}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={!addReleaseId}
          onClick={() => {
            void addItem(
              { releaseId: addReleaseId },
              t('studioPlaylistEditorViewBatch31.releaseAdded'),
              () => setAddReleaseId(''),
            );
          }}
        >
          <PlusIcon size={14} aria-hidden className="mr-1.5" />
          {t('playlistEditor.addRelease')}
        </Button>
      </div>
      <div className="sm:col-span-2">
        <CatalogTrackSearch
          label={t('playlistEditor.addAnyPublicTrack')}
          excludeIds={items.flatMap((item) =>
            item.sound ? [item.sound.id] : [],
          )}
          onAdd={(track) =>
            addItem(
              { soundId: track.id },
              t('studioPlaylistEditorViewBatch31.addedTitle', {
                title: track.title,
              }),
            )
          }
        />
      </div>
    </div>
  );
}
