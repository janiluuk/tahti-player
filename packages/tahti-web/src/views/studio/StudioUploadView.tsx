import { Link, useNavigate } from '@tanstack/react-router';
import { PauseIcon, PlayIcon, RadioIcon, UploadIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import {
  Button,
  EditIconLink,
  FilePicker,
  InlineError,
  InlineLoader,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchRecentBroadcasts,
  type RecentBroadcast,
} from '../../api/broadcast';
import { fetchEditorSource, uploadSoundFile } from '../../api/studio';
import { ImportJobsPanel } from '../../components/ImportJobsPanel';
import { ListingDate } from '../../components/ListingDate';
import { PageEmpty, PageError } from '../../components/PageStates';
import { RestrictionNotice } from '../../components/RestrictionNotice';
import { StudioGate } from '../../components/StudioGate';
import { WaveformSeekbar } from '../../components/tahti/WaveformSeekbar';
import {
  UPLOAD_AUDIO_ACCEPT,
  UPLOAD_AUDIO_FORMATS_LABEL,
} from '../../lib/uploadAudioFormats';
import { usePlayerStore } from '../../stores/playerStore';
import { LibrarySectionTabs } from '../LibraryView';
import { UploadSourceWidgets } from './upload/UploadSourceWidgets';

function formatRecordingDuration(seconds?: number | null): string {
  if (!seconds) {
    return i18n.t('web:library.durationUnavailable');
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function RecordedBroadcastCard({
  broadcast,
  currentId,
  currentTime,
  duration,
  status,
  loading,
  onPlay,
  onSeek,
}: {
  broadcast: RecentBroadcast;
  currentId: string | null;
  currentTime: number;
  duration: number;
  status: string;
  loading: boolean;
  onPlay: () => void;
  onSeek: (fraction: number) => void;
}) {
  const { t } = useTranslation('web');
  const playableId = `broadcast:${broadcast.id}`;
  const isCurrent = currentId === playableId;
  const isPlaying = isCurrent && status === 'playing';
  const progressDuration =
    isCurrent && duration > 0 ? duration : (broadcast.durationSec ?? 0);
  const title =
    broadcast.title || broadcast.soundTitle || t('library.recordedBroadcast');

  return (
    <li className="border-border bg-background-secondary rounded-lg border p-3">
      <div className="flex items-start gap-3">
        <Tooltip
          content={
            isPlaying ? t('library.pauseRecording') : t('library.playRecording')
          }
          side="top"
        >
          <Button
            size="icon-sm"
            variant="secondary"
            disabled={loading || !broadcast.soundId}
            onClick={onPlay}
            aria-label={
              isPlaying
                ? t('library.pauseRecordingNamed', { title })
                : t('library.playRecordingNamed', { title })
            }
          >
            {isPlaying ? (
              <PauseIcon size={14} aria-hidden />
            ) : (
              <PlayIcon size={14} aria-hidden />
            )}
          </Button>
        </Tooltip>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{title}</div>
          <div className="text-foreground-secondary truncate text-xs">
            <ListingDate value={broadcast.startedAt} /> ·{' '}
            {formatRecordingDuration(broadcast.durationSec)}
            {broadcast.soundId ? '' : ` · ${t('library.stillProcessing')}`}
          </div>
        </div>
        {broadcast.soundId ? (
          <EditIconLink
            to="/studio/sounds/$id"
            params={{ id: broadcast.soundId }}
            search={{ edit: true }}
            variant="text"
            label={t('actions.editNamed', { name: title })}
          />
        ) : null}
      </div>
      <WaveformSeekbar
        trackId={playableId}
        progress={
          progressDuration > 0 && isCurrent ? currentTime / progressDuration : 0
        }
        bars={72}
        className="mt-2 h-8"
        label={title}
        durationSec={progressDuration}
        onSeek={isCurrent && progressDuration > 0 ? onSeek : undefined}
      />
    </li>
  );
}

export function StudioUploadView() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const play = usePlayerStore((state) => state.play);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const currentId = usePlayerStore((state) => state.currentId);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const playbackStatus = usePlayerStore((state) => state.status);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<RecentBroadcast[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [recordingsError, setRecordingsError] = useState<string | null>(null);
  const [recordingsAttempt, setRecordingsAttempt] = useState(0);
  const [recordingLoadingId, setRecordingLoadingId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    void fetchRecentBroadcasts(5).then((result) => {
      if (cancelled) {
        return;
      }
      setRecordings(result.data);
      setRecordingsError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setRecordingsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [recordingsAttempt]);

  const playRecording = async (recording: RecentBroadcast) => {
    const playableId = `broadcast:${recording.id}`;
    if (currentId === playableId) {
      setStatus(playbackStatus === 'playing' ? 'paused' : 'playing');
      return;
    }
    if (!recording.soundId) {
      return;
    }
    setRecordingLoadingId(recording.id);
    const source = await fetchEditorSource(recording.soundId);
    play({
      id: playableId,
      kind: 'sound',
      title: recording.title || recording.soundTitle || 'Recorded broadcast',
      artist: 'Recorded broadcast',
      streamUrl: source.data.url,
      protocol: source.data.url.includes('.m3u8') ? 'hls' : 'https',
      durationSec: recording.durationSec,
    });
    setRecordingLoadingId(null);
  };

  const submit = async () => {
    if (!file) {
      setMessage(t('library.chooseAudioFile'));
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await uploadSoundFile({ file });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      // Land on the durable /studio/sounds/$id route rather than staying here —
      // that page polls and shows processing state, so it survives a refresh or
      // a share/bookmark of the URL in a way this ephemeral form state can't.
      void navigate({
        to: '/studio/sounds/$id',
        params: { id: result.itemId },
        search: { edit: true },
      });
    } catch {
      setMessage(t('library.couldNotUpload'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6">
        <LibrarySectionTabs active="upload" />
        <ViewShell
          title={t('library.uploadTitle')}
          classes={{ root: 'px-0 pt-0' }}
        >
          <RestrictionNotice type="UPLOAD" />
          <div className="grid grid-cols-1 gap-4 min-[391px]:grid-cols-2">
            <div className="border-accent-cyan flex min-h-48 flex-col justify-center rounded-xl border border-dashed p-5 sm:p-6">
              <FilePicker
                labels={{
                  title: t('library.chooseAudioFileTitle'),
                  description: UPLOAD_AUDIO_FORMATS_LABEL,
                  browse: file
                    ? t('library.chooseAnotherFile')
                    : t('library.chooseAudio'),
                }}
                accept={UPLOAD_AUDIO_ACCEPT}
                selectedFiles={file ? [file] : []}
                onFiles={(files) => setFile(files[0] ?? null)}
              />
              <p className="text-foreground-secondary mt-3 text-xs">
                Upload first and we’ll read the embedded title and artist
                metadata. If the file has none, its filename is used and you can
                name it in the editor afterwards. You can leave this page while
                it processes; if it can&apos;t be processed, we notify you.
              </p>
              {message && <InlineError>{message}</InlineError>}
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy || !file}
                  aria-label={t('library.uploadFile')}
                  onClick={() => void submit()}
                >
                  <UploadIcon size={16} aria-hidden className="mr-1.5" />
                  {busy ? t('library.uploading') : t('actions.upload')}
                </Button>
              </div>
            </div>

            <div className="border-border bg-background-secondary/40 rounded-xl border p-5 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                <RadioIcon size={15} aria-hidden />
                Last recorded broadcasts
              </div>
              {recordingsLoading ? (
                <InlineLoader
                  label={t('library.loadingRecordings')}
                  className="mt-4"
                />
              ) : recordingsError && recordings.length === 0 ? (
                <PageError
                  title={t('library.recordingsLoadError')}
                  description={recordingsError}
                  onRetry={() => {
                    setRecordingsLoading(true);
                    setRecordingsAttempt((n) => n + 1);
                  }}
                />
              ) : recordings.length === 0 ? (
                <PageEmpty
                  className="mt-4"
                  title={t('library.recordingsEmptyTitle')}
                  action={
                    <Link
                      to="/studio/go-live"
                      className="text-accent-cyan-strong text-sm underline-offset-2 hover:underline"
                    >
                      Go live to record one.
                    </Link>
                  }
                />
              ) : (
                <ul className="mt-4 flex flex-col gap-2">
                  {recordings.map((recording) => (
                    <RecordedBroadcastCard
                      key={recording.id}
                      broadcast={recording}
                      currentId={currentId}
                      currentTime={currentTime}
                      duration={duration}
                      status={playbackStatus}
                      loading={recordingLoadingId === recording.id}
                      onPlay={() => void playRecording(recording)}
                      onSeek={(fraction) =>
                        seekTo(
                          fraction * (duration || recording.durationSec || 0),
                        )
                      }
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>

          <ImportJobsPanel />

          <UploadSourceWidgets />

          <Link
            to="/studio/collections"
            className="text-accent-cyan-strong text-sm underline-offset-2 hover:underline"
          >
            Organise into collections →
          </Link>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
