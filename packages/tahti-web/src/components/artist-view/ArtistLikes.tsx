import { HeartIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchUserLikes, likedTrackToPlayable } from '../../api/likes';
import type { TahtiPlayable } from '../../api/types';
import { PageError } from '../PageStates';
import { PlayableTrackTable } from '../PlayableTrackTable';
import { Eyebrow } from '../tahti/Eyebrow';

export function ArtistLikes({ username }: { username: string }) {
  const [items, setItems] = useState<TahtiPlayable[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setItems([]);
    setLoadError(null);
    void fetchUserLikes(username).then((result) => {
      if (cancelled) {
        return;
      }
      const reason =
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null;
      if (reason) {
        setLoadError(reason);
        return;
      }
      if (!result.showLikes) {
        return;
      }
      setItems(
        result.data.flatMap((track) => {
          const playable = likedTrackToPlayable(track);
          return playable ? [playable] : [];
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [username, reloadKey]);

  if (loadError) {
    return (
      <PageError
        title="Could not load liked tracks"
        description={loadError}
        onRetry={() => setReloadKey((key) => key + 1)}
      />
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Liked tracks">
      <Eyebrow>
        <span className="inline-flex items-center gap-1.5">
          <HeartIcon size={13} aria-hidden />
          Liked tracks
        </span>
      </Eyebrow>
      <PlayableTrackTable items={items} playAll={false} compactActions />
    </section>
  );
}
