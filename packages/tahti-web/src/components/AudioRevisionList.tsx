import { PauseIcon, PlayIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  FilePicker,
  Input,
  Loader,
  Select,
} from '@tahti-player/ui';

import {
  activateSoundVersion,
  fetchSoundVersions,
  fetchVersionDownloadUrl,
  uploadSoundVersion,
  type SoundVersion,
} from '../api/sound-versions';
import { usePlayerStore } from '../stores/playerStore';
import { Eyebrow } from './tahti/Eyebrow';

const REVISION_POLL_MS = 4000;

export function versionPlayableId(soundId: string, versionId: string): string {
  return `sound-version:${soundId}:${versionId}`;
}

function formatRevisionMeta(version: SoundVersion): string {
  const parts = [version.status];
  if (version.durationSec) {
    parts.push(`${Math.round(version.durationSec)}s`);
  }
  if (version.sourceFormat) {
    parts.push(version.sourceFormat.toUpperCase());
  }
  if (version.sourceBitDepth) {
    parts.push(`${version.sourceBitDepth}-bit`);
  }
  if (version.sourceSampleRateHz) {
    parts.push(`${(version.sourceSampleRateHz / 1000).toFixed(1)} kHz`);
  }
  if (version.sourceChannels) {
    parts.push(version.sourceChannels === 1 ? 'mono' : 'stereo');
  }
  parts.push(new Date(version.createdAt).toLocaleString());
  return parts.join(' · ');
}

type AudioRevisionListProps = {
  soundId: string;
  trackTitle: string;
  artistName: string;
  coverUrl?: string | null;
  reloadToken?: number;
};

