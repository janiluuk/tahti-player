import { Badge } from '@tahti-player/ui';

import type { ListeningPartyTrack } from '../../api/listening-parties';
import type { ListeningPartyClock } from '../../hooks/useListeningPartyTimeline';
import { formatDuration } from '../../lib/playableToTrack';
import { Eyebrow } from '../tahti/Eyebrow';

/** The release in play order, the playing track highlighted with its
 * elapsed time, tracks already played dimmed. */
export function ListeningPartyTracklist({
  tracks,
  clock,
}: {
  tracks: ListeningPartyTrack[];
  clock: ListeningPartyClock;
}) {
  const ordered = [...tracks].sort((a, b) => a.position - b.position);
  const current = clock.nowPlaying;
  return (
    <section aria-label="Tracklist" className="flex flex-col gap-3">
      <Eyebrow>Tracklist</Eyebrow>
      <ol className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {ordered.map((track) => {
          const playing = current?.trackId === track.id;
          const played =
            clock.state === 'ENDED' ||
            (current !== null && track.position < current.position);
          return (
            <li
              key={track.id}
              aria-current={playing ? 'true' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm ${
                playing ? 'bg-primary/10' : ''
              } ${played ? 'text-foreground-secondary' : ''}`}
            >
              <span className="text-foreground-secondary w-6 shrink-0 text-right tabular-nums">
                {track.position}
              </span>
              <span
                className={`min-w-0 flex-1 truncate ${playing ? 'font-semibold' : ''}`}
              >
                {track.title}
              </span>
              {playing ? (
                <Badge variant="pill" color="green">
                  Now playing
                </Badge>
              ) : null}
              <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
                {playing && current
                  ? `${formatDuration(current.offsetSec)} / ${formatDuration(track.durationSec)}`
                  : formatDuration(track.durationSec)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
