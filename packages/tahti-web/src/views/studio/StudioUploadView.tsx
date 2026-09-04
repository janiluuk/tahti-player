import { Link, useNavigate } from '@tanstack/react-router';
import {
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlugIcon,
  RadioIcon,
  UploadIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  Button,
  Card,
  CardGrid,
  Dialog,
  FilePicker,
  Loader,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchRecentBroadcasts,
  type RecentBroadcast,
} from '../../api/broadcast';
import type { MockOauthId } from '../../api/mock-session';
import { connectIntegrationMock, type IntegrationId } from '../../api/sources';
import { fetchEditorSource, uploadSoundFile } from '../../api/studio';
import { SourceServiceIcon } from '../../components/SourceServiceIcon';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { WaveformSeekbar } from '../../components/tahti/WaveformSeekbar';
import {
  importSourcePlugins,
  type ImportSourcePlugin,
} from '../../plugins/import-sources';
import { useAuthStore } from '../../stores/authStore';
import { usePlayerStore } from '../../stores/playerStore';

const ENABLED_SOURCES_STORAGE_KEY = 'tahti-web-enabled-sources';
const UPLOAD_SOURCES = importSourcePlugins.filter(
  (source) => source.id !== 'upload' && source.id !== 'stash',
);

function UploadSourceWidgets() {
  const user = useAuthStore((state) => state.user);
  const [statuses, setStatuses] = useState<
    Partial<
      Record<
        IntegrationId,
        Awaited<ReturnType<ImportSourcePlugin['checkStatus']>>
      >
    >
  >({});
  const [enabledIds, setEnabledIds] = useState<Set<IntegrationId>>(new Set());
  const [selectedId, setSelectedId] = useState<IntegrationId | null>(null);

  useEffect(() => {
    void Promise.all(
      UPLOAD_SOURCES.map(
        async (source) => [source.id, await source.checkStatus()] as const,
      ),
    ).then((entries) => setStatuses(Object.fromEntries(entries)));
    const storageKey = user
      ? `${ENABLED_SOURCES_STORAGE_KEY}:${user.id}`
      : ENABLED_SOURCES_STORAGE_KEY;
    const stored =
      typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem(storageKey);
    if (stored) {
      try {
        const ids = JSON.parse(stored) as unknown;
        setEnabledIds(new Set(Array.isArray(ids) ? ids : []));
      } catch {
        setEnabledIds(new Set());
      }
    }
  }, [user]);

  const selected = UPLOAD_SOURCES.find((source) => source.id === selectedId);
  const selectedStatus = selectedId ? statuses[selectedId]?.data : undefined;
  const toggleEnabled = (id: IntegrationId) => {
    setEnabledIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      const storageKey = user
        ? `${ENABLED_SOURCES_STORAGE_KEY}:${user.id}`
        : ENABLED_SOURCES_STORAGE_KEY;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      }
      return next;
    });
  };

  return (
    <section aria-labelledby="source-widgets-title">
      <h2
        id="source-widgets-title"
        className="text-foreground-secondary mb-3 text-xs font-semibold tracking-wide uppercase"
      >
        Import sources
      </h2>
      <CardGrid className="grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
        {UPLOAD_SOURCES.map((source) => {
          const status = statuses[source.id]?.data;
          const enabled = enabledIds.has(source.id);
          const configured = Boolean(status?.configured);
          return (
            <Card
              key={source.id}
              title={source.name}
              subtitle={
                enabled && configured
                  ? 'Enabled'
                  : !configured
                    ? 'Needs setup'
                    : 'Disabled'
              }
              image={<SourceServiceIcon id={source.id} />}
              className={
                !enabled || !configured ? 'opacity-60 grayscale' : undefined
              }
              onClick={() => setSelectedId(source.id)}
            />
          );
        })}
      </CardGrid>
      {selected && (
        <Dialog.Root
          isOpen
          onClose={() => setSelectedId(null)}
          className="max-w-lg"
        >
          <Dialog.Title>Configure {selected.name}</Dialog.Title>
          <Dialog.Description>{selected.description}</Dialog.Description>
          <div className="mt-4 flex flex-col gap-3">
            <div className="border-border flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="pill"
                  color={selectedStatus?.configured ? 'green' : 'secondary'}
                >
                  {selectedStatus?.configured ? 'Configured' : 'Needs setup'}
                </Badge>
                <span className="text-foreground-secondary text-sm">
                  {enabledIds.has(selected.id) ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <Toggle
                label={
                  enabledIds.has(selected.id)
                    ? 'Disable source'
                    : 'Enable source'
                }
                checked={enabledIds.has(selected.id)}
                disabled={!selectedStatus?.configured}
                onChange={(checked) => {
                  if (checked !== enabledIds.has(selected.id)) {
                    toggleEnabled(selected.id);
                  }
                }}
              />
            </div>
            {selected.kind === 'oauth' && selected.oauthUrl ? (
              import.meta.env.VITE_FORCE_MOCK === '1' ? (
                <Button
                  size="sm"
                  disabled={!user}
                  onClick={() => {
                    void connectIntegrationMock(
                      selected.id as MockOauthId,
                    ).then(() => {
                      void selected.checkStatus().then((result) =>
                        setStatuses((current) => ({
                          ...current,
                          [selected.id]: result,
                        })),
                      );
                    });
                  }}
                >
                  <PlugIcon size={16} aria-hidden className="mr-1.5" />
                  {selectedStatus?.connected ? 'Reconnect' : 'Connect'}
                </Button>
              ) : (
                <a href={selected.oauthUrl}>
                  <Button size="sm" disabled={!user}>
                    <PlugIcon size={16} aria-hidden className="mr-1.5" />
                    {selectedStatus?.connected ? 'Reconnect' : 'Connect'}
                  </Button>
                </a>
              )
            ) : (
              <p className="text-foreground-secondary text-sm">
                This source is ready without an external connection.
              </p>
            )}
          </div>
          <Dialog.Actions>
            <Dialog.Close>Done</Dialog.Close>
          </Dialog.Actions>
        </Dialog.Root>
      )}
    </section>
  );
}

function formatRecordingDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRecordingDuration(seconds?: number | null): string {
  if (!seconds) {
    return 'Duration unavailable';
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
  const playableId = `broadcast:${broadcast.id}`;
  const isCurrent = currentId === playableId;
  const isPlaying = isCurrent && status === 'playing';
  const progressDuration =
    isCurrent && duration > 0 ? duration : (broadcast.durationSec ?? 0);
  const title = broadcast.title || broadcast.soundTitle || 'Recorded broadcast';

  return (
    <li className="border-border bg-background-secondary rounded-lg border p-3">
      <div className="flex items-start gap-3">
        <Tooltip
          content={isPlaying ? 'Pause recording' : 'Play recording'}
          side="top"
        >
          <Button
            size="icon-sm"
            variant="secondary"
            disabled={loading || !broadcast.soundId}
            onClick={onPlay}
            aria-label={`${isPlaying ? 'Pause' : 'Play'} ${title}`}
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
            {formatRecordingDate(broadcast.startedAt)} ·{' '}
            {formatRecordingDuration(broadcast.durationSec)}
          </div>
        </div>
        {broadcast.soundId ? (
          <Tooltip content="Edit recording" side="top">
            <Link to="/studio/sounds/$id" params={{ id: broadcast.soundId }}>
              <Button
                size="icon-sm"
                variant="text"
                aria-label={`Edit ${title}`}
              >
                <PencilIcon size={14} aria-hidden />
              </Button>
            </Link>
          </Tooltip>
        ) : null}
      </div>
      <WaveformSeekbar
        trackId={playableId}
        progress={
          progressDuration > 0 && isCurrent ? currentTime / progressDuration : 0
        }
        bars={72}
        className="mt-2 h-8"
        onSeek={isCurrent && progressDuration > 0 ? onSeek : undefined}
      />
    </li>
  );
}

export function StudioUploadView() {
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
  const [recordingLoadingId, setRecordingLoadingId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    void fetchRecentBroadcasts(5).then((result) => {
      setRecordings(result.data);
      setRecordingsLoading(false);
    });
  }, []);

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
      kind: 'archive',
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
      setMessage('Choose an audio file.');
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await uploadSoundFile({ file });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    // Land on the durable /studio/sounds/$id route rather than staying here —
    // that page polls and shows processing state, so it survives a refresh or
    // a share/bookmark of the URL in a way this ephemeral form state can't.
    void navigate({ to: '/studio/sounds/$id', params: { id: result.itemId } });
  };

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6">
        <StudioNav current="/library/upload" />
        <ViewShell
          title="Upload"
          subtitle="Add music from a file or source."
          classes={{ root: 'px-0 pt-0' }}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border-accent-cyan flex min-h-48 flex-col justify-center rounded-xl border border-dashed p-5 sm:p-6">
              <FilePicker
                labels={{
                  title: 'Choose audio file',
                  description: 'FLAC · WAV · AIFF · MP3 · M4A · OGG · max 4 GB',
                  browse: file ? 'Choose another file' : 'Choose audio',
                }}
                accept="audio/*,.flac,.wav,.mp3,.aiff"
                selectedFiles={file ? [file] : []}
                onFiles={(files) => setFile(files[0] ?? null)}
              />
              <p className="text-foreground-secondary mt-3 text-xs">
                Upload first and we’ll read the embedded title and artist
                metadata. If the file has none, its filename is used and you can
                name it in the editor afterwards.
              </p>
              {message && (
                <p className="text-accent-red text-sm" role="alert">
                  {message}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy || !file}
                  aria-label="Upload file"
                  onClick={() => void submit()}
                >
                  <UploadIcon size={16} aria-hidden className="mr-1.5" />
                  {busy ? 'Uploading…' : 'Upload'}
                </Button>
              </div>
            </div>

            <div className="border-accent-green rounded-xl border p-5 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                <RadioIcon size={15} aria-hidden />
                Last recorded broadcasts
              </div>
              {recordingsLoading ? (
                <div className="mt-4 flex items-center gap-2">
                  <Loader size="sm" />
                  <span className="text-foreground-secondary text-sm">
                    Loading recordings…
                  </span>
                </div>
              ) : recordings.length === 0 ? (
                <p className="text-foreground-secondary mt-4 text-sm">
                  No recordings yet.{' '}
                  <Link
                    to="/studio/go-live"
                    className="text-accent-cyan underline-offset-2 hover:underline"
                  >
                    Go live to record one.
                  </Link>
                </p>
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

          <UploadSourceWidgets />

          <Link
            to="/studio/collections"
            className="text-accent-cyan text-sm underline-offset-2 hover:underline"
          >
            Organise into collections →
          </Link>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
