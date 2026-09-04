import { Link } from '@tanstack/react-router';
import { Mic } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, Tooltip } from '@tahti-player/ui';

import type { PublicRadioShowEpisode } from '../api/shows';
import { isGreenRoomWindow } from '../lib/radioSchedule';

export function showDateLabel(episode: PublicRadioShowEpisode): string {
  const start = new Date(episode.startAt);
  const end = new Date(episode.endAt);
  return `${start.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} · ${start.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}–${end.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** A titled list of scheduled/recorded show episodes — shared by the artist
 * profile's "Live shows" section and the channel page's Events block. */
export function ShowEpisodeList({
  title,
  episodes,
  icon,
  channelSlug,
  username,
}: {
  title: string;
  episodes: PublicRadioShowEpisode[];
  icon: ReactNode;
  channelSlug?: string;
  username?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {episodes.map((episode) => (
          <li key={episode.id} className="flex items-start gap-3 p-3">
            <span className="text-foreground-secondary mt-0.5 shrink-0">
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {episode.title ?? episode.note ?? 'Tahti Radio show'}
              </div>
              <div className="text-foreground-secondary text-xs">
                {showDateLabel(episode)}
              </div>
              {episode.description ? (
                <p className="text-foreground-secondary mt-1 text-xs">
                  {episode.description}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {channelSlug ? (
                  <Link
                    to="/radio/show/$channelSlug"
                    params={{ channelSlug }}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Show details
                  </Link>
                ) : null}
                {episode.recording ? (
                  <a
                    href={episode.recording.channelItemUrl}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Listen to recording
                  </a>
                ) : null}
              </div>
            </div>
            {username && isGreenRoomWindow(episode) ? (
              <Link
                to="/u/$username/green-room"
                params={{ username }}
                className="shrink-0"
              >
                <Tooltip content="Green room" side="top">
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    aria-label="Open green room"
                  >
                    <Mic size={16} aria-hidden />
                  </Button>
                </Tooltip>
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
