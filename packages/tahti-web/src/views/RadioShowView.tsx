import { Link } from '@tanstack/react-router';
import {
  CalendarIcon,
  MessageCircleIcon,
  MicIcon,
  RadioIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  ButtonLink,
  MediaArtwork,
  SectionShell,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchPublicRadioShow,
  fetchRadioShowNowPlaying,
  fetchRadioShowUpcoming,
  type PublicRadioShow,
  type PublicRadioShowEpisode,
  type RadioShowNowPlayingTrack,
  type RadioShowUpcomingTrack,
} from '../api/shows';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { PageFrame } from '../components/PageHeader';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { usePolling } from '../hooks/usePolling';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { isGreenRoomWindow } from '../lib/radioSchedule';

const NOW_PLAYING_POLL_MS = 30_000;

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

function EpisodeList({
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
        <li key={episode.id} className="flex items-start gap-3 p-3">
          {episode.showType === 'TALK' ? (
            <MessageCircleIcon
              size={16}
              className="text-foreground-secondary mt-0.5 shrink-0"
              aria-hidden
            />
          ) : (
            <MicIcon
              size={16}
              className="text-foreground-secondary mt-0.5 shrink-0"
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-medium">
              {episode.title ?? episode.note ?? 'Tahti Radio show'}
            </div>
            <div className="text-foreground-secondary text-xs">
              {formatDate(episode.startAt, episode.endAt)}
            </div>
            {episode.description ? (
              <p className="mt-2 text-sm">{episode.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function NowPlayingSection({
  track,
  upcoming,
}: {
  track: RadioShowNowPlayingTrack | null;
  upcoming: RadioShowUpcomingTrack[];
}) {
  if (!track && upcoming.length === 0) {
    return null;
  }

  return (
    <SectionShell title="Now playing">
      <div className="flex flex-col gap-3">
        {track ? (
          <div className="flex min-w-0 items-center gap-3">
            <MediaArtwork
              size="md"
              src={track.artworkUrl}
              alt=""
              className="bg-surface-secondary rounded-lg text-sm font-bold"
              placeholder="♪"
            />
            <div className="min-w-0">
              <Eyebrow tone="green">On air</Eyebrow>
              <div className="text-foreground truncate text-lg font-bold tracking-tight">
                {track.title}
              </div>
              <div className="text-foreground-secondary truncate text-sm">
                {track.artistName}
              </div>
            </div>
          </div>
        ) : null}
        {upcoming.length > 0 ? (
          <div>
            <div className="text-foreground-secondary mb-2 text-xs font-semibold uppercase">
              Up next
            </div>
            <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
              {upcoming.map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-3">
                  <MediaArtwork
                    size="sm"
                    src={item.artworkUrl}
                    alt=""
                    className="bg-surface-secondary rounded text-xs font-bold"
                    placeholder="♪"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {item.title}
                    </div>
                    <div className="text-foreground-secondary truncate text-xs">
                      {item.artistName}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}

export const RadioShowView = ({ channelSlug }: { channelSlug: string }) => {
  const [show, setShow] = useState<PublicRadioShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowPlayingTrack, setNowPlayingTrack] =
    useState<RadioShowNowPlayingTrack | null>(null);
  const [upcomingTracks, setUpcomingTracks] = useState<
    RadioShowUpcomingTrack[]
  >([]);

  useEffect(() => {
    setLoading(true);
    void fetchPublicRadioShow(channelSlug).then((result) => {
      setShow(result.data);
      setLoading(false);
    });
  }, [channelSlug]);

  const reloadNowPlaying = () => {
    void fetchRadioShowNowPlaying(channelSlug).then((result) => {
      setNowPlayingTrack(result.data);
    });
    void fetchRadioShowUpcoming(channelSlug).then((result) => {
      setUpcomingTracks(result.data);
    });
  };

  useEffect(() => {
    reloadNowPlaying();
  }, [channelSlug]);

  usePolling(reloadNowPlaying, NOW_PLAYING_POLL_MS);

  if (loading) {
    return <PageLoading label="Loading show…" />;
  }

  if (!show) {
    return (
      <PageEmpty
        title="Show not found"
        description="This Tahti Radio show is not available."
      />
    );
  }

  // Only the nearest upcoming slot and the most recent past one can
  // plausibly be imminent/live/just-wrapped — no need to scan the whole list.
  const greenRoomLive = [show.upcomingEpisodes[0], show.pastEpisodes[0]].some(
    (episode) => episode && isGreenRoomWindow(episode),
  );

  const headerStats: EntitySocialStat[] = [
    ...(show.upcomingEpisodes.length > 0
      ? [
          {
            key: 'upcoming',
            label: 'Upcoming',
            value: show.upcomingEpisodes.length,
            icon: CalendarIcon,
          },
        ]
      : []),
    ...(show.pastEpisodes.length > 0
      ? [
          {
            key: 'past',
            label: 'Past episodes',
            value: show.pastEpisodes.length,
            icon: RadioIcon,
          },
        ]
      : []),
  ];

  return (
    <PageFrame maxWidth="3xl">
      <Link
        to="/radio"
        className="text-foreground-secondary text-xs hover:underline"
      >
        ← Tahti Radio
      </Link>

      <EntitySocialHeader
        title={show.artist.displayName}
        imageUrl={
          show.artist.avatarUrl ??
          show.artist.coverUrl ??
          placeholderArtworkUrl(show.artist.username)
        }
        roundImage
        subtitle={
          <Link
            to="/u/$username"
            params={{ username: show.artist.username }}
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            @{show.artist.username} · Show on Tahti Radio
          </Link>
        }
        description={
          show.artist.bio ? (
            <p className="line-clamp-2 whitespace-pre-wrap">
              {show.artist.bio}
            </p>
          ) : null
        }
        backdropUrl={show.artist.coverUrl}
        visualizerPreset="AURORA"
        artworkUrlForVisualizer={show.artist.avatarUrl}
        stats={headerStats}
        actions={
          greenRoomLive ? (
            <Tooltip content="Green room" side="top">
              <ButtonLink
                to="/u/$username/green-room"
                params={{ username: show.artist.username }}
                size="icon-sm"
                variant="secondary"
                aria-label="Open green room"
                className="bg-background border-border rounded-md border-(length:--border-width)"
              >
                <MicIcon size={16} aria-hidden />
              </ButtonLink>
            </Tooltip>
          ) : null
        }
        data-testid="radio-show-social-header"
      />

      <NowPlayingSection track={nowPlayingTrack} upcoming={upcomingTracks} />

      <SectionShell title="Episodes">
        <Tabs
          items={[
            {
              id: 'upcoming',
              label: 'Upcoming',
              content: (
                <EpisodeList
                  episodes={show.upcomingEpisodes}
                  emptyMessage="No upcoming slots booked right now."
                />
              ),
            },
            {
              id: 'past',
              label: 'Past episodes',
              content: (
                <EpisodeList
                  episodes={show.pastEpisodes}
                  emptyMessage="Nothing has aired yet."
                />
              ),
            },
          ]}
        />
      </SectionShell>
    </PageFrame>
  );
};
