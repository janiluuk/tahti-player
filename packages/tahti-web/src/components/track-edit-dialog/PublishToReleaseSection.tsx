import { Link } from '@tanstack/react-router';
import { DiscIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, Select } from '@tahti-player/ui';

import { publishSoundToRelease } from '../../api/publish-to-release';
import {
  fetchSoundVersions,
  type SoundVersion,
} from '../../api/sound-versions';
import { fetchStudioReleases } from '../../api/studio';
import type { StudioRelease } from '../../api/studio-types';

const CURRENT_AUDIO = '';

/** Put this track, or one of its ready versions, on a release. */
export function PublishToReleaseSection({
  soundId,
  title,
}: {
  soundId: string;
  title: string;
}) {
  const [releases, setReleases] = useState<StudioRelease[] | null>(null);
  const [versions, setVersions] = useState<SoundVersion[]>([]);
  const [releaseId, setReleaseId] = useState('');
  const [versionId, setVersionId] = useState(CURRENT_AUDIO);
  const [trackTitle, setTrackTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<StudioRelease | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchStudioReleases(), fetchSoundVersions(soundId)]).then(
      ([releaseResult, versionResult]) => {
        if (cancelled) {
          return;
        }
        setReleases(releaseResult.data.releases);
        setVersions(
          versionResult.data.filter((version) => version.status === 'READY'),
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, [soundId]);

  if (!releases) {
    return null;
  }

  const submit = async () => {
    const release = releases.find((item) => item.id === releaseId);
    if (!release) {
      return;
    }
    setBusy(true);
    const result = await publishSoundToRelease(soundId, {
      releaseId,
      versionId: versionId || undefined,
      title: trackTitle,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setAdded(release);
    setTrackTitle('');
  };

  return (
    <div className="border-border flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <DiscIcon size={24} className="text-primary shrink-0" aria-hidden />
        <div>
          <p className="font-medium">Add to a release</p>
          <p className="text-foreground-secondary text-sm">
            Adds a copy of this track as the release&apos;s last track.
          </p>
        </div>
      </div>
      {releases.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          You don&apos;t have a release yet.{' '}
          <Link to="/studio/releases" className="underline">
            Create one in Studio → Releases
          </Link>
          .
        </p>
      ) : (
        <>
          <Select
            label="Release"
            placeholder="Choose a release"
            value={releaseId}
            onValueChange={setReleaseId}
            options={releases.map((release) => ({
              id: release.id,
              label: `${release.title} · ${release.state.toLowerCase()}`,
            }))}
          />
          {versions.length > 0 ? (
            <Select
              label="Audio"
              value={versionId}
              onValueChange={setVersionId}
              options={[
                { id: CURRENT_AUDIO, label: 'Current audio' },
                ...versions.map((version) => ({
                  id: version.id,
                  label: `v${version.versionNumber} · ${version.versionLabel}`,
                })),
              ]}
            />
          ) : null}
          <Input
            label="Track title on the release"
            placeholder={title}
            value={trackTitle}
            maxLength={200}
            onChange={(event) => setTrackTitle(event.target.value)}
          />
          <Button
            size="sm"
            className="self-start"
            disabled={busy || !releaseId}
            onClick={() => void submit()}
          >
            {busy ? 'Adding…' : 'Add to release'}
          </Button>
          {added ? (
            <p className="text-sm" role="status">
              Added to{' '}
              <Link
                to="/studio/releases/$id"
                params={{ id: added.id }}
                className="underline"
              >
                {added.title}
              </Link>
              . It&apos;s being processed there.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
