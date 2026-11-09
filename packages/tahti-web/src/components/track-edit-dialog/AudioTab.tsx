import {
  AudioLinesIcon,
  GaugeIcon,
  PauseIcon,
  PlayIcon,
  ScissorsIcon,
  Wand2Icon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink, Tooltip } from '@tahti-player/ui';

import type { StudioSound } from '../../api/studio-types';
import { AudioRevisionList } from '../AudioRevisionList';
import { PlayerWaveform } from '../PlayerWaveform';
import { StationIdClipForm } from './StationIdClipForm';
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
  const { t } = useTranslation('web');
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
    startPlayback,
    setPlayerStatus,
    onNormalize,
    onAutoTrim,
  } = state;

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border bg-background-secondary/40 rounded-xl border p-4">
        <p className="font-medium">{t('trackEditAudio.properties')}</p>
        <p className="text-foreground-secondary mt-1 text-sm">
          {item.embedUri
            ? t('audioTabStates.thisTrackIsEmbeddedFrom')
            : t('audioTabStates.thisTrackIsStoredAs')}
        </p>
        <p className="text-foreground-secondary mt-3 text-xs">
          {item.durationSec != null
            ? `${Math.round(item.durationSec / 60)} min · ${item.status}`
            : 'Source details are available after processing.'}
        </p>
        {!item.embedUri && item.status === 'READY' && (
          <div className="border-border mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 text-xs sm:grid-cols-3">
            <div>
              <span className="text-foreground-secondary block">
                {t('trackEditAudio.format')}
              </span>
              <span className="font-medium">
                {item.sourceFormat?.toUpperCase() ?? '—'}
              </span>
            </div>
            <div>
              <span className="text-foreground-secondary block">
                {t('trackEditAudio.sampleRate')}
              </span>
              <span className="font-medium">
                {item.sourceSampleRateHz
                  ? `${(item.sourceSampleRateHz / 1000).toLocaleString('en-US')} kHz`
                  : '—'}
              </span>
            </div>
            <div>
              <span className="text-foreground-secondary block">
                {t('trackEditAudio.bitDepth')}
              </span>
              <span className="font-medium">
                {item.sourceBitDepth ? `${item.sourceBitDepth}-bit` : '—'}
              </span>
            </div>
            <div>
              <span className="text-foreground-secondary block">
                {t('trackEditAudio.channels')}
              </span>
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
              <span className="text-foreground-secondary block">
                {t('trackEditAudio.bitrate')}
              </span>
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
            <Tooltip
              content={
                isPlaying ? t('audioTabStates.pause') : t('audioTabStates.play')
              }
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                disabled={playBusy}
                onClick={() =>
                  void (isPlaying ? setPlayerStatus('paused') : startPlayback())
                }
                aria-label={
                  isPlaying
                    ? t('audioTabStates.pause')
                    : t('audioTabStates.play')
                }
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
                quickBusy === 'normalize'
                  ? t('audioTabStates.normalizing')
                  : t('audioTabStates.normalizeAudio')
              }
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                disabled={quickBusy !== null}
                onClick={onNormalize}
                aria-label={t('trackEditAudio.normalizeAudio')}
              >
                <GaugeIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip
              content={
                quickBusy === 'trim'
                  ? t('audioTabStates.trimmingSilence')
                  : t('audioTabStates.trimSilence')
              }
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                disabled={quickBusy !== null}
                onClick={onAutoTrim}
                aria-label={t('trackEditAudio.trimSilence')}
              >
                <ScissorsIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
            <span className="bg-border mx-1 h-6 w-px" aria-hidden />
            <Tooltip
              content={t('trackEditAudio.openFullAudioEditor')}
              side="top"
            >
              <ButtonLink
                to="/studio/sounds/$id/editor"
                params={{ id: item.id }}
                size="icon-sm"
                variant="text"
                aria-label={t('trackEditAudio.openFullAudioEditor')}
              >
                <AudioLinesIcon size={16} aria-hidden />
              </ButtonLink>
            </Tooltip>
            {masteringEnabled && (
              <Tooltip
                content={t('trackEditAudio.matchToAReferenceTrack')}
                side="top"
              >
                <ButtonLink
                  to="/studio/mastering/$id"
                  params={{ id: item.id }}
                  size="icon-sm"
                  variant="text"
                  aria-label={t('trackEditAudio.matchToAReferenceTrack')}
                >
                  <Wand2Icon size={16} aria-hidden />
                </ButtonLink>
              </Tooltip>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <PlayerWaveform
              trackId={`sound:${item.id}`}
              label={item.title}
              peaks={peaks}
              durationSec={editList?.sourceDuration ?? item.durationSec ?? 0}
              height={64}
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
          {soundId && item ? (
            <StationIdClipForm
              soundId={soundId}
              durationSec={editList?.sourceDuration ?? item.durationSec ?? null}
              playheadSec={isCurrentPlayable ? currentTime : null}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
