import { Link } from '@tanstack/react-router';
import {
  CalendarIcon,
  HeartIcon,
  HistoryIcon,
  ListOrderedIcon,
  MessageCircleIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  RadioTowerIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Box,
  Button,
  ImageReveal,
  MediaArtwork,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { resolvePublicVisualizerPreset } from '../api/channel-design';
import {
  fetchRadio,
  fetchRadioRecentlyPlayed,
  fetchRadioStation,
  TAHTI_RADIO_SLUG,
} from '../api/client';
import { fetchShowBookings, type StudioShowBooking } from '../api/shows';
import type {
  PublicChannel,
  RadioNowPlaying,
  RadioRecentlyPlayedItem,
  TahtiPlayable,
} from '../api/types';
import { ChannelVisualizer } from '../components/ChannelVisualizer';
import {
  MediaIconActions,
  playQueueFavoriteActions,
} from '../components/MediaIconActions';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { RadioBookingCalendar } from '../components/RadioBookingCalendar';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { OnAirBadge } from '../components/tahti/OnAirBadge';
import { TrackInfoDialog, type TrackInfo } from '../components/TrackInfoDialog';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';

const UPCOMING_WINDOW_DAYS = 14;
const UPCOMING_LIMIT = 8;

function formatAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) {
    return 'just now';
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
}

