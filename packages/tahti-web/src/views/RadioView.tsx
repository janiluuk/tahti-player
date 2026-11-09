import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  CalendarDaysIcon,
  HistoryIcon,
  ListOrderedIcon,
  MicIcon,
  RadioTowerIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  Tooltip,
  ViewShell,
  type TabsItem,
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
} from '../api/types';
import { useRotationNowPlaying } from '../components/channel-view/useRotationNowPlaying';
import { RadioStationsRow } from '../components/listen-view/RadioStationsRow';
import { useRadioPresets } from '../components/listen-view/useListenSections';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { AddStationsPanel } from '../components/radio/AddStationsPanel';
import { FavoriteStationsRow } from '../components/radio/FavoriteStationsRow';
import { RadioBookedShowsPanel } from '../components/radio/RadioBookedShowsPanel';
import { RadioFeaturedPanel } from '../components/radio/RadioFeaturedPanel';
import {
  RadioPlayButton,
  RadioStationActions,
} from '../components/radio/RadioHeroControls';
import {
  formatRadioAgo,
  RadioJustPlayedPanel,
} from '../components/radio/RadioJustPlayedPanel';
import {
  RadioNowPlayingOverlay,
  type RadioOverlayItem,
} from '../components/radio/RadioNowPlayingOverlay';
import { RadioPlayerWidget } from '../components/radio/RadioPlayerWidget';
import { RadioBookingCalendar } from '../components/RadioBookingCalendar';
import { RadioUpNextPanel } from '../components/RadioUpNextPanel';
import { StationUnavailableNotice } from '../components/StationUnavailableNotice';
import { OnAirBadge } from '../components/tahti/OnAirBadge';
import { TrackInfoDialog, type TrackInfo } from '../components/TrackInfoDialog';
import { usePolling } from '../hooks/usePolling';
import { RADIO_TABS, radioTabFromSearch } from '../lib/radioTabs';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';

const UPCOMING_WINDOW_DAYS = 14;
const UPCOMING_LIMIT = 8;

