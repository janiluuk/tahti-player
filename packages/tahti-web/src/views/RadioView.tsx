import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  CalendarDaysIcon,
  HeartIcon,
  HistoryIcon,
  ListOrderedIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  RadioTowerIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Box,
  Button,
  ButtonLink,
  MediaArtwork,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchRadio,
  fetchRadioFeatureHistory,
  fetchRadioRecentlyPlayed,
  fetchRadioStation,
  TAHTI_RADIO_SLUG,
} from '../api/client';
import {
  fetchMyRadioStations,
  type MyRadioStation,
} from '../api/my-radio-stations';
import type { RadioFeatureHistoryItem } from '../api/radio-public';
import {
  fetchRadioCalendar,
  fetchRadioShowUpcoming,
  type RadioShowUpcomingTrack,
  type StudioShowBooking,
} from '../api/shows';
import type {
  PublicChannel,
  RadioNowPlaying,
  RadioRecentlyPlayedItem,
  TahtiPlayable,
} from '../api/types';
import { RadioStationsRow } from '../components/listen-view/RadioStationsRow';
import { useRadioPresets } from '../components/listen-view/useListenSections';
import {
  MediaIconActions,
  playQueueFavoriteActions,
} from '../components/MediaIconActions';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { AddStationsPanel } from '../components/radio/AddStationsPanel';
import { FavoriteStationsRow } from '../components/radio/FavoriteStationsRow';
import { RadioBookedShowsPanel } from '../components/radio/RadioBookedShowsPanel';
import { RadioVisualizerHero } from '../components/radio/RadioVisualizerHero';
import { RadioBookingCalendar } from '../components/RadioBookingCalendar';
import { RadioUpNextPanel } from '../components/RadioUpNextPanel';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { OnAirBadge } from '../components/tahti/OnAirBadge';
import { TrackInfoDialog, type TrackInfo } from '../components/TrackInfoDialog';
import { usePolling } from '../hooks/usePolling';
import { RADIO_TABS, radioTabFromSearch } from '../lib/radioTabs';
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

