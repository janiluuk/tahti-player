import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  ArrowUpDownIcon,
  CheckIcon,
  HistoryIcon,
  ListMusicIcon,
  NewspaperIcon,
} from 'lucide-react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardsRow,
  SectionTitle,
  SortableBlocks,
  TabLabel,
  Tabs,
  Tooltip,
  ViewShell,
  type SortableBlock,
} from '@tahti-player/ui';

import {
  fetchChannel,
  fetchRadioStation,
  TAHTI_RADIO_SLUG,
} from '../api/client';
import type { OnAirChannel } from '../api/listen';
import { fetchStationNowPlaying } from '../api/radio-now-playing';
import type { TahtiPlayable } from '../api/types';
import { DiscoWidgetsSection } from '../components/disco-widgets/DiscoWidgetsSection';
import { DiscoverGatewayBackground } from '../components/DiscoverGatewayBackground';
import { HomeComingUp } from '../components/listen-view/HomeComingUp';
import {
  NewReleasesRow,
  TahtiSelectsRow,
  TrendingRow,
} from '../components/listen-view/HomeHighlights';
import { HomeNews } from '../components/listen-view/HomeNews';
import { ListenSection } from '../components/listen-view/ListenSection';
import {
  RadioRowCard,
  type RadioRowItem,
} from '../components/listen-view/RadioRowCard';
import { useListenSections } from '../components/listen-view/useListenSections';
import { WelcomeStrip } from '../components/listen-view/WelcomeStrip';
import { useListenerWidgetBlocks } from '../components/ListenerWidgetsSection';
import { ListenWidgetStoreDialog } from '../components/ListenWidgetStoreDialog';
import { PageError, PageLoading } from '../components/PageStates';
import { PlayableAmbientTrackList } from '../components/PlayableAmbientTrackList';
import { RadioListItem } from '../components/RadioListItem';
import { RemoveWidgetDialog } from '../components/RemoveWidgetDialog';
import {
  radioStation,
  radioStationIdForPlayable,
  radioStationPlayable,
} from '../content/radioStations';
import { usePolling } from '../hooks/usePolling';
import { scheduleIdleRoutePrefetch } from '../lib/idleRoutePrefetch';
import { prefetchListenCardIntent } from '../lib/intentRoutePrefetch';
import { resolveLocalPlayableForReplay } from '../lib/nativeLibrary';
import { activeListenTab } from '../lib/navigationActive';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import {
  isWidgetBlockId,
  mergeBlockOrder,
  useListenerWidgetsStore,
} from '../stores/listenerWidgetsStore';
import { usePlayerStore } from '../stores/playerStore';

export type ListenTab = 'listen' | 'feed' | 'history';

const LISTEN_SECTION_TABS = [
  { id: 'listen' as const, label: 'Listen', Icon: ListMusicIcon, to: '/' },
  {
    id: 'feed' as const,
    label: 'Feed',
    Icon: NewspaperIcon,
    to: '/listen/feed',
  },
  {
    id: 'history' as const,
    label: 'History',
    Icon: HistoryIcon,
    to: '/listen/history',
  },
];

const NOW_PLAYING_POLL_MS = 45_000;
const RECENTLY_PLAYED_LIMIT = 20;

const ROW_LABELS = {
  filterPlaceholder: 'Filter…',
  nothingFound: 'Nothing matches that filter.',
};

type OnAirRowItem = { id: string; title: string; channel: OnAirChannel };

type RecentRowItem = { id: string; title: string; playable: TahtiPlayable };

/** The stored order first; blocks it doesn't know (new sections, widgets
 * added before ordering existed) keep their default neighbours. Until the
 * sections have been ordered once, the stored order only holds widgets
 * added since, and those go above everything. */
function orderListenBlocks(
  blocks: SortableBlock[],
  order: string[],
): SortableBlock[] {
  const byId = new Map(blocks.map((block) => [block.id, block]));
  const known = order.filter((id) => byId.has(id));
  const defaults = blocks.map((block) => block.id);
  const ids = known.some((id) => !isWidgetBlockId(id))
    ? mergeBlockOrder(known, defaults)
    : [...known, ...defaults.filter((id) => !known.includes(id))];
  return ids.map((id) => byId.get(id)!);
}

const FeedView = lazy(() =>
  import('./FeedView').then((m) => ({ default: m.FeedView })),
);
const HistoryView = lazy(() =>
  import('./HistoryView').then((m) => ({ default: m.HistoryView })),
);