export function AudioRevisionList({
  soundId,
  trackTitle,
  artistName,
  coverUrl,
  reloadToken = 0,
}: AudioRevisionListProps) {
  const currentId = usePlayerStore((state) => state.currentId);
  const playerStatus = usePlayerStore((state) => state.status);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const play = usePlayerStore((state) => state.play);
  const setPlayerStatus = usePlayerStore((state) => state.setStatus);
  const seekTo = usePlayerStore((state) => state.seekTo);

  const [versions, setVersions] = useState<SoundVersion[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [versionBusy, setVersionBusy] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');

  const load = useCallback(() => {
    void fetchSoundVersions(soundId).then((result) => {
      setVersions(result.data.map((version) => ({ ...version })));
    });
  }, [soundId]);

  useEffect(() => {
    load();
  }, [load, reloadToken]);

  const processing = versions.some(
    (version) =>
      version.status === 'PENDING' || version.status === 'PROCESSING',
  );

  useEffect(() => {
    if (!processing) {
      return;
    }
    const timer = window.setInterval(load, REVISION_POLL_MS);
    return () => window.clearInterval(timer);
  }, [processing, load]);

  const readyVersions = useMemo(
    () => versions.filter((version) => version.status === 'READY'),
    [versions],
  );

  const resolvedCompareA =
    compareA && readyVersions.some((version) => version.id === compareA)
      ? compareA
      : (readyVersions[0]?.id ?? '');
  const resolvedCompareB =
    compareB && readyVersions.some((version) => version.id === compareB)
      ? compareB
      : (readyVersions[readyVersions.length - 1]?.id ?? '');

  const previewVersion = async (version: SoundVersion, keepTime: boolean) => {
    const playableId = versionPlayableId(soundId, version.id);
    if (currentId === playableId && playerStatus === 'playing') {
      setPlayerStatus('paused');
      return;
    }
    if (currentId === playableId) {
      setPlayerStatus('playing');
      return;
    }
    const resumeAt = keepTime ? currentTime : undefined;
    setPreviewBusy(version.id);
    const result = await fetchVersionDownloadUrl(soundId, version.id);
    setPreviewBusy(null);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    play({
      id: playableId,
      kind: 'sound',
      title: `${trackTitle} · v${version.versionNumber}`,
      artist: artistName,
      coverUrl: coverUrl ?? undefined,
      streamUrl: result.url,
      protocol: result.url.includes('.m3u8') ? 'hls' : 'https',
      durationSec: version.durationSec,
    });
    if (resumeAt) {
      seekTo(resumeAt);
    }
  };

  const onActivate = (versionId: string) => {
    setVersionBusy(versionId);
    void activateSoundVersion(soundId, versionId).then((result) => {
      setVersionBusy(null);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(null);
      setVersions(result.data.map((version) => ({ ...version })));
    });
  };

  const onDownload = (versionId: string) => {
    void fetchVersionDownloadUrl(soundId, versionId).then((result) => {
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      const link = document.createElement('a');
      link.href = result.url;
      link.download = `v-${versionId}`;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  };

  const onSaveRevision = async () => {
    if (!file) {
      return;
    }
    setUploading(true);
    setMessage(null);
    const result = await uploadSoundVersion(
      soundId,
      file,
      label.trim() || file.name.replace(/\.[^.]+$/, ''),
    );
    setUploading(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setFile(null);
    setLabel('');
    setMessage(
      `Saved as v${result.versionNumber} — not live yet. Preview it, then use this version when you want it public.`,
    );
    load();
  };

  const versionA = versions.find((version) => version.id === resolvedCompareA);
  const versionB = versions.find((version) => version.id === resolvedCompareB);
  const listed = [...versions].reverse();
  const canCompare = readyVersions.length >= 2;

  return (
    <section className="flex flex-col gap-4" data-testid="audio-revision-list">
      <div>
        <h2>
          <Eyebrow>Revisions</Eyebrow>
        </h2>
        <p className="text-foreground-secondary mt-1 text-xs">
          Every upload, editor save, or quick fix is a new audio file. Preview
          and compare before making one live.
        </p>
      </div>

      <div className="border-border flex flex-col gap-3 rounded-lg border p-3">
        <FilePicker
          labels={{
            title: 'Save a new audio revision',
            description: 'WAV · FLAC · AIFF · MP3 · M4A · OGG',
            browse: file ? 'Choose another file' : 'Choose audio file',
          }}
          accept="audio/*,.flac,.wav,.mp3,.aiff"
          selectedFiles={file ? [file] : []}
          onFiles={(files) => {
            const next = files[0] ?? null;
            setFile(next);
            if (next && !label.trim()) {
              setLabel(next.name.replace(/\.[^.]+$/, ''));
            }
          }}
        />
        <Input
          label="Revision name"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <Button
          size="sm"
          disabled={!file || uploading}
          onClick={() => void onSaveRevision()}
        >
          {uploading ? 'Saving revision…' : 'Save as new revision'}
        </Button>
      </div>

      {canCompare && versionA && versionB ? (
        <div
          className="border-border flex flex-col gap-3 rounded-lg border p-3"
          data-testid="revision-compare"
        >
          <p className="text-xs font-semibold tracking-wide uppercase">
            Compare
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Version A"
              value={resolvedCompareA}
              onValueChange={setCompareA}
              options={readyVersions.map((version) => ({
                id: version.id,
                label: `v${version.versionNumber} — ${version.versionLabel}`,
              }))}
            />
            <Select
              label="Version B"
              value={resolvedCompareB}
              onValueChange={setCompareB}
              options={readyVersions.map((version) => ({
                id: version.id,
                label: `v${version.versionNumber} — ${version.versionLabel}`,
              }))}
            />
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <span className="font-medium">A · {versionA.versionLabel}</span>
              <span className="text-foreground-secondary mt-1 block text-xs">
                {formatRevisionMeta(versionA)}
              </span>
            </p>
            <p>
              <span className="font-medium">B · {versionB.versionLabel}</span>
              <span className="text-foreground-secondary mt-1 block text-xs">
                {formatRevisionMeta(versionB)}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={previewBusy !== null}
              onClick={() => void previewVersion(versionA, false)}
            >
              Play A
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={previewBusy !== null}
              onClick={() => void previewVersion(versionB, false)}
            >
              Play B
            </Button>
            <Button
              size="sm"
              disabled={
                previewBusy !== null || resolvedCompareA === resolvedCompareB
              }
              onClick={() => {
                const playingA =
                  currentId === versionPlayableId(soundId, versionA.id);
                const next = playingA ? versionB : versionA;
                void previewVersion(next, true);
              }}
            >
              Switch A/B
            </Button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="text-foreground-secondary text-xs" role="status">
          {message}
        </p>
      ) : null}

      {listed.length === 0 ? (
        <p className="text-foreground-secondary text-sm">No revisions yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {listed.map((version) => {
            const playableId = versionPlayableId(soundId, version.id);
            const isCurrent = currentId === playableId;
            const isPlaying =
              isCurrent &&
              (playerStatus === 'playing' || playerStatus === 'loading');
            return (
              <li
                key={version.id}
                className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    v{version.versionNumber} — {version.versionLabel}
                    {version.isActive ? (
                      <Badge variant="pill" color="green">
                        Active
                      </Badge>
                    ) : null}
                    {version.status !== 'READY' ? (
                      <Badge variant="pill" color="orange">
                        {version.status}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-foreground-secondary text-xs">
                    {formatRevisionMeta(version)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {version.status === 'READY' ? (
                    <Button
                      size="sm"
                      variant="text"
                      disabled={previewBusy === version.id}
                      aria-label={
                        isPlaying
                          ? `Pause v${version.versionNumber}`
                          : `Preview v${version.versionNumber}`
                      }
                      onClick={() => void previewVersion(version, false)}
                    >
                      {previewBusy === version.id ? (
                        <Loader size="sm" />
                      ) : isPlaying ? (
                        <PauseIcon size={14} aria-hidden className="mr-1.5" />
                      ) : (
                        <PlayIcon size={14} aria-hidden className="mr-1.5" />
                      )}
                      {isPlaying ? 'Pause' : 'Preview'}
                    </Button>
                  ) : null}
                  {version.status === 'READY' ? (
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => onDownload(version.id)}
                    >
                      Download
                    </Button>
                  ) : null}
                  {!version.isActive && version.status === 'READY' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={versionBusy === version.id}
                      onClick={() => onActivate(version.id)}
                    >
                      {versionBusy === version.id
                        ? 'Switching…'
                        : 'Use this version'}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
