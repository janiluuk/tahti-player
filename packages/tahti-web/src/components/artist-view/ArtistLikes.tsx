import { HeartIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchUserLikes, likedTrackToPlayable } from '../../api/likes';
import type { TahtiPlayable } from '../../api/types';
import { PlayableTrackTable } from '../PlayableTrackTable';
import { Eyebrow } from '../tahti/Eyebrow';

export function ArtistLikes({ username }: { username: string }) {
  const [items, setItems] = useState<TahtiPlayable[]>([]);

  useEffect(() => {
    let cancelled = false;
    setItems([]);
    void fetchUserLikes(username).then((result) => {
      if (cancelled || !result.showLikes) {
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
  }, [username]);

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
