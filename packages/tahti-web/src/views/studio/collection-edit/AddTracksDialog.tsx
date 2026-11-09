import { PauseIcon, PlayIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, Input, Tooltip } from '@tahti-player/ui';

import type { StudioSound } from '../../../api/studio-types';
import { PageEmpty } from '../../../components/PageStates';
import { webT } from '../../../lib/webT';

function notReadyLabel(status: string): string | null {
  const s = status.toUpperCase();
  if (s === 'PENDING' || s === 'PROCESSING') {
    return 'Processing…';
  }
  if (s === 'ERROR') {
    return 'Processing failed';
  }
  return null;
}

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Library picker for adding sounds to a collection. Owns the search box;
 * tracks already in the collection are hidden. */
export function AddTracksDialog({
  isOpen,
  onClose,
  title,
  sounds,
  existingSoundIds,
  addBusyId,
  isPreviewing,
  onPreview,
  onPause,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sounds: StudioSound[];
  existingSoundIds: ReadonlySet<string | undefined>;
  addBusyId: string | null;
  isPreviewing: (sound: StudioSound) => boolean;
  onPreview: (sound: StudioSound) => void;
  onPause: () => void;
  onAdd: (sound: StudioSound) => void;
}) {
  const { t } = useTranslation('web');
  const [query, setQuery] = useState('');

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sounds.filter(
      (sound) =>
        !existingSoundIds.has(sound.id) &&
        (!q ||
          [sound.title, sound.genre, sound.contentType]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q)),
    );
  }, [sounds, existingSoundIds, query]);

  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>
        {t('collectionAddTracks.chooseLibraryTracksToAdd')}
      </Dialog.Description>
      <div className="mt-4 flex min-w-0 flex-col gap-3">
        <Input
          enterKeyHint="search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('collectionAddTracks.searchTracksByTitleGenre')}
          aria-label={t('collectionAddTracks.searchLibraryTracks')}
          endAddon={<SearchIcon size={16} aria-hidden />}
        />
        <div className="border-border max-h-96 min-h-0 overflow-auto rounded-md border">
          {available.length === 0 ? (
            <PageEmpty
              title={
                query.trim()
                  ? t('addTracksDialogStates.noAvailableTracksMatchYour')
                  : t('addTracksDialogStates.allLibraryTracksAreAlready')
              }
              action={
                query.trim() ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setQuery('')}
                  >
                    {t('collectionAddTracks.clearSearch')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul aria-label={t('collectionAddTracks.availableLibraryTracks')}>
              {available.map((sound, index) => {
                const previewing = isPreviewing(sound);
                const notReady = notReadyLabel(sound.status ?? '');
                return (
                  <li
                    key={sound.id}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm ${index % 2 === 1 ? 'bg-background-secondary/40' : 'bg-background'}`}
                  >
                    <Tooltip
                      content={
                        previewing
                          ? t('actions.pauseItem', { title: sound.title })
                          : t('addTracksDialogStates.previewItem', {
                              title: sound.title,
                            })
                      }
                      side="top"
                    >
                      <Button
                        size="icon-sm"
                        variant={previewing ? 'secondary' : 'text'}
                        aria-label={
                          previewing
                            ? t('actions.pauseItem', { title: sound.title })
                            : t('addTracksDialogStates.previewItem', {
                                title: sound.title,
                              })
                        }
                        onClick={() =>
                          previewing ? onPause() : onPreview(sound)
                        }
                      >
                        {previewing ? (
                          <PauseIcon size={15} aria-hidden />
                        ) : (
                          <PlayIcon size={15} aria-hidden />
                        )}
                      </Button>
                    </Tooltip>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{sound.title}</p>
                      <p className="text-foreground-secondary truncate text-xs">
                        {[
                          notReady,
                          sound.artistName,
                          sound.genre,
                          !notReady && sound.durationSec
                            ? formatDuration(sound.durationSec)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={Boolean(notReady) || addBusyId === sound.id}
                      aria-label={
                        notReady
                          ? webT()('a11yNamed.addWhenProcessed', {
                              name: sound.title,
                            })
                          : undefined
                      }
                      onClick={() => onAdd(sound)}
                    >
                      <PlusIcon size={15} aria-hidden className="mr-1" />
                      {addBusyId === sound.id
                        ? t('addTracksDialogStates.adding')
                        : t('addTracksDialogStates.add')}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <Dialog.Actions>
        <Dialog.Close>{t('collectionAddTracks.done')}</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
