import { Link } from '@tanstack/react-router';
import { ListMusicIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  fetchLiveTracklist,
  type LiveTracklistEntry,
} from '../../api/live-tracklist';
import { formatDuration } from '../../lib/playableToTrack';
import { Eyebrow } from '../tahti/Eyebrow';

const REFRESH_MS = 60_000;

export function ChannelLiveTracklist({ slug }: { slug: string }) {
  const [entries, setEntries] = useState<LiveTracklistEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      void fetchLiveTracklist(slug).then((rows) => {
        if (!cancelled) {
          setEntries(rows);
        }
      });
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [slug]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      className="border-border flex flex-col gap-2 rounded-lg border px-4 py-3"
      aria-label="Played in this broadcast"
    >
      <Eyebrow>
        <span className="inline-flex items-center gap-1.5">
          <ListMusicIcon size={13} aria-hidden />
          Played in this broadcast
        </span>
      </Eyebrow>
      <ol className="flex flex-col gap-1 text-sm">
        {entries.map((entry) => (
          <li
            key={`${entry.startSec}-${entry.title}`}
            className="flex items-baseline gap-3"
          >
            <span className="text-foreground-secondary w-14 shrink-0 font-mono text-xs tabular-nums">
              {formatDuration(entry.startSec)}
            </span>
            <span className="min-w-0 truncate">
              <span className="font-medium">{entry.title}</span>
              {entry.artistUsername ? (
                <>
                  {' · '}
                  <Link
                    to="/u/$username"
                    params={{ username: entry.artistUsername }}
                    className="text-foreground-secondary hover:underline"
                  >
                    @{entry.artistUsername}
                  </Link>
                </>
              ) : entry.artist ? (
                <span className="text-foreground-secondary">
                  {' · '}
                  {entry.artist}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
