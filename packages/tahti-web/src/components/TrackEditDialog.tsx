import {
  ArrowUpFromLineIcon,
  AudioLinesIcon,
  ListMusicIcon,
  Settings2Icon,
  Share2Icon,
  TagsIcon,
} from 'lucide-react';

import { Dialog, SaveButton, Tabs } from '@tahti-player/ui';

import type {
  StudioSound,
  TracklistEntry,
  TracklistOverlaySettings,
} from '../api/studio-types';
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
        <Dialog.Title>Edit track</Dialog.Title>

        {loading ? (
          <PageLoading label="Loading track…" />
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
                          overlay={
                            (form.tracklistOverlay as
                              TracklistOverlaySettings | undefined) ?? {
                              enabled: false,
                              preset: 'cards',
                            }
                          }
                          onChange={(tracklist) =>
                            setForm({ ...form, tracklist })
                          }
                          onOverlayChange={(tracklistOverlay) =>
                            setForm({ ...form, tracklistOverlay })
                          }
                        />
                      ),
                    },
                  ]
                : []),
              {
                id: 'audio',
                label: 'Audio',
                icon: <AudioLinesIcon size={15} />,
                content: (
                  <AudioTab soundId={soundId!} item={item} state={state} />
                ),
              },
              {
                id: 'sharing',
                label: 'Sharing',
                icon: <Share2Icon size={15} />,
                content: (
                  <SharingTab soundId={soundId!} item={item} state={state} />
                ),
              },
              {
                id: 'export',
                label: 'Export',
                icon: <ArrowUpFromLineIcon size={15} />,
                content: (
                  <div className="flex flex-col gap-4">
                    <TrackExportPanel soundId={item.id} />
                    <TrackExportConnections />
                  </div>
                ),
              },
              {
                id: 'advanced',
                label: 'Advanced',
                icon: <Settings2Icon size={15} />,
                content: <AdvancedTab item={item} state={state} />,
              },
            ]}
          />
        ) : null}

        {loadError && (
          <p className="text-accent-red mt-3 text-sm" role="alert">
            {loadError}
          </p>
        )}

        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
          {item ? (
            <SaveButton
              disabled={!form.title?.trim()}
              saving={saving}
              label="Save changes"
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
