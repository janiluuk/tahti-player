import { useNavigate } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  GaugeIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  ScissorsIcon,
  SparklesIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  ButtonLink,
  EditIconButton,
  SaveButton,
  Tooltip,
  TrackContextMenu,
  TrackProcessing,
} from '@tahti-player/ui';

import { EntitySocialHeader } from '../../../components/EntitySocialHeader';
import { PlayerWaveform } from '../../../components/PlayerWaveform';
import type { SoundEditorState } from './useSoundEditor';

export function SoundHeader({
  id,
  state,
  editing,
  onEditingChange,
}: {
  id: string;
  state: SoundEditorState;
  editing: boolean;
  onEditingChange: (next: boolean) => void;
}) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const {
    item,
    description,
    contentTypeLabel,
    pinned,
    pinBusy,
    togglePin,
    notReady,
    hasError,
    quickBusy,
    onNormalize,
    onAutoTrim,
    masteringEnabled,
    visibility,
    saving,
    title,
    save,
    isPlaying,
    playBusy,
    setPlayerStatus,
    startPlayback,
    peaks,
    isCurrent,
    currentTime,
    editList,
  } = state;

  if (!item) {
    return null;
  }

  return (
    <EntitySocialHeader
      title={item.title}
      imageUrl={item.bannerUrl}
      imageAlt=""
      backdropUrl={item.backgroundUrl ?? item.bannerUrl}
      subtitle={contentTypeLabel}
      description={description.trim() || undefined}
      actions={
        <>
          <Tooltip
            content={pinned ? 'Unpin from page' : 'Pin to page'}
            side="top"
          >
            <Button
              variant="secondary"
              size="icon-sm"
              className="bg-background border-border rounded-md border-(length:--border-width)"
              disabled={pinBusy}
              onClick={() => void togglePin()}
              aria-label={pinned ? 'Unpin from page' : 'Pin to page'}
            >
              {pinned ? (
                <PinOffIcon size={16} aria-hidden />
              ) : (
                <PinIcon size={16} aria-hidden />
              )}
            </Button>
          </Tooltip>
          <TrackContextMenu>
            <Tooltip content={t('soundHeader.quickEdits')} side="top">
              <TrackContextMenu.Trigger>
                <Button
                  variant="text"
                  size="icon-sm"
                  className="bg-background border-border rounded-md border-(length:--border-width)"
                  disabled={notReady || hasError}
                  aria-label={t('soundHeader.quickEdits')}
                >
                  <MoreHorizontalIcon size={16} aria-hidden />
                </Button>
              </TrackContextMenu.Trigger>
            </Tooltip>
            <TrackContextMenu.Content>
              <TrackContextMenu.Header title={t('soundHeader.quickEdits')} />
              <TrackContextMenu.Action
                disabled={quickBusy !== null}
                onClick={onNormalize}
                icon={<GaugeIcon size={16} aria-hidden />}
              >
                {quickBusy === 'normalize' ? 'Normalizing…' : 'Normalize audio'}
              </TrackContextMenu.Action>
              <TrackContextMenu.Action
                disabled={quickBusy !== null}
                onClick={onAutoTrim}
                icon={<ScissorsIcon size={16} aria-hidden />}
              >
                {quickBusy === 'trim' ? 'Trimming silence…' : 'Trim silence'}
              </TrackContextMenu.Action>
              {masteringEnabled && (
                <TrackContextMenu.Action
                  onClick={() =>
                    void navigate({
                      to: '/studio/mastering/$id',
                      params: { id },
                    })
                  }
                  icon={<SparklesIcon size={16} aria-hidden />}
                >
                  Master
                </TrackContextMenu.Action>
              )}
            </TrackContextMenu.Content>
          </TrackContextMenu>
          <Tooltip content={t('soundHeader.openAudioEditor')} side="top">
            <ButtonLink
              to="/studio/sounds/$id/editor"
              params={{ id }}
              variant="secondary"
              size="icon-sm"
              disabled={notReady || hasError}
              aria-label={t('soundHeader.openAudioEditor')}
              className="bg-background border-border rounded-md border-(length:--border-width)"
            >
              <AudioLinesIcon size={16} aria-hidden />
            </ButtonLink>
          </Tooltip>
          <Badge
            variant="pill"
            color={visibility === 'PUBLIC' ? 'green' : 'secondary'}
          >
            {visibility.charAt(0) + visibility.slice(1).toLowerCase()}
          </Badge>
          {editing ? (
            <SaveButton
              saving={saving}
              disabled={!title.trim()}
              onClick={() => void save()}
            />
          ) : null}
          <EditIconButton
            label={t('soundHeader.editDetails')}
            editing={editing}
            onClick={() => onEditingChange(!editing)}
          />
        </>
      }
      data-testid="studio-sound-social-header"
    >
      <div className="flex items-center gap-4">
        <Tooltip content={isPlaying ? 'Pause track' : 'Play track'} side="top">
          <Button
            size="icon"
            className="size-14 shrink-0 rounded-full shadow-xl"
            disabled={playBusy || notReady || hasError}
            aria-label={isPlaying ? 'Pause track' : 'Play track'}
            onClick={() => {
              if (isPlaying) {
                setPlayerStatus('paused');
              } else {
                void startPlayback();
              }
            }}
          >
            {isPlaying ? (
              <PauseIcon size={24} aria-hidden />
            ) : (
              <PlayIcon size={24} aria-hidden />
            )}
          </Button>
        </Tooltip>
        {notReady ? (
          <div className="min-w-0 flex-1">
            <TrackProcessing variant="waveform" />
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <PlayerWaveform
              trackId={`sound:${id}`}
              label={item.title}
              peaks={peaks}
              durationSec={editList?.sourceDuration ?? item.durationSec ?? 0}
              height={56}
              onSeek={(fraction) =>
                void startPlayback(
                  fraction *
                    (editList?.sourceDuration ?? item.durationSec ?? 0),
                )
              }
            />
            <div className="text-foreground-secondary mt-1 flex justify-between text-xs tabular-nums">
              <span>
                {isCurrent
                  ? `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`
                  : '0:00'}
              </span>
              <span>
                {Math.floor(
                  (editList?.sourceDuration ?? item.durationSec ?? 0) / 60,
                )}
                :
                {String(
                  Math.floor(
                    (editList?.sourceDuration ?? item.durationSec ?? 0) % 60,
                  ),
                ).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </div>
    </EntitySocialHeader>
  );
}