function formatUpcoming(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const dayDiff = Math.round(
    (new Date(d.toDateString()).getTime() -
      new Date(now.toDateString()).getTime()) /
      86_400_000,
  );
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (dayDiff === 0) {
    return `Today ${time}`;
  }
  if (dayDiff === 1) {
    return `Tomorrow ${time}`;
  }
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} ${time}`;
}

export function RadioView() {
  const [station, setStation] = useState<PublicChannel | null>(null);
  const [relay, setRelay] = useState<RadioNowPlaying | null>(null);
  const [recent, setRecent] = useState<RadioRecentlyPlayedItem[]>([]);
  const [upcoming, setUpcoming] = useState<StudioShowBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoTrack, setInfoTrack] = useState<TrackInfo | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const currentId = usePlayerStore((s) => s.currentId);
  const playerStatus = usePlayerStore((s) => s.status);
  const setPlayerStatus = usePlayerStore((s) => s.setStatus);
  const queue = usePlayerStore((s) => s.queue);
  const toggleFavoriteChannel = useLibraryStore((s) => s.toggleFavoriteChannel);
  const favorited = useLibraryStore((s) =>
    s.favoriteChannels.some((c) => c.slug === TAHTI_RADIO_SLUG),
  );

  const reloadUpcoming = () => {
    const from = new Date().toISOString();
    const to = new Date(
      Date.now() + UPCOMING_WINDOW_DAYS * 24 * 3600_000,
    ).toISOString();
    void fetchShowBookings(from, to).then((r) => {
      setUpcoming(
        r.data
          .filter((b) => new Date(b.startAt).getTime() > Date.now())
          .sort((a, b) => a.startAt.localeCompare(b.startAt))
          .slice(0, UPCOMING_LIMIT),
      );
    });
  };

  const reload = () => {
    setLoading(true);
    void Promise.all([
      fetchRadioStation().catch(() => null),
      fetchRadio(),
      fetchRadioRecentlyPlayed(),
    ]).then(([ch, memberRelay, recentRes]) => {
      setStation(ch?.data ?? null);
      setRelay(memberRelay.data);
      setRecent(recentRes.data);
      setLoading(false);
    });
    reloadUpcoming();
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    const refreshNowPlaying = () => {
      void fetchRadioStation().then((response) => {
        if (response?.data) {
          setStation(response.data);
        }
      });
    };
    const interval = window.setInterval(refreshNowPlaying, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const online = Boolean(station?.hlsUrl);
  const nowPlaying = station?.nowPlaying;
  const stationLogo =
    station?.user.avatarUrl ?? station?.nowPlaying?.artworkUrl ?? null;
  const memberLive =
    relay?.live && relay.channel
      ? {
          slug: relay.channel.slug,
          name: relay.channel.displayName ?? relay.channel.slug,
          title: relay.channel.title,
        }
      : null;
  const TAGLINE =
    '24/7 community radio — always on. Fair rotation when nobody is booked.';
  const description = [TAGLINE, station?.user.bio]
    .filter((s): s is string => Boolean(s))
    .sort((a, b) => a.length - b.length)[0];

  const radioPlayableId = `radio:${TAHTI_RADIO_SLUG}`;
  const isRadioCurrent = currentId === radioPlayableId;
  const isRadioPlaying =
    isRadioCurrent &&
    (playerStatus === 'playing' || playerStatus === 'loading');

  const playStation = () => {
    if (isRadioCurrent) {
      setPlayerStatus(isRadioPlaying ? 'paused' : 'playing');
      return;
    }
    void fetchRadioStation().then(({ playable }) => {
      if (playable) {
        play(playable);
      }
    });
  };

  return (
    <ViewShell title="Radio" classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl' }}>
      {loading ? (
        <PageLoading label="Tuning Tahti Radio…" />
      ) : !station ? (
        <PageEmpty
          icon="radio"
          title="Radio unavailable"
          description="Could not load the Tahti Radio station. Try again in a moment."
          action={
            <Button size="sm" variant="secondary" onClick={reload}>
              Refresh
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="bg-surface-secondary flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl font-bold tracking-tight sm:size-24">
                <ImageReveal
                  src={stationLogo ?? undefined}
                  alt=""
                  className="size-full"
                  placeholder={<span>TR</span>}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-foreground text-2xl font-bold tracking-tight">
                  {station.user.displayName}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-foreground-secondary">
                    @{TAHTI_RADIO_SLUG}
                  </span>
                  {online ? (
                    <OnAirBadge />
                  ) : (
                    <span className="text-accent-red font-mono text-xs font-semibold tracking-wide uppercase">
                      Offline
                    </span>
                  )}
                </div>
                {description ? (
                  <p className="text-foreground-secondary mt-2 max-w-md text-sm whitespace-pre-wrap">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Tooltip content="Open Tahti Radio channel" side="top">
                <Link to="/channel/$slug" params={{ slug: TAHTI_RADIO_SLUG }}>
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    aria-label="Open Tahti Radio channel"
                  >
                    <RadioTowerIcon size={16} aria-hidden />
                  </Button>
                </Link>
              </Tooltip>
              {user && (
                <Tooltip content="Book a slot" side="top">
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    aria-label="Open booking calendar"
                    onClick={() => setCalendarOpen(true)}
                  >
                    <CalendarIcon size={16} aria-hidden />
                  </Button>
                </Tooltip>
              )}
            </div>
          </header>

          {memberLive ? (
            <Box variant="secondary" className="items-start gap-2 text-sm">
              <span aria-hidden>🔴</span>
              <span>
                Live now on the member relay: <strong>{memberLive.name}</strong>
                {memberLive.title ? ` — ${memberLive.title}` : null}
                {' · '}
                <Link
                  to="/channel/$slug"
                  params={{ slug: memberLive.slug }}
                  className="underline-offset-2 hover:underline"
                >
                  Open {memberLive.slug}
                </Link>
              </span>
            </Box>
          ) : null}

          {!online ? (
            <PageEmpty
              icon="radio"
              title="Tahti Radio is temporarily offline"
              description="Browse live channels or check back soon."
              action={
                <div className="flex flex-wrap gap-2">
                  <Link to="/">
                    <Button size="sm" variant="secondary">
                      Browse listen
                    </Button>
                  </Link>
                  <Button size="sm" variant="secondary" onClick={reload}>
                    Refresh
                  </Button>
                </div>
              }
            />
          ) : (
            <Box
              variant="secondary"
              className="relative min-h-[220px] overflow-hidden rounded-xl"
            >
              <div className="absolute inset-0 opacity-40">
                <ChannelVisualizer
                  preset={resolvePublicVisualizerPreset(station.visualPreset)}
                  colorSchemeJson={station.colorSchemeJson}
                  className="h-full min-h-[160px] w-full"
                />
              </div>
              <div className="relative z-10 flex flex-col gap-5 p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <MediaArtwork
                    size="md"
                    src={nowPlaying?.artworkUrl}
                    alt=""
                    className="bg-surface-secondary rounded-lg text-sm font-bold"
                    placeholder="TR"
                  />
                  <div className="min-w-0">
                    <Eyebrow tone="green">Live now</Eyebrow>
                    {nowPlaying?.title ? (
                      <Button
                        type="button"
                        variant="text"
                        size="flexible"
                        onClick={() =>
                          setInfoTrack({
                            title: nowPlaying.title,
                            artistName: nowPlaying.artistName,
                            artistUsername: nowPlaying.artistUsername,
                            artworkUrl: nowPlaying.artworkUrl,
                            meta: 'Live now',
                          })
                        }
                        className="text-foreground block max-w-full truncate p-0 text-lg font-bold tracking-tight underline-offset-4 hover:underline"
                      >
                        {nowPlaying.title}
                      </Button>
                    ) : (
                      <div className="text-foreground text-lg font-bold tracking-tight">
                        24/7 rotation
                      </div>
                    )}
                    <div className="text-foreground-secondary truncate text-sm">
                      {nowPlaying?.artistName ?? 'Tahti Radio'}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-start gap-3">
                  <MediaIconActions
                    actions={[
                      {
                        id: 'play',
                        label: isRadioPlaying ? 'Pause Radio' : 'Play Radio',
                        icon: isRadioPlaying ? (
                          <PauseIcon size={16} className="fill-current" />
                        ) : (
                          <PlayIcon size={16} className="fill-current" />
                        ),
                        onClick: playStation,
                        active: isRadioPlaying,
                        disableWhenActive: false,
                      },
                      {
                        id: 'favorite',
                        label: favorited ? 'Favorited' : 'Favorite',
                        icon: (
                          <HeartIcon
                            size={16}
                            className={
                              favorited
                                ? 'text-accent-red fill-current'
                                : undefined
                            }
                          />
                        ),
                        onClick: () =>
                          toggleFavoriteChannel({
                            slug: TAHTI_RADIO_SLUG,
                            displayName: station.user.displayName,
                            avatarUrl: station.user.avatarUrl,
                          }),
                        active: favorited,
                        variant: 'text',
                      },
                    ]}
                  />
                  <Link to="/channel/$slug" params={{ slug: TAHTI_RADIO_SLUG }}>
                    <Button size="sm" variant="secondary">
                      Open channel
                    </Button>
                  </Link>
                </div>
              </div>
            </Box>
          )}

          <section className="flex flex-col gap-3">
            <Tabs
              listClassName="border-border border-b"
              panelClassName="pt-3"
              items={[
                {
                  id: 'up-next',
                  label: 'Up next',
                  icon: <ListOrderedIcon size={14} />,
                  count: upcoming.length > 0 ? upcoming.length : undefined,
                  content:
                    upcoming.length === 0 ? (
                      <div className="flex flex-col items-start gap-2">
                        <p className="text-foreground-secondary text-sm">
                          Nothing booked yet — fair rotation plays when nobody
                          is.
                        </p>
                        {user && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setCalendarOpen(true)}
                          >
                            <CalendarIcon
                              size={15}
                              className="mr-1.5"
                              aria-hidden
                            />
                            Book a slot
                          </Button>
                        )}
                      </div>
                    ) : (
                      <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
                        {upcoming.map((b) => (
                          <li
                            key={b.id}
                            className="flex items-center gap-3 px-3 py-2"
                          >
                            {b.showType === 'TALK' ? (
                              <MessageCircleIcon
                                size={16}
                                aria-hidden
                                className="text-foreground-secondary shrink-0"
                              />
                            ) : (
                              <MicIcon
                                size={16}
                                aria-hidden
                                className="text-foreground-secondary shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <Link
                                to="/radio/show/$channelSlug"
                                params={{ channelSlug: b.channelSlug }}
                                className="block truncate text-sm font-medium underline-offset-2 hover:underline"
                              >
                                {b.note ?? b.displayName}
                              </Link>
                              <div className="text-foreground-secondary truncate text-xs">
                                {b.displayName}
                                {b.isMine ? ' (you)' : ''}
                              </div>
                            </div>
                            <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
                              {formatUpcoming(b.startAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ),
                },
                {
                  id: 'just-played',
                  label: 'Just played',
                  icon: <HistoryIcon size={14} />,
                  count: recent.length > 0 ? recent.length : undefined,
                  content:
                    recent.length === 0 ? (
                      <p className="text-foreground-secondary text-sm">
                        No recent plays logged yet.
                      </p>
                    ) : (
                      <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
                        {recent.map((item) => {
                          const playable: TahtiPlayable | null = item.audioUrl
                            ? {
                                id: `archive:${item.id}`,
                                kind: 'archive',
                                title: item.title,
                                artist: item.artistName,
                                coverUrl: item.artworkUrl ?? undefined,
                                streamUrl: item.audioUrl,
                                protocol: 'https',
                              }
                            : null;
                          const isPlaying = Boolean(
                            playable && playable.id === currentId,
                          );
                          const isActivelyPlaying =
                            isPlaying &&
                            (playerStatus === 'playing' ||
                              playerStatus === 'loading');
                          return (
                            <li
                              key={item.id}
                              className={`flex items-center gap-3 border-l-4 px-3 py-2 transition-colors ${
                                isPlaying
                                  ? 'border-l-accent-green bg-accent-green/10'
                                  : 'border-l-transparent'
                              }`}
                            >
                              <Button
                                type="button"
                                variant="text"
                                size="flexible"
                                onClick={() =>
                                  setInfoTrack({
                                    title: item.title,
                                    artistName: item.artistName,
                                    artistUsername: item.artistUsername,
                                    artworkUrl: item.artworkUrl,
                                    meta: formatAgo(item.playedAt),
                                    playable,
                                  })
                                }
                                aria-label={`Track info for ${item.title}`}
                                className="shrink-0 p-0"
                              >
                                <MediaArtwork
                                  size="sm"
                                  src={item.artworkUrl}
                                  alt=""
                                  className="bg-surface-secondary rounded-md text-[10px] font-bold"
                                  placeholder={item.title
                                    .slice(0, 2)
                                    .toUpperCase()}
                                />
                              </Button>
                              <div className="min-w-0 flex-1">
                                <Link
                                  to="/t/$id"
                                  params={{ id: item.id }}
                                  className={`block truncate text-sm font-medium underline-offset-2 hover:underline ${
                                    isPlaying ? 'text-accent-green' : ''
                                  }`}
                                >
                                  {item.title}
                                </Link>
                                <div className="text-foreground-secondary truncate text-xs">
                                  {item.artistName}
                                </div>
                              </div>
                              <span className="text-foreground-secondary hidden shrink-0 text-xs sm:inline">
                                {formatAgo(item.playedAt)}
                              </span>
                              <MediaIconActions
                                actions={playQueueFavoriteActions({
                                  onPlay: () => playable && play(playable),
                                  onTogglePause: () =>
                                    setPlayerStatus(
                                      playerStatus === 'playing' ||
                                        playerStatus === 'loading'
                                        ? 'paused'
                                        : 'playing',
                                    ),
                                  isPlaying: isActivelyPlaying,
                                  onQueue: () => playable && enqueue(playable),
                                  playDisabled: !playable,
                                  queueDisabled: !playable,
                                  playLabel: `Play ${item.title}`,
                                  queueLabel: `Queue ${item.title}`,
                                  queued: Boolean(
                                    playable &&
                                    queue.some(
                                      (queueItem) =>
                                        queueItem.id === playable.id,
                                    ),
                                  ),
                                })}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    ),
                },
              ]}
            />
          </section>

          <p className="text-foreground-secondary text-xs">
            Prefer a single artist?{' '}
            <Link to="/" className="underline-offset-2 hover:underline">
              Browse the listen directory
            </Link>{' '}
            (e.g.{' '}
            <Link
              to="/channel/$slug"
              params={{ slug: 'northern-lights' }}
              className="underline-offset-2 hover:underline"
            >
              northern-lights
            </Link>
            ).
          </p>
        </div>
      )}

      <TrackInfoDialog
        isOpen={Boolean(infoTrack)}
        onClose={() => setInfoTrack(null)}
        track={infoTrack}
      />

      <RadioBookingCalendar
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onBooked={reloadUpcoming}
      />
    </ViewShell>
  );
}