export function ListenView({ tab: tabProp = 'listen' }: { tab?: ListenTab }) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const tab = activeListenTab(pathname) ?? tabProp;
  const [presetNowPlaying, setPresetNowPlaying] = useState<
    Record<string, string>
  >({});
  const play = usePlayerStore((s) => s.play);
  const playFromList = usePlayerStore((s) => s.playFromList);
  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const setPlaybackStatus = usePlayerStore((s) => s.setStatus);
  const history = useLibraryStore((s) => s.history);
  const user = useAuthStore((s) => s.user);
  const signedIn = Boolean(user);
  const sections = useListenSections(signedIn, user?.id ?? '');
  const radio = sections.radio.data;
  const radioPresets = sections.presets.data;
  const setRadioPresets = sections.setPresets;
  const enabledStationIds = useListenerWidgetsStore((s) => s.enabledStationIds);
  const listenOrder = useListenerWidgetsStore((s) => s.listenOrder);
  const setListenOrder = useListenerWidgetsStore((s) => s.setListenOrder);
  const widgetBlocks = useListenerWidgetBlocks();
  const [reordering, setReordering] = useState(false);
  const stationOverrides = useListenerWidgetsStore((s) => s.stationOverrides);
  const toggleStation = useListenerWidgetsStore((s) => s.toggleStation);
  const [pendingStationRemoval, setPendingStationRemoval] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const nowPlayingRefreshInFlight = useRef(false);

  const refreshPresetNowPlaying = useCallback(async () => {
    if (radioPresets.length === 0 || nowPlayingRefreshInFlight.current) {
      return;
    }
    nowPlayingRefreshInFlight.current = true;
    try {
      const entries = await Promise.all(
        radioPresets.map(async (preset) => {
          const title = await fetchStationNowPlaying({
            programmingUrl: preset.programmingUrl,
            streamUrl: preset.streamUrl,
          });
          return [preset.id, title] as const;
        }),
      );
      const next: Record<string, string> = {};
      for (const [id, title] of entries) {
        if (title) {
          next[id] = title;
        }
      }
      setPresetNowPlaying(next);
    } catch {
      return;
    } finally {
      nowPlayingRefreshInFlight.current = false;
    }
  }, [radioPresets]);

  useEffect(() => {
    void refreshPresetNowPlaying();
  }, [refreshPresetNowPlaying]);

  useEffect(() => scheduleIdleRoutePrefetch(), []);

  usePolling(
    () => void refreshPresetNowPlaying(),
    NOW_PLAYING_POLL_MS,
    radioPresets.length > 0,
  );

  const playNow = async (slug: string) => {
    const { playable } = await fetchChannel(slug);
    if (playable) {
      play(playable);
    }
  };

  const isActive = (playableId: string) =>
    currentId === playableId &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');

  const togglePlayback = (playableId: string, start: () => void) => {
    if (currentId === playableId) {
      setPlaybackStatus(isActive(playableId) ? 'paused' : 'playing');
      return;
    }
    start();
  };

  const radioLogo =
    radio?.user.avatarUrl ?? radio?.nowPlaying?.artworkUrl ?? null;
  const radioName = radio?.user.displayName ?? 'Tahti Radio';
  const radioPlayableId = `radio:${TAHTI_RADIO_SLUG}`;

  const toggleRadioPlayback = () =>
    togglePlayback(radioPlayableId, () => {
      void fetchRadioStation().then(({ playable }) => {
        if (playable) {
          play(playable);
        }
      });
    });

  const replayFromHistory = (playable: TahtiPlayable) =>
    togglePlayback(playable.id, () => {
      resolveLocalPlayableForReplay(playable)
        .then((resolved) => {
          if (resolved) {
            play(resolved);
          } else {
            toast.error(
              'Re-import this file from your library to play it again.',
            );
          }
        })
        .catch((error: unknown) => {
          toast.error(
            error instanceof Error ? error.message : 'Track unavailable.',
          );
        });
    });

  // Catalog stations (packages/tahti-web/src/content/radioStations.ts) fill
  // in any station that doesn't already have a board-curated preset enabled
  // for it (matched by name, same link used above for cover editing) — the
  // preset's admin-uploaded artwork wins when both exist for the same station.
  const radioItems = useMemo<RadioRowItem[]>(() => {
    const presetNames = new Set(radioPresets.map((preset) => preset.name));
    const catalog = enabledStationIds
      .map((id) => {
        const station = radioStation(id);
        return station ? { ...station, ...stationOverrides[id] } : undefined;
      })
      .filter((station) => station != null)
      .filter((station) => !presetNames.has(station.name));
    return [
      ...radioPresets.map((preset) => ({
        id: `radio-preset:${preset.id}`,
        title: preset.name,
        kind: 'preset' as const,
        preset,
      })),
      ...catalog.map((station) => ({
        id: `radio-widget:${station.id}`,
        title: station.name,
        kind: 'catalog' as const,
        station,
      })),
    ];
  }, [radioPresets, enabledStationIds, stationOverrides]);

  const radioRowPlayables = useMemo(() => {
    const playables: TahtiPlayable[] = [];
    for (const item of radioItems) {
      if (item.kind === 'preset') {
        const streamUrl = item.preset.streamUrl;
        if (!streamUrl) {
          continue;
        }
        playables.push({
          id: item.id,
          kind: 'radio',
          title: presetNowPlaying[item.preset.id] ?? item.preset.name,
          artist: item.preset.name,
          coverUrl: item.preset.iconUrl ?? undefined,
          streamUrl,
          protocol: 'https',
          sourceProvider: 'internet-radio',
        });
        continue;
      }
      const streamUrl = item.station.streamUrl;
      if (!streamUrl) {
        continue;
      }
      playables.push(radioStationPlayable({ ...item.station, streamUrl }));
    }
    return playables;
  }, [radioItems, presetNowPlaying]);

  const playRadioRowStation = (playableId: string) => {
    const index = radioRowPlayables.findIndex((row) => row.id === playableId);
    if (index < 0) {
      return;
    }
    playFromList(radioRowPlayables, index);
  };

  const onAirItems = useMemo<OnAirRowItem[]>(
    () =>
      sections.onAir.data.map((channel) => ({
        id: channel.slug,
        title: channel.user.displayName,
        channel,
      })),
    [sections.onAir.data],
  );
  const liveItems = onAirItems.filter((item) => item.channel.state === 'LIVE');
  const replayItems = onAirItems.filter(
    (item) => item.channel.state !== 'LIVE',
  );

  const recentItems = useMemo<RecentRowItem[]>(
    () =>
      history.slice(0, RECENTLY_PLAYED_LIMIT).map((entry) => ({
        id: entry.playable.id,
        title: entry.playable.title,
        playable: entry.playable,
      })),
    [history],
  );

  const renderRadioItem = (item: RadioRowItem) => (
    <RadioRowCard
      item={item}
      isPlaying={isActive(item.id)}
      nowPlaying={
        item.kind === 'preset' ? presetNowPlaying[item.preset.id] : undefined
      }
      onPlay={() => togglePlayback(item.id, () => playRadioRowStation(item.id))}
      onCoverChange={(presetId, iconUrl) =>
        setRadioPresets((current) =>
          current.map((entry) =>
            entry.id === presetId ? { ...entry, iconUrl } : entry,
          ),
        )
      }
      onRemove={(station) =>
        setPendingStationRemoval({ id: station.id, label: station.name })
      }
    />
  );

  const renderOnAirItem = ({ channel }: OnAirRowItem) => {
    const playableId = `live:${channel.slug}`;
    const playing = isActive(playableId);
    const warmChannelRoute = () => prefetchListenCardIntent('channel');
    return (
      <div onPointerEnter={warmChannelRoute} onFocus={warmChannelRoute}>
        <Card
          surface="neutral"
          title={
            <Link
              to="/channel/$slug"
              params={{ slug: channel.slug }}
              className="hover:underline"
            >
              {channel.user.displayName}
            </Link>
          }
          subtitle={
            <span className="font-semibold">
              {playing
                ? 'Playing now'
                : channel.state === 'LIVE'
                  ? 'Live now'
                  : 'Replay'}
            </span>
          }
          src={channel.user.avatarUrl ?? placeholderArtworkUrl(channel.slug)}
          isPlaying={playing}
          onPlay={() =>
            togglePlayback(playableId, () => void playNow(channel.slug))
          }
          onClick={() => {
            void navigate({
              to: '/channel/$slug',
              params: { slug: channel.slug },
            });
          }}
        />
      </div>
    );
  };

  const renderRecentItem = ({ playable }: RecentRowItem) => {
    // A radio station in the history opens its station page from the title,
    // like the station cards in the Radio row.
    const stationId = radioStationIdForPlayable(playable);
    return (
      <Card
        surface="neutral"
        title={
          stationId ? (
            <Link
              to="/radio/station/$stationId"
              params={{ stationId }}
              className="hover:underline"
            >
              {playable.title}
            </Link>
          ) : (
            playable.title
          )
        }
        subtitle={playable.artist}
        src={playable.coverUrl ?? placeholderArtworkUrl(playable.id)}
        isPlaying={isActive(playable.id)}
        onPlay={() => replayFromHistory(playable)}
      />
    );
  };

  const dashboardBlocks: SortableBlock[] = [
    {
      id: 'tahti-radio',
      label: 'Tahti Radio',
      content: (
        <ListenSection
          data-testid="listen-tahti-radio"
          title="Tahti Radio"
          status={sections.radio.status}
          empty={radio == null}
          emptyTitle="Tahti Radio is unavailable"
          onRetry={() => sections.retry('radio')}
        >
          {radio ? (
            <RadioListItem
              name={radioName}
              coverUrl={radioLogo}
              subtitle={`${
                radio.hlsUrl
                  ? (radio.nowPlaying?.title ?? '24/7 community stream')
                  : 'Off air'
              }${
                radio.nowPlaying?.artistName
                  ? ` · ${radio.nowPlaying.artistName}`
                  : ''
              }`}
              isPlaying={isActive(radioPlayableId)}
              disabled={!radio.hlsUrl}
              onTogglePlay={toggleRadioPlayback}
              visualPreset={radio.visualPreset}
              colorScheme={radio.colorScheme}
              colorSchemeJson={radio.colorSchemeJson}
              visualSettingsJson={radio.visualSettingsJson}
            />
          ) : null}
        </ListenSection>
      ),
    },
    ...(recentItems.length > 0
      ? [
          {
            id: 'recently-played',
            label: 'Recently played',
            content: (
              <CardsRow
                data-testid="listen-recently-played"
                title="Recently played"
                badge="History"
                badgeColor="yellow"
                items={recentItems}
                labels={{ ...ROW_LABELS, filterPlaceholder: 'Filter tracks…' }}
                renderItem={renderRecentItem}
              />
            ),
          },
        ]
      : []),
    {
      id: 'selects',
      label: 'Tahti Selects',
      content: <TahtiSelectsRow />,
    },
    {
      id: 'new-releases',
      label: 'New releases',
      content: <NewReleasesRow />,
    },
    {
      id: 'on-air',
      label: 'Live now',
      content: (
        <ListenSection
          data-testid="listen-on-air"
          title="Live now"
          badge="Live"
          badgeColor="green"
          status={sections.onAir.status}
          empty={liveItems.length === 0}
          emptyTitle="Nobody is live right now"
          emptyDescription={
            replayItems.length > 0
              ? 'Recent broadcasts are replaying below.'
              : 'Live channels show up here when an artist goes on air.'
          }
          onRetry={() => sections.retry('onAir')}
        >
          <CardsRow
            data-testid="listen-on-air"
            title="Live now"
            badge="Live"
            badgeColor="green"
            items={liveItems}
            labels={{
              ...ROW_LABELS,
              filterPlaceholder: 'Filter channels…',
            }}
            renderItem={renderOnAirItem}
          />
        </ListenSection>
      ),
    },
    ...(replayItems.length > 0
      ? [
          {
            id: 'replays',
            label: 'Replays',
            content: (
              <CardsRow
                data-testid="listen-replays"
                title="Replays"
                badge="Replay"
                badgeColor="secondary"
                items={replayItems}
                labels={{
                  ...ROW_LABELS,
                  filterPlaceholder: 'Filter channels…',
                }}
                renderItem={renderOnAirItem}
              />
            ),
          },
        ]
      : []),
    {
      id: 'trending',
      label: 'Trending',
      content: <TrendingRow />,
    },
    {
      id: 'coming-up',
      label: 'Coming up',
      content: <HomeComingUp />,
    },
    {
      id: 'new-tracks',
      label: 'New tracks',
      content: (
        <ListenSection
          data-testid="listen-new-tracks"
          title="New tracks"
          status={sections.latestTracks.status}
          empty={sections.latestTracks.data.length === 0}
          emptyTitle="No new tracks yet"
          onRetry={() => sections.retry('latestTracks')}
        >
          <section
            className="flex flex-col gap-3"
            data-testid="listen-new-tracks"
          >
            <SectionTitle
              title="New tracks"
              className="border-accent-purple/40 border-l-4 pl-3"
            />
            <div className="shadow-float rounded-[var(--radius-card)]">
              <PlayableAmbientTrackList
                items={sections.latestTracks.data}
                playAll
              />
            </div>
          </section>
        </ListenSection>
      ),
    },
    {
      id: 'radio',
      label: 'Radio',
      content: (
        <ListenSection
          data-testid="listen-radio"
          title="Radio"
          badge="Internet radio"
          badgeColor="cyan"
          status={radioItems.length > 0 ? 'ready' : sections.presets.status}
          empty={radioItems.length === 0}
          emptyTitle="No radio stations yet"
          emptyDescription={
            signedIn ? 'Add stations from the widget store.' : undefined
          }
          onRetry={() => sections.retry('presets')}
        >
          <CardsRow
            data-testid="listen-radio"
            title="Radio"
            badge="Internet radio"
            badgeColor="cyan"
            items={radioItems}
            labels={{
              ...ROW_LABELS,
              filterPlaceholder: 'Filter stations…',
            }}
            renderItem={renderRadioItem}
          />
          {sections.presets.status === 'error' ? (
            <PageError
              title="Curated stations couldn't load"
              onRetry={() => sections.retry('presets')}
            />
          ) : null}
        </ListenSection>
      ),
    },
    {
      id: 'news',
      label: 'News',
      content: <HomeNews />,
    },
    ...widgetBlocks.blocks,
    {
      id: 'disco-widgets',
      label: 'Community widgets',
      content: (
        <DiscoWidgetsSection
          widgets={sections.discoWidgets.data}
          status={sections.discoWidgets.status}
          onRetry={() => sections.retry('discoWidgets')}
        />
      ),
    },
  ];
  const orderedBlocks = orderListenBlocks(dashboardBlocks, listenOrder);

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-6">
      {tab === 'listen' ? <DiscoverGatewayBackground /> : null}
      <Tabs.Root
        selectedIndex={Math.max(
          0,
          LISTEN_SECTION_TABS.findIndex((item) => item.id === tab),
        )}
        onChange={(index) => {
          const next = LISTEN_SECTION_TABS[index];
          if (next) {
            void navigate({ to: next.to });
          }
        }}
      >
        <Tabs.List aria-label="Listen sections" className="overflow-x-auto">
          {LISTEN_SECTION_TABS.map((item) => (
            <Tabs.Tab key={item.id}>
              <TabLabel icon={<item.Icon size={14} />}>{item.label}</TabLabel>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
      <ViewShell
        title={
          tab === 'feed' ? 'Feed' : tab === 'history' ? 'History' : 'Listen'
        }
        classes={{ root: 'px-0 pt-0' }}
        actions={
          tab === 'listen' ? (
            <>
              <Tooltip
                content={reordering ? 'Done ordering' : 'Order sections'}
                side="top"
              >
                <Button
                  size="icon"
                  variant={reordering ? 'default' : 'secondary'}
                  aria-pressed={reordering}
                  aria-label="Order sections"
                  onClick={() => setReordering((on) => !on)}
                  data-testid="listen-order-toggle"
                >
                  {reordering ? (
                    <CheckIcon size={17} aria-hidden />
                  ) : (
                    <ArrowUpDownIcon size={17} aria-hidden />
                  )}
                </Button>
              </Tooltip>
              {signedIn ? <ListenWidgetStoreDialog /> : null}
            </>
          ) : undefined
        }
      >
        {tab === 'feed' ? (
          <Suspense fallback={<PageLoading label="Loading feed…" />}>
            <FeedView embedded />
          </Suspense>
        ) : null}
        {tab === 'history' ? (
          <Suspense fallback={<PageLoading label="Loading history…" />}>
            <HistoryView embedded />
          </Suspense>
        ) : null}

        {tab === 'listen' ? (
          <div className="flex flex-col gap-4" data-testid="listen-dashboard">
            {signedIn ? null : <WelcomeStrip />}
            <SortableBlocks
              blocks={orderedBlocks}
              reordering={reordering}
              onReorder={setListenOrder}
            />
            {widgetBlocks.dialog}

            <RemoveWidgetDialog
              isOpen={pendingStationRemoval != null}
              label={pendingStationRemoval?.label ?? ''}
              onCancel={() => setPendingStationRemoval(null)}
              onConfirm={() => {
                if (pendingStationRemoval) {
                  toggleStation(pendingStationRemoval.id);
                }
                setPendingStationRemoval(null);
              }}
            />
          </div>
        ) : null}
      </ViewShell>
    </div>
  );
}