export function RadioView() {
  const [station, setStation] = useState<PublicChannel | null>(null);
  const [relay, setRelay] = useState<RadioNowPlaying | null>(null);
  const [recent, setRecent] = useState<RadioRecentlyPlayedItem[]>([]);
  const [featured, setFeatured] = useState<RadioFeatureHistoryItem[]>([]);
  const [upcoming, setUpcoming] = useState<StudioShowBooking[]>([]);
  const [rotation, setRotation] = useState<RadioShowUpcomingTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationError, setStationError] = useState<string | null>(null);
  const [sectionErrors, setSectionErrors] = useState<
    Partial<
      Record<'upcoming' | 'rotation' | 'recent' | 'featured' | 'relay', string>
    >
  >({});
  const [infoTrack, setInfoTrack] = useState<TrackInfo | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [ownStations, setOwnStations] = useState<MyRadioStation[]>([]);
  const radioPresets = useRadioPresets();
  const search = useSearch({ strict: false }) as { tab?: string };
  const activeTab = radioTabFromSearch(search.tab);
  const navigate = useNavigate();
  const selectTab = (index: number) => {
    const next = RADIO_TABS[index];
    if (!next) {
      return;
    }
    void navigate({
      to: '/radio',
      search: next === 'up-next' ? {} : { tab: next },
      replace: true,
    });
  };

  const user = useAuthStore((s) => s.user);
  const signedIn = Boolean(user);
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
    void fetchRadioCalendar(from, to, { signedIn }).then((r) => {
      setSectionErrors((current) => ({
        ...current,
        upcoming: r.meta.source === 'api' ? r.meta.reason : undefined,
      }));
      setUpcoming(
        r.data
          .filter((b) => new Date(b.startAt).getTime() > Date.now())
          .sort((a, b) => a.startAt.localeCompare(b.startAt))
          .slice(0, UPCOMING_LIMIT),
      );
    });
  };

  const reloadRotation = () => {
    void fetchRadioShowUpcoming(TAHTI_RADIO_SLUG).then((r) => {
      setSectionErrors((current) => ({
        ...current,
        rotation: r.meta.source === 'api' ? r.meta.reason : undefined,
      }));
      setRotation(r.data);
    });
  };

  const reload = () => {
    setLoading(true);
    void Promise.all([
      fetchRadioStation().then(
        (result) => ({
          result,
          reason:
            result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
        }),
        (err: unknown) => ({
          result: null,
          reason: err instanceof Error ? err.message : 'Station fetch failed',
        }),
      ),
      fetchRadio(),
      fetchRadioRecentlyPlayed(),
      fetchRadioFeatureHistory(),
    ]).then(([stationRes, memberRelay, recentRes, featuredRes]) => {
      setStation(stationRes.result?.data ?? null);
      setStationError(stationRes.result ? null : stationRes.reason);
      setRelay(memberRelay.data);
      setRecent(recentRes.data);
      setFeatured(featuredRes.data);
      setSectionErrors((current) => ({
        ...current,
        relay:
          memberRelay.meta.source === 'api'
            ? memberRelay.meta.reason
            : undefined,
        recent:
          recentRes.meta.source === 'api' ? recentRes.meta.reason : undefined,
        featured:
          featuredRes.meta.source === 'api'
            ? featuredRes.meta.reason
            : undefined,
      }));
      setLoading(false);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    reloadUpcoming();
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) {
      setOwnStations([]);
      return;
    }
    let cancelled = false;
    void fetchMyRadioStations().then((result) => {
      if (!cancelled) {
        setOwnStations(result.data ?? []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  usePolling(() => {
    void fetchRadioStation().then((response) => {
      if (response?.data) {
        setStation(response.data);
      }
    });
  }, 30_000);

  const online = Boolean(station?.hlsUrl);
  const nowPlaying = station?.nowPlaying;
  const nowPlayingTitle = nowPlaying?.title;

  useEffect(() => {
    reloadRotation();
  }, [nowPlayingTitle]);

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
    <ViewShell
      title="Radio"
      data-testid="radio-view"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl' }}
    >
      {loading ? (
        <PageLoading label="Tuning Tahti Radio…" />
      ) : !station && stationError ? (
        <PageError
          title="Could not load Tahti Radio"
          description={stationError}
          onRetry={reload}
        />
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
                    <span className="text-accent-red-strong font-mono text-xs font-semibold tracking-wide uppercase">
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
                <ButtonLink
                  to="/channel/$slug"
                  params={{ slug: TAHTI_RADIO_SLUG }}
                  size="icon-sm"
                  variant="secondary"
                  aria-label="Open Tahti Radio channel"
                >
                  <RadioTowerIcon size={16} aria-hidden />
                </ButtonLink>
              </Tooltip>
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
          ) : sectionErrors.relay ? (
            <PageErrorBanner
              title="Could not check the member relay."
              description={sectionErrors.relay}
              onRetry={reload}
            />
          ) : null}

          {!online ? (
            <PageEmpty
              icon="radio"
              title="Off air"
              description="Browse live channels or check back soon."
              action={
                <div className="flex flex-wrap gap-2">
                  <ButtonLink to="/" size="sm" variant="secondary">
                    Browse listen
                  </ButtonLink>
                  <Button size="sm" variant="secondary" onClick={reload}>
                    Refresh
                  </Button>
                </div>
              }
            />
          ) : (
            <RadioVisualizerHero
              station={station}
              logoUrl={stationLogo}
              info={
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
              }
              actions={
                <>
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
                                ? 'text-accent-red-strong fill-current'
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
                  <ButtonLink
                    to="/channel/$slug"
                    params={{ slug: TAHTI_RADIO_SLUG }}
                    size="sm"
                    variant="secondary"
                  >
                    Open channel
                  </ButtonLink>
                </>
              }
            />
          )}

          <section className="flex flex-col gap-3">
            <Tabs
              listClassName="border-border border-b"
              panelClassName="pt-3"
              selectedIndex={RADIO_TABS.indexOf(activeTab)}
              onChange={selectTab}
              items={[
                {
                  id: 'up-next',
                  label: 'Up next',
                  icon: <ListOrderedIcon size={14} />,
                  count:
                    !memberLive && rotation.length > 0
                      ? rotation.length
                      : undefined,
                  content: (
                    <RadioUpNextPanel
                      onRotation={!memberLive}
                      rotation={rotation}
                      rotationError={sectionErrors.rotation}
                      onRetryRotation={reloadRotation}
                    />
                  ),
                },
                {
                  id: 'shows',
                  label: 'Shows',
                  icon: <CalendarDaysIcon size={14} />,
                  count: upcoming.length > 0 ? upcoming.length : undefined,
                  content: (
                    <RadioBookedShowsPanel
                      bookings={upcoming}
                      error={sectionErrors.upcoming}
                      onRetry={reloadUpcoming}
                      onBook={user ? () => setCalendarOpen(true) : undefined}
                    />
                  ),
                },
                {
                  id: 'just-played',
                  label: 'Just played',
                  icon: <HistoryIcon size={14} />,
                  count: recent.length > 0 ? recent.length : undefined,
                  content:
                    sectionErrors.recent && recent.length === 0 ? (
                      <PageError
                        title="Could not load recent plays"
                        description={sectionErrors.recent}
                        onRetry={reload}
                      />
                    ) : recent.length === 0 ? (
                      <PageEmpty title="No recent plays logged yet." />
                    ) : (
                      <div className="flex flex-col gap-3">
                        {sectionErrors.recent ? (
                          <PageErrorBanner
                            title="Could not refresh recent plays"
                            description={sectionErrors.recent}
                            onRetry={reload}
                          />
                        ) : null}
                        <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
                          {recent.map((item) => {
                            const playable: TahtiPlayable | null =
                              item.audioUrl && item.soundId
                                ? {
                                    id: `sound:${item.soundId}`,
                                    kind: 'sound',
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
                                    ? 'border-l-accent-cyan bg-accent-cyan/10'
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
                                    className={`block truncate text-sm leading-6 font-medium underline-offset-2 hover:underline ${
                                      isPlaying ? 'text-accent-cyan-strong' : ''
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
                                    onQueue: () =>
                                      playable && enqueue(playable),
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
                      </div>
                    ),
                },
                {
                  id: 'featured',
                  label: 'Featured',
                  icon: <MicIcon size={14} />,
                  count: featured.length > 0 ? featured.length : undefined,
                  content:
                    sectionErrors.featured && featured.length === 0 ? (
                      <PageError
                        title="Could not load member sets"
                        description={sectionErrors.featured}
                        onRetry={reload}
                      />
                    ) : featured.length === 0 ? (
                      <PageEmpty title="No member sets relayed yet." />
                    ) : (
                      <ul
                        className="border-border divide-border divide-y overflow-hidden rounded-lg border"
                        data-testid="radio-featured"
                      >
                        {featured.map((item) => (
                          <li
                            key={`${item.channelId}-${item.featuredAt}`}
                            className="flex items-center gap-3 px-3 py-2"
                          >
                            <Link
                              to="/channel/$slug"
                              params={{ slug: item.slug }}
                              className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-2 hover:underline"
                            >
                              {item.artistName || item.slug}
                            </Link>
                            <span className="text-foreground-secondary shrink-0 text-xs">
                              {formatAgo(item.featuredAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ),
                },
              ]}
            />
          </section>
        </div>
      )}

      <section
        className="mt-8 flex flex-col gap-6"
        data-testid="radio-stations"
      >
        <FavoriteStationsRow />
        <RadioStationsRow
          presets={radioPresets.presets}
          setPresets={radioPresets.setPresets}
          onRetry={radioPresets.retry}
          ownStations={ownStations}
          signedIn={signedIn}
          data-testid="radio-stations-row"
        />
        <AddStationsPanel onOwnStationsChange={setOwnStations} />
      </section>

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
