import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog } from '@tahti-player/ui';

import { addStudioReleaseTrack, fetchStudioReleases } from '../api/studio';
import type { StudioRelease } from '../api/studio-types';
import { PageEmpty, PageError, PageLoading } from './PageStates';

type Track = { id: string; title: string };

export function AddToReleasePanel({
  isOpen,
  tracks,
  onClose,
}: {
  isOpen: boolean;
  tracks: Track[];
  onClose: () => void;
}) {
  const [releases, setReleases] = useState<StudioRelease[] | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled = false;
    setReleases(null);
    setLoadError(null);
    void fetchStudioReleases()
      .then((res) => {
        if (cancelled) {
          return;
        }
        const reason =
          res.meta.source === 'api' ? (res.meta.reason ?? null) : null;
        if (reason) {
          setLoadError(reason);
          return;
        }
        setReleases(
          res.data.releases.filter((release) => release.state !== 'ARCHIVED'),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Could not load releases.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, attempt]);

  const addTo = (release: StudioRelease) => {
    if (addingId) {
      return;
    }
    setAddingId(release.id);
    void Promise.all(
      tracks.map((track) =>
        addStudioReleaseTrack(release.id, {
          title: track.title,
          soundId: track.id,
        }),
      ),
    ).then((results) => {
      setAddingId(null);
      const failed = results.filter((result) => !result.ok);
      if (failed.length === results.length) {
        toast.error(
          failed[0] && !failed[0].ok
            ? failed[0].error
            : 'Could not add those tracks.',
        );
        return;
      }
      if (failed.length > 0) {
        toast.error(
          `Added ${results.length - failed.length} of ${results.length} to ${release.title}.`,
        );
        return;
      }
      toast.success(
        tracks.length === 1
          ? `Added to ${release.title}.`
          : `Added ${tracks.length} tracks to ${release.title}.`,
      );
      onClose();
    });
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <Dialog.Title>Add to a release</Dialog.Title>
      <Dialog.Description>
        {tracks.length === 1
          ? tracks[0]?.title
          : `${tracks.length} selected tracks`}
      </Dialog.Description>
      <div className="mt-3 flex max-h-72 flex-col gap-1 overflow-y-auto">
        {loadError ? (
          <PageError
            title="Could not load releases"
            description={loadError}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : releases === null ? (
          <PageLoading label="Loading releases…" />
        ) : releases.length === 0 ? (
          <PageEmpty
            title="No releases yet"
            description="Create a release, then add these tracks to it."
          />
        ) : (
          releases.map((release) => (
            <Button
              key={release.id}
              variant="text"
              size="flexible"
              className="justify-start px-2"
              disabled={addingId !== null}
              onClick={() => addTo(release)}
            >
              <span className="truncate">{release.title}</span>
              <span className="text-foreground-secondary ml-auto text-xs">
                {release.type}
              </span>
            </Button>
          ))
        )}
      </div>
    </Dialog.Root>
  );
}
