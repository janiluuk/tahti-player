import { BarChart3Icon, ListMusicIcon, TagsIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Alert,
  backButtonCornerClassName,
  BackButtonLink,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { TrackInsightsPanel } from '../../components/TrackInsightsPanel';
import { useEditMode } from '../../lib/useEditMode';
import { DetailsTabContent } from './sound/DetailsTabContent';
import { PlaylistsTabContent } from './sound/PlaylistsTabContent';
import { ProcessingFailedAlert } from './sound/ProcessingFailedAlert';
import { SoundHeader } from './sound/SoundHeader';
import { useSoundEditor } from './sound/useSoundEditor';

export function StudioSoundView({ id }: { id: string }) {
  const { t } = useTranslation('web');
  const state = useSoundEditor(id);
  const { item, tab, setTab, notReady, hasError, isAudioClip, setItem } = state;
  const [editing, setEditing] = useEditMode();
  const tabIds: ('details' | 'playlists' | 'insights')[] = [
    ...(editing ? (['details'] as const) : []),
    ...(!isAudioClip ? (['playlists'] as const) : []),
    'insights',
  ];

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout flex w-full flex-col gap-6">
        <div className="relative flex flex-col gap-6">
          <Tooltip
            content="Back to Library sounds"
            side="right"
            wrapperClassName={backButtonCornerClassName}
          >
            <BackButtonLink
              to="/library/sounds"
              aria-label="Back to Library sounds"
            />
          </Tooltip>
          {!item ? (
            <PageLoading label={t('loading.loading')} />
          ) : (
            <>
              <SoundHeader
                id={id}
                state={state}
                editing={editing}
                onEditingChange={(next) => {
                  setEditing(next);
                }}
              />

              {notReady && (
                <Alert tone="neutral" aria-live="polite">
                  Still processing — this can take a minute for longer files.
                  Playback, the waveform, and quick fixes will unlock once it's
                  ready; metadata below is safe to edit and save now.
                </Alert>
              )}

              {hasError && (
                <ProcessingFailedAlert
                  item={item}
                  onRetried={() =>
                    setItem({
                      ...item,
                      status: 'PENDING',
                      processingError: null,
                    })
                  }
                />
              )}

              <Tabs
                selectedIndex={Math.max(
                  0,
                  tabIds.indexOf(tab === 'details' ? tabIds[0] : tab),
                )}
                onChange={(index) => setTab(tabIds[index] ?? tabIds[0])}
                items={[
                  ...(editing
                    ? [
                        {
                          id: 'details' as const,
                          label: 'Details',
                          icon: <TagsIcon size={15} />,
                          content: <DetailsTabContent id={id} state={state} />,
                        },
                      ]
                    : []),
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
        </div>
      </div>
    </StudioGate>
  );
}
