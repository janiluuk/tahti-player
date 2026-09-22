import { Link } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  GaugeIcon,
  PauseIcon,
  PlayIcon,
  ScissorsIcon,
  Wand2Icon,
} from 'lucide-react';

import { Button, Tooltip } from '@tahti-player/ui';

import type { StudioSound } from '../../api/studio-types';
import { AudioRevisionList } from '../AudioRevisionList';
import { WaveformSeekbar } from '../tahti/WaveformSeekbar';
import type { TrackEditDialogState } from './useTrackEditDialog';

function formatTime(sec: number): string {
  if (!Number.isFinite(sec)) {
    return '0:00';
  }
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioTab({
  soundId,
  item,
  state,
}: {
  soundId: string;
  item: StudioSound;
  state: TrackEditDialogState;
}) {
  const {
    masteringEnabled,
    form,
    editList,
    peaks,
    quickBusy,
    revisionTick,
    playBusy,
    isCurrentPlayable,
    isPlaying,
    currentTime,
    playerDuration,
    startPlayback,
    setPlayerStatus,
    onNormalize,
    onAutoTrim,
  } = state;

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border bg-background-secondary/40 rounded-xl border p-4">
        <p className="font-medium">Properties</p>
        <p className="text-foreground-secondary mt-1 text-sm">
          {item.embedUri
            ? 'This track is embedded from its original source.'
            : 'This track is stored as Tahti audio.'}
        </p>
        <p className="text-foreground-secondary mt-3 text-xs">
          {item.durationSec != null
            ? `${Math.round(item.durationSec / 60)} min · ${item.status}`
            : 'Source details are available after processing.'}
        </p>
        {!item.embedUri && item.status === 'READY' && (
          <div className="border-border mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 text-xs sm:grid-cols-3">
            <div>
              <span className="text-foreground-secondary block">Format</span>
              <span className="font-medium">
                {item.sourceFormat?.toUpperCase() ?? '—'}
              </span>
            </div>
            <div>
              <span className="text-foreground-secondary block">
                Sample rate
              </span>
              <span className="font-medium">
                {item.sourceSampleRateHz
                  ? `${(item.sourceSampleRateHz / 1000).toLocaleString('en-US')} kHz`
                  : '—'}
              </span>
            </div>
            <div>
              <span className="text-foreground-secondary block">Bit depth</span>
              <span className="font-medium">
                {item.sourceBitDepth ? `${item.sourceBitDepth}-bit` : '—'}
              </span>
            </div>
            <div>
              <span className="text-foreground-secondary block">Channels</span>
              <span className="font-medium">
                {item.sourceChannels === 1
                  ? 'Mono'
                  : item.sourceChannels === 2
                    ? 'Stereo'
                    : item.sourceChannels
                      ? `${item.sourceChannels} channels`
                      : '—'}
              </span>
            </div>
            <div>
              <span className="text-foreground-secondary block">Bitrate</span>
              <span className="font-medium">
                {item.sourceBitrateKbps
                  ? `${item.sourceBitrateKbps} kbps`
                  : item.sourceFormat?.toUpperCase() === 'FLAC'
                    ? 'Lossless'
                    : '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {!item.embedUri && (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <Tooltip content={isPlaying ? 'Pause' : 'Play'} side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                disabled={playBusy}
                onClick={() =>
                  void (isPlaying ? setPlayerStatus('paused') : startPlayback())
                }
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <PauseIcon size={16} aria-hidden />
                ) : (
                  <PlayIcon size={16} aria-hidden />
                )}
              </Button>
            </Tooltip>
            <span className="bg-border mx-1 h-6 w-px" aria-hidden />
            <Tooltip
              content={
                quickBusy === 'normalize' ? 'Normalizing…' : 'Normalize audio'
              }
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                disabled={quickBusy !== null}
                onClick={onNormalize}
                aria-label="Normalize audio"
              >
                <GaugeIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip
              content={
                quickBusy === 'trim' ? 'Trimming silence…' : 'Trim silence'
              }
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                disabled={quickBusy !== null}
                onClick={onAutoTrim}
                aria-label="Trim silence"
              >
                <ScissorsIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            <span className="bg-border mx-1 h-6 w-px" aria-hidden />
            <Link to="/studio/sounds/$id/editor" params={{ id: item.id }}>
              <Tooltip content="Open full audio editor" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label="Open full audio editor"
                >
                  <AudioLinesIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            </Link>
            {masteringEnabled && (
              <Link to="/studio/mastering/$id" params={{ id: item.id }}>
                <Tooltip content="Match to a reference track" side="top">
                  <Button
                    size="icon-sm"
                    variant="text"
                    aria-label="Match to a reference track"
                  >
                    <Wand2Icon size={16} aria-hidden />
                  </Button>
                </Tooltip>
              </Link>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <WaveformSeekbar
              trackId={item.id}
              peaks={peaks}
              bars={peaks.length || 180}
              progress={
                isCurrentPlayable && playerDuration > 0
                  ? currentTime / playerDuration
                  : 0
              }
              className="h-16"
              onSeek={(fraction) =>
                void startPlayback(
                  fraction *
                    (editList?.sourceDuration ?? item.durationSec ?? 0),
                )
              }
            />
            <div className="text-foreground-secondary flex justify-between text-xs tabular-nums">
              <span>
                {isCurrentPlayable ? formatTime(currentTime) : '0:00'}
              </span>
              <span>
                {formatTime(editList?.sourceDuration ?? item.durationSec ?? 0)}
              </span>
            </div>
          </div>

          {soundId && item ? (
            <AudioRevisionList
              soundId={soundId}
              trackTitle={form.title || item.title}
              artistName={form.artistName || item.artistName || ''}
              coverUrl={form.bannerUrl || item.bannerUrl}
              reloadToken={revisionTick}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
