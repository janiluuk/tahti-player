import { Link } from '@tanstack/react-router';
import { Repeat2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { MediaArtwork } from '@tahti-player/ui';

import { fetchUserReposts, type RepostedTrack } from '../../api/user-reposts';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { Eyebrow } from '../tahti/Eyebrow';

export function ArtistReposts({ username }: { username: string }) {
  const [items, setItems] = useState<RepostedTrack[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchUserReposts(username).then((result) => {
      if (!cancelled) {
        setItems(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Reposts">
      <Eyebrow>
        <span className="inline-flex items-center gap-1.5">
          <Repeat2Icon size={13} aria-hidden />
          Reposts
        </span>
      </Eyebrow>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 text-sm">
            <MediaArtwork
              size="thumb"
              src={item.bannerUrl ?? placeholderArtworkUrl(item.id)}
              alt=""
            />
            <div className="min-w-0 flex-1">
              <Link
                to="/t/$id"
                params={{ id: item.id }}
                className="block truncate font-medium hover:underline"
              >
                {item.title}
              </Link>
              <Link
                to="/u/$username"
                params={{ username: item.artistUsername }}
                className="text-foreground-secondary block truncate text-xs hover:underline"
              >
                {item.artistDisplayName}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
