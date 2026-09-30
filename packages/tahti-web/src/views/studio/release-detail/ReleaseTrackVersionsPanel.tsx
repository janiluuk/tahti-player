import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, EmptyState } from '@tahti-player/ui';

import {
  activateReleaseTrackVersion,
  fetchReleaseTrackVersions,
  type ReleaseTrackVersion,
} from '../../../api/release-track-versions';
import type { StudioRelease } from '../../../api/studio-types';
import { StudioPanel } from '../../../components/StudioPanel';
import { formatDuration } from '../../../lib/playableToTrack';

type ReleaseTrack = NonNullable<StudioRelease['tracks']>[number];

function TrackVersions({
  releaseId,
  track,
}: {
  releaseId: string;
  track: ReleaseTrack;
}) {
  const [versions, setVersions] = useState<ReleaseTrackVersion[] | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchReleaseTrackVersions(releaseId, track.id).then((result) => {
      if (!cancelled) {
        setVersions(result.data ?? []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [releaseId, track.id]);

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
