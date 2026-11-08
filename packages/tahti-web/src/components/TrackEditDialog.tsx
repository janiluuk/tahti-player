import {
  ArrowUpFromLineIcon,
  AudioLinesIcon,
  ListMusicIcon,
  Settings2Icon,
  Share2Icon,
  TagsIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Dialog, InlineError, SaveButton, Tabs } from '@tahti-player/ui';

import type { StudioSound, TracklistEntry } from '../api/studio-types';
import { AddToPlaylistPanel } from './AddToPlaylistPanel';
import { PageLoading } from './PageStates';
import { AdvancedTab } from './track-edit-dialog/AdvancedTab';
import { AudioTab } from './track-edit-dialog/AudioTab';
import { BasicsTab } from './track-edit-dialog/BasicsTab';
import { SharingTab } from './track-edit-dialog/SharingTab';
import { useTrackEditDialog } from './track-edit-dialog/useTrackEditDialog';
import { TrackExportConnections } from './TrackExportConnections';
import { TrackExportPanel } from './TrackExportPanel';
import { TracklistEditor } from './TracklistEditor';

type Props = {
  soundId: string | null;
  onClose: () => void;
  onSaved?: (item: StudioSound) => void;
};

export function TrackEditDialog({ soundId, onClose, onSaved }: Props) {
  const { t } = useTranslation('web');
  const state = useTrackEditDialog(soundId, onSaved);
  const {
    isOpen,
    tab,
    setTab,
    item,
    form,
    setForm,
    loading,
    saving,
    playlistOpen,
    setPlaylistOpen,
    loadError,
    isDjMix,
    visibleTabOrder,
    save,
  } = state;

  return (
    <>
      <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-4xl">
        <Dialog.Title>{t('trackEditDialog.editTrack')}</Dialog.Title>

        {loading ? (
          <PageLoading label={t('loading.loadingTrack')} />
        ) : item ? (
          <Tabs
            className="mt-3"
            listClassName="border-border border-b pb-3"
            panelClassName="pt-3"
            selectedIndex={visibleTabOrder.indexOf(tab)}
            onChange={(index) => setTab(visibleTabOrder[index]!)}
            items={[
              {
                id: 'basics',
                label: 'Basics',
                icon: <TagsIcon size={15} />,
                content: <BasicsTab soundId={soundId!} state={state} />,
              },
              ...(isDjMix
                ? [
                    {
                      id: 'tracklist' as const,
                      label: 'Tracklist',
                      icon: <ListMusicIcon size={15} />,
                      content: (
                        <TracklistEditor
                          durationSec={item.durationSec ?? 0}
                          peaks={item.peaks ?? []}
                          value={
                            (form.tracklist as TracklistEntry[] | undefined) ??
                            []
                          }
                          onChange={(tracklist) =>
                            setForm({ ...form, tracklist })
                          }
                        />
                      ),
                    },
                  ]
                : []),
              {
                id: 'sharing',
                label: 'Sharing',
                icon: <Share2Icon size={15} />,
                content: (
                  <SharingTab soundId={soundId!} item={item} state={state} />
                ),
              },
              {
                id: 'advanced',
                label: 'Advanced',
                icon: <Settings2Icon size={15} />,
                content: (
                  <div className="flex flex-col gap-8">
                    <section
                      aria-label={t('trackEditDialog.audio')}
                      className="flex flex-col gap-3"
                    >
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <AudioLinesIcon size={15} aria-hidden />
                        {t('trackEditDialog.audio')}
                      </h3>
                      <AudioTab soundId={soundId!} item={item} state={state} />
                    </section>
                    <section
                      aria-label={t('trackEditDialog.export')}
                      className="flex flex-col gap-3"
                    >
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <ArrowUpFromLineIcon size={15} aria-hidden />
                        {t('trackEditDialog.export')}
                      </h3>
                      <TrackExportPanel soundId={item.id} />
                      <TrackExportConnections />
                    </section>
                    <AdvancedTab item={item} state={state} />
                  </div>
                ),
              },
            ]}
          />
        ) : null}

        {loadError && <InlineError className="mt-3">{loadError}</InlineError>}

        <Dialog.Actions>
          <Dialog.Close>{t('trackEditDialog.close')}</Dialog.Close>
          {item ? (
            <SaveButton
              disabled={!form.title?.trim()}
              saving={saving}
              label={t('trackEditDialog.saveChanges')}
              onClick={() => void save()}
            />
          ) : null}
        </Dialog.Actions>
      </Dialog.Root>

      {soundId && (
        <AddToPlaylistPanel
          isOpen={playlistOpen}
          soundId={soundId}
          trackTitle={item?.title ?? ''}
          onClose={() => setPlaylistOpen(false)}
        />
      )}
    </>
  );
}
