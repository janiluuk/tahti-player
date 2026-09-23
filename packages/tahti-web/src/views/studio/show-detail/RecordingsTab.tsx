import { Link } from '@tanstack/react-router';
import { PlayIcon } from 'lucide-react';

import { Button } from '@tahti-player/ui';

import { StudioPanel } from '../../../components/StudioPanel';
import type { ShowDetailState } from './useShowDetail';

export function RecordingsTab({ state }: { state: ShowDetailState }) {
  const { episodes } = state;
  const recordings = episodes.filter(
    (episode) => episode.source === 'broadcast',
  );

  return (
    <StudioPanel
      title="Recordings from this show"
      description="Broadcast recordings linked to this show series."
    >
      {recordings.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No recordings from this show yet.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {recordings.map((episode) => (
            <li
              key={episode.id}
              className="flex flex-wrap items-center gap-2 py-3 text-sm first:pt-0 last:pb-0"
            >
              <span className="text-foreground-secondary w-10 text-xs">
                #{episode.episodeNumber}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  to="/studio/shows/episodes/$episodeId"
                  params={{ episodeId: episode.id }}
                  className="font-medium hover:underline"
                >
                  {episode.title}
                </Link>
                <p className="text-foreground-secondary text-xs">
                  {episode.slotStartAt
                    ? new Date(episode.slotStartAt).toLocaleString()
                    : 'Recorded episode'}{' '}
                  · {episode.status}
                </p>
              </div>
              {episode.soundId ? (
                <Link to="/studio/sounds/$id" params={{ id: episode.soundId }}>
                  <Button size="sm" variant="secondary">
                    <PlayIcon size={14} aria-hidden className="mr-1.5" />
                    Play recording
                  </Button>
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}
