import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { CollectionPlayer } from '@tahti-player/ui';

import { fetchCollection } from '../api/client';
import type { PublicCollection } from '../api/types';
import { collectionToPlayables } from '../lib/collectionPlayables';
import { formatDuration } from '../lib/playableToTrack';
import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';
import { PageError, PageLoading } from './PageStates';

/** A collection that plays where it is shown: play all, play a row, and
 * the playing row highlighted. Links to the full collection page. */
export function CollectionPlayerWidget({
  slug,
  limit = 5,
  kindLabel = 'Collection',
}: {
  slug: string;
  limit?: number;
  kindLabel?: string;
}) {
  const [collection, setCollection] = useState<PublicCollection | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const me = useAuthStore((state) => state.user);
  const currentId = usePlayerStore((state) => state.currentId);
  const status = usePlayerStore((state) => state.status);
  const playFromList = usePlayerStore((state) => state.playFromList);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    fetchCollection(slug)
      .then(({ data }) => {
        if (!cancelled) {
          setCollection(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  const playables = useMemo(
    () => (collection ? collectionToPlayables(collection) : []),
    [collection],
  );

  if (failed) {
    return (
      <PageError
        title="Couldn't load this collection"
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }
  if (!collection) {
    return <PageLoading />;
  }

  const isPlaying = status === 'playing' || status === 'loading';
  const owner = me?.username === collection.user.username;

  return (
    <CollectionPlayer
      title={collection.name}
      coverUrl={collection.coverUrl}
      kindLabel={kindLabel}
      trackCount={playables.length}
      tracks={playables.slice(0, limit).map((track) => ({
        id: track.id,
        title: track.title,
        durationLabel: formatDuration(track.durationSec) || undefined,
      }))}
      currentTrackId={currentId}
      isPlaying={isPlaying}
      onPlayAll={() => playFromList(playables, 0)}
      onPlayTrack={(index) => playFromList(playables, index)}
      onTogglePlayback={() => setStatus(isPlaying ? 'paused' : 'playing')}
      onEdit={
        owner
          ? () =>
              void navigate({
                to: '/studio/collections/$slug',
                params: { slug: collection.slug },
              })
          : undefined
      }
      renderShowAll={(label, children) => (
        <Link
          to="/c/$slug"
          params={{ slug: collection.slug }}
          aria-label={label}
          className="hover:bg-background-secondary rounded-lg"
        >
          {children}
        </Link>
      )}
    />
  );
}
