import { Link } from '@tanstack/react-router';
import { MessageCircleIcon, MicIcon } from 'lucide-react';

import { MediaArtwork } from '@tahti-player/ui';

import type { PublicRadioShowEpisode } from '../api/shows';

function formatDate(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
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

function EpisodeIcon({ showType }: Pick<PublicRadioShowEpisode, 'showType'>) {
  const Icon = showType === 'TALK' ? MessageCircleIcon : MicIcon;
  return (
    <Icon
      size={16}
      className="text-foreground-secondary mt-0.5 shrink-0"
      aria-hidden
    />
  );
}

function EpisodeRow({ episode }: { episode: PublicRadioShowEpisode }) {
  const title =
    episode.title ??
    episode.recording?.title ??
    episode.note ??
    'Tahti Radio show';
  const tagline = episode.note && episode.note !== title ? episode.note : null;

  return (
    <li className="flex items-start gap-3 p-3">
      {episode.coverUrl ? (
        <MediaArtwork
          size="sm"
          src={episode.coverUrl}
          alt=""
          className="bg-surface-secondary rounded text-xs font-bold"
          placeholder="♪"
        />
      ) : (
        <EpisodeIcon showType={episode.showType} />
      )}
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        {tagline ? (
          <div className="text-foreground-secondary text-sm">{tagline}</div>
        ) : null}
        <div className="text-foreground-secondary text-xs">
          {formatDate(episode.startAt, episode.endAt)}
        </div>
        {episode.description ? (
          <p className="mt-2 text-sm whitespace-pre-wrap">
            {episode.description}
          </p>
        ) : null}
        {episode.recording ? (
          <Link
            to="/t/$id"
            params={{ id: episode.recording.soundId }}
            className="text-primary mt-2 inline-block text-sm font-medium hover:underline"
          >
            Listen to the recording
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export function RadioShowEpisodeList({
  episodes,
  emptyMessage,
}: {
  episodes: PublicRadioShowEpisode[];
  emptyMessage: string;
}) {
  if (episodes.length === 0) {
    return <p className="text-foreground-secondary text-sm">{emptyMessage}</p>;
  }

  return (
    <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
      {episodes.map((episode) => (
        <EpisodeRow key={episode.id} episode={episode} />
      ))}
    </ul>
  );
}