function formatShowStart(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RadioView() {
  const { t } = useTranslation('web');
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
          reason:
            err instanceof Error ? err.message : t('radio.stationFetchFailed'),
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
  const { nowPlaying, next: nextTrack } = useRotationNowPlaying(
    TAHTI_RADIO_SLUG,
    station?.nowPlaying ?? null,
    station?.nowPlayingNext,
  );
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
          artworkUrl: relay.channel.artworkUrl ?? null,
        }
      : null;
  const nextRotationTrack = nextTrack ?? rotation[0] ?? null;
  const nextBooking = upcoming[0] ?? null;
  const overlayCurrent: RadioOverlayItem | null = memberLive
    ? {
        title: memberLive.title ?? t('radio.liveSet'),
        subtitle: memberLive.name,
        artworkUrl: memberLive.artworkUrl,
      }
    : nowPlaying
      ? {
          title: nowPlaying.title,
          subtitle: nowPlaying.artistName,
          artworkUrl: nowPlaying.artworkUrl,
        }
      : null;
  const overlayNext: RadioOverlayItem | null =
    !memberLive && nextRotationTrack
      ? {
          title: nextRotationTrack.title,
          subtitle: nextRotationTrack.artistName,
        }
      : nextBooking
        ? {
            title: nextBooking.note ?? nextBooking.displayName,
            subtitle: `${nextBooking.displayName}, ${formatShowStart(nextBooking.startAt)}`,
          }
        : null;
  const TAGLINE = t('radio.tagline');
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

  const queueIds = new Set(queue.map((item) => item.id));
  const playerTabs: TabsItem[] = [
    {
      id: 'up-next',
      label: t('radio.tabUpNext'),
      icon: <ListOrderedIcon size={14} />,
      count: !memberLive && rotation.length > 0 ? rotation.length : undefined,
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
      label: t('radio.tabShows'),
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
      label: t('radio.tabJustPlayed'),
      icon: <HistoryIcon size={14} />,
      count: recent.length > 0 ? recent.length : undefined,
      content: (
        <RadioJustPlayedPanel
          items={recent}
          error={sectionErrors.recent}
          onRetry={reload}
          handlers={{
            currentId,
            playerStatus,
            queueIds,
            onPlay: play,
            onTogglePause: () =>
              setPlayerStatus(
                playerStatus === 'playing' || playerStatus === 'loading'
                  ? 'paused'
                  : 'playing',
              ),
            onQueue: enqueue,
            onTrackInfo: (item, playable) =>
              setInfoTrack({
                title: item.title,
                artistName: item.artistName,
                artistUsername: item.artistUsername,
                artworkUrl: item.artworkUrl,
                meta: formatRadioAgo(item.playedAt),
                playable: playable ?? undefined,
              }),
          }}
        />
      ),
    },
    {
      id: 'featured',
      label: t('radio.tabFeatured'),
      icon: <MicIcon size={14} />,
      count: featured.length > 0 ? featured.length : undefined,
      content: (
        <RadioFeaturedPanel
          items={featured}
          error={sectionErrors.featured}
          onRetry={reload}
        />
      ),
    },
  ];

  return (
    <ViewShell
      title={t('radio.title')}
      data-testid="radio-view"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl' }}
    >
      {loading ? (
        <PageLoading label={t('radio.tuning')} />
      ) : !station && stationError ? (
        <PageError
          title={t('radio.loadErrorTitle')}
          description={stationError}
          onRetry={reload}
        />
      ) : !station ? (
        <PageEmpty
          icon="radio"
          title={t('radio.unavailableTitle')}
          description={t('radio.unavailableDescription')}
          action={
            <Button size="sm" variant="secondary" onClick={reload}>
              {t('actions.refresh')}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <header className="flex items-start justify-between gap-4">
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
                      {t('radio.offline')}
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
              <Tooltip content={t('radio.openChannel')} side="top">
                <ButtonLink
                  to="/channel/$slug"
                  params={{ slug: TAHTI_RADIO_SLUG }}
                  search={{ view: 'channel' }}
                  size="icon-sm"
                  variant="secondary"
                  aria-label={t('radio.openChannel')}
                >
                  <RadioTowerIcon size={16} aria-hidden />
                </ButtonLink>
              </Tooltip>
            </div>
          </header>

          {!memberLive && sectionErrors.relay ? (
            <PageErrorBanner
              title={t('radio.memberRelayError')}
              description={sectionErrors.relay}
              onRetry={reload}
            />
          ) : null}

          <RadioPlayerWidget
            station={station}
            logoUrl={stationLogo}
            artworkUrl={overlayCurrent?.artworkUrl ?? null}
            liveChannel={memberLive}
            online={online}
            offlineContent={
              <PageEmpty
                icon="radio"
                title={t('radio.offAirTitle')}
                description={t('radio.offAirDescription')}
                action={
                  <div className="flex flex-wrap gap-2">
                    <ButtonLink to="/" size="sm" variant="secondary">
                      {t('radio.browseListen')}
                    </ButtonLink>
                    <Button size="sm" variant="secondary" onClick={reload}>
                      {t('actions.refresh')}
                    </Button>
                  </div>
                }
              />
            }
            info={
              <RadioNowPlayingOverlay
                label={
                  memberLive ? t('radio.liveOnRelay') : t('radio.nowPlaying')
                }
                current={overlayCurrent}
                next={overlayNext}
                onCurrentInfo={
                  !memberLive && nowPlaying
                    ? () =>
                        setInfoTrack({
                          title: nowPlaying.title,
                          artistName: nowPlaying.artistName,
                          artistUsername: nowPlaying.artistUsername,
                          artworkUrl: nowPlaying.artworkUrl,
                          meta: t('radio.liveNow'),
                        })
                    : undefined
                }
              />
            }
            playControl={
              <RadioPlayButton
                playing={isRadioPlaying}
                playLabel={t('radio.playRadio')}
                pauseLabel={t('radio.pauseRadio')}
                onToggle={playStation}
              />
            }
            actions={
              <RadioStationActions
                favorited={favorited}
                favoriteLabel={t('actions.addToFavorites')}
                unfavoriteLabel={t('actions.removeFromFavorites')}
                onToggleFavorite={() =>
                  void toggleFavoriteChannel({
                    slug: TAHTI_RADIO_SLUG,
                    username: station.user.username,
                    displayName: station.user.displayName,
                    avatarUrl: station.user.avatarUrl,
                  })
                }
                channelSlug={TAHTI_RADIO_SLUG}
                openChannelLabel={t('actions.openChannel')}
              />
            }
            notice={
              <StationUnavailableNotice
                playableId={radioPlayableId}
                streamUrl={station?.hlsUrl}
                onPlay={playStation}
                className="mx-4 my-3"
              />
            }
            selectedTabIndex={RADIO_TABS.indexOf(activeTab)}
            defaultExpanded={search.tab !== undefined}
            onTabChange={selectTab}
            tabs={playerTabs}
          />
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
