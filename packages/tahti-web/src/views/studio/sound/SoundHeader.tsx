import { Link, useNavigate } from '@tanstack/react-router';
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

import {
  Badge,
  Button,
  SaveButton,
  Tooltip,
  TrackContextMenu,
} from '@tahti-player/ui';

import { EntitySocialHeader } from '../../../components/EntitySocialHeader';
import { WaveformSeekbar } from '../../../components/tahti/WaveformSeekbar';
import type { SoundEditorState } from './useSoundEditor';

export function SoundHeader({
  id,
  state,
}: {
  id: string;
  state: SoundEditorState;
}) {
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
    tab,
    saving,
    title,
    save,
    isPlaying,
    playBusy,
    setPlayerStatus,
    startPlayback,
    peaks,
    isCurrent,
    playerDuration,
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
            <TrackContextMenu.Trigger>
              <Tooltip content="Quick edits" side="top">
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="bg-background border-border rounded-md border-(length:--border-width)"
                  disabled={notReady || hasError}
                  aria-label="Quick edits"
                >
                  <MoreHorizontalIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            </TrackContextMenu.Trigger>
            <TrackContextMenu.Content>
              <TrackContextMenu.Header title="Quick edits" />
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
          <Tooltip content="Open audio editor" side="top">
            <Link to="/studio/sounds/$id/editor" params={{ id }}>
              <Button
                variant="secondary"
                size="icon-sm"
                className="bg-background border-border rounded-md border-(length:--border-width)"
                disabled={notReady || hasError}
                aria-label="Open audio editor"
              >
                <AudioLinesIcon size={16} aria-hidden />
              </Button>
            </Link>
          </Tooltip>
          <Badge
            variant="pill"
            color={visibility === 'PUBLIC' ? 'green' : 'secondary'}
          >
            {visibility.charAt(0) + visibility.slice(1).toLowerCase()}
          </Badge>
          {tab === 'details' ? (
            <SaveButton
              saving={saving}
              disabled={!title.trim()}
              onClick={() => void save()}
            />
          ) : null}
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
        <div className="min-w-0 flex-1">
          <WaveformSeekbar
            trackId={id}
            peaks={peaks}
            bars={peaks.length || 180}
            progress={
              isCurrent && playerDuration > 0 ? currentTime / playerDuration : 0
            }
            className="h-14"
            onSeek={(fraction) =>
              void startPlayback(
                fraction * (editList?.sourceDuration ?? item.durationSec ?? 0),
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
      </div>
    </EntitySocialHeader>
  );
}
