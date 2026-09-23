import { Link } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  BarChart3Icon,
  ListMusicIcon,
  TagsIcon,
} from 'lucide-react';

import { Alert, Tabs, Tooltip } from '@tahti-player/ui';

import { AddToPlaylistPanel } from '../../components/AddToPlaylistPanel';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { TrackInsightsPanel } from '../../components/TrackInsightsPanel';
import { DetailsTabContent } from './sound/DetailsTabContent';
import { PlaylistsTabContent } from './sound/PlaylistsTabContent';
import { SoundHeader } from './sound/SoundHeader';
import { useSoundEditor } from './sound/useSoundEditor';

export function StudioSoundView({ id }: { id: string }) {
  const state = useSoundEditor(id);
  const {
    item,
    tab,
    setTab,
    notReady,
    hasError,
    isAudioClip,
    playlistOpen,
    setPlaylistOpen,
    title,
  } = state;

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout flex w-full flex-col gap-6">
        <StudioNav current={`/studio/sounds/${id}`} />
        <Tooltip content="Back to Music" side="right">
          <Link
            to="/studio/sounds"
            aria-label="Back to Music"
            className="text-foreground-secondary hover:bg-background-secondary inline-flex size-8 w-fit items-center justify-center rounded-full"
          >
            <ArrowLeftIcon size={16} aria-hidden />
          </Link>
        </Tooltip>
        {!item ? (
          <PageLoading label="Loading…" />
        ) : (
          <>
            <SoundHeader id={id} state={state} />

            {notReady && (
              <Alert tone="neutral" aria-live="polite">
                Still processing — this can take a minute for longer files.
                Playback, the waveform, and quick fixes will unlock once it's
                ready; metadata below is safe to edit and save now.
              </Alert>
            )}

            {hasError && (
              <Alert tone="error">
                Processing failed for this file. Try uploading it again, or
                contact support if it keeps happening.
              </Alert>
            )}

            <Tabs
              selectedIndex={
                tab === 'details' ? 0 : tab === 'playlists' ? 1 : 2
              }
              onChange={(index) =>
                setTab(
                  index === 0
                    ? 'details'
                    : index === 1
                      ? 'playlists'
                      : 'insights',
                )
              }
              items={[
                {
                  id: 'details',
                  label: 'Details',
                  icon: <TagsIcon size={15} />,
                  content: <DetailsTabContent id={id} state={state} />,
                },
                ...(!isAudioClip
                  ? [
                      {
                        id: 'playlists' as const,
                        label: 'Playlists',
                        icon: <ListMusicIcon size={15} />,
                        content: (
                          <PlaylistsTabContent
                            state={state}
                            isAudioClip={isAudioClip}
                          />
                        ),
                      },
                    ]
                  : []),
                {
                  id: 'insights',
                  label: 'Insights',
                  icon: <BarChart3Icon size={15} />,
                  content: <TrackInsightsPanel kind="sound" id={id} />,
                },
              ]}
            />
          </>
        )}
        <AddToPlaylistPanel
          isOpen={playlistOpen}
          soundId={id}
          trackTitle={item?.title ?? title}
          onClose={() => setPlaylistOpen(false)}
        />
      </div>
    </StudioGate>
  );
}
