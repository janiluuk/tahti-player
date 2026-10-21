import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, EmptyState, FilePicker, Input } from '@tahti-player/ui';

import {
  activateReleaseTrackVersion,
  fetchReleaseTrackVersions,
  RELEASE_TRACK_VERSION_TYPES,
  uploadReleaseTrackVersion,
  type ReleaseTrackVersion,
} from '../../../api/release-track-versions';
import type { StudioRelease } from '../../../api/studio-types';
import { StudioPanel } from '../../../components/StudioPanel';
import { usePolling } from '../../../hooks/usePolling';
import { formatDuration } from '../../../lib/playableToTrack';

type ReleaseTrack = NonNullable<StudioRelease['tracks']>[number];

const PROCESSING_POLL_MS = 10_000;

function TrackVersions({
  releaseId,
  track,
}: {
  releaseId: string;
  track: ReleaseTrack;
}) {
  const [versions, setVersions] = useState<ReleaseTrackVersion[] | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    void fetchReleaseTrackVersions(releaseId, track.id).then((result) => {
      setVersions((current) => result.data ?? current ?? []);
    });
  }, [releaseId, track.id]);

  useEffect(load, [load]);
  usePolling(
    load,
    PROCESSING_POLL_MS,
    Boolean(
      versions?.some(
        (version) =>
          version.status === 'PENDING' || version.status === 'PROCESSING',
      ),
    ),
  );

  const upload = async (files: readonly File[]) => {
    const file = files[0];
    if (!file) {
      return;
    }
    setUploading(true);
    const result = await uploadReleaseTrackVersion(
      releaseId,
      track.id,
      file,
      label,
    );
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setVersions((current) => [...(current ?? []), result.data]);
    setLabel('');
    setAdding(false);
    toast.success(
      'Version uploaded. It can be made active once it is processed.',
    );
  };

  const activate = async (versionId: string) => {
    setSwitchingId(versionId);
    const result = await activateReleaseTrackVersion(
      releaseId,
      track.id,
      versionId,
    );
    setSwitchingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setVersions(result.data);
    toast.success('Version switched.');
  };

  return (
    <li className="flex flex-col gap-2 py-3">
      <h3 className="text-sm font-semibold">
        {track.position}. {track.title}
      </h3>
      {versions === null ? null : (
        <ul
          className="flex flex-col gap-1.5"
          aria-label={`${track.title} versions`}
        >
          {versions.map((version) => (
            <li
              key={version.id}
              className="border-border flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">
                v{version.versionNumber} · {version.versionLabel}
                {version.durationSec
                  ? ` · ${formatDuration(version.durationSec)}`
                  : ''}
              </span>
              {version.isActive ? (
                <Badge variant="pill" color="green">
                  Active
                </Badge>
              ) : version.status === 'READY' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={switchingId !== null}
                  onClick={() => void activate(version.id)}
                >
                  Make active
                </Button>
              ) : (
                <Badge
                  variant="pill"
                  color={version.status === 'ERROR' ? 'red' : 'secondary'}
                >
                  {version.status === 'ERROR' ? 'Failed' : 'Processing'}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <div className="flex flex-col gap-2">
          <Input
            label="Version label"
            placeholder="Remaster 2026"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <FilePicker
            labels={{
              title: `New version of ${track.title}`,
              description: 'WAV, FLAC, MP3, AAC or AIFF',
              browse: uploading ? 'Uploading…' : 'Choose audio file',
            }}
            accept={RELEASE_TRACK_VERSION_TYPES.join(',')}
            disabled={uploading}
            onFiles={(files) => void upload(files)}
          />
          <Button
            variant="text"
            size="sm"
            className="self-start"
            disabled={uploading}
            onClick={() => setAdding(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => setAdding(true)}
        >
          Add a version
        </Button>
      )}
    </li>
  );
}

/** Audio versions per release track — pick which one listeners hear. */
export function ReleaseTrackVersionsPanel({
  releaseId,
  tracks,
}: {
  releaseId: string;
  tracks: ReleaseTrack[];
}) {
  return (
    <StudioPanel
      title="Track versions"
      description="Earlier and replacement masters of each track. The active one is what listeners hear and what gets distributed."
    >
      {tracks.length === 0 ? (
        <EmptyState
          size="sm"
          title="No tracks on this release yet"
          description="Add tracks first, then manage their versions."
        />
      ) : (
        <ul
          className="divide-border divide-y"
          data-testid="release-track-versions"
        >
          {tracks.map((track) => (
            <TrackVersions key={track.id} releaseId={releaseId} track={track} />
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}
