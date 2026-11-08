import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  ArrowUpDownIcon,
  CheckIcon,
  HistoryIcon,
  ListMusicIcon,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
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

import { fetchChannel } from '../api/client';
import type { OnAirChannel } from '../api/listen';
import type { TahtiPlayable } from '../api/types';
import { AddListenWidgetDialog } from '../components/AddListenWidgetDialog';
import { DiscoWidgetsSection } from '../components/disco-widgets/DiscoWidgetsSection';
import { DiscoverGatewayBackground } from '../components/DiscoverGatewayBackground';
import { GuidelinesBanner } from '../components/GuidelinesBanner';
import { HomeComingUp } from '../components/listen-view/HomeComingUp';
import {
  NewReleasesRow,
  TahtiSelectsRow,
  TrendingRow,
} from '../components/listen-view/HomeHighlights';
import { ListenSection } from '../components/listen-view/ListenSection';
import { RadioStationsRow } from '../components/listen-view/RadioStationsRow';
import {
  latestTrackMeta,
  useListenSections,
} from '../components/listen-view/useListenSections';
import { WelcomeStrip } from '../components/listen-view/WelcomeStrip';
import { useListenerWidgetBlocks } from '../components/ListenerWidgetsSection';
import { PageLoading } from '../components/PageStates';
import { PlayableAmbientTrackList } from '../components/PlayableAmbientTrackList';
import { radioStationIdForPlayable } from '../content/radioStations';
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

export type ListenTab = 'listen' | 'history';

const LISTEN_SECTION_TABS = [
  {
    id: 'listen' as const,
    labelKey: 'nav.listen' as const,
    Icon: ListMusicIcon,
    to: '/',
  },
  {
    id: 'history' as const,
    labelKey: 'listen.history' as const,
    Icon: HistoryIcon,
    to: '/listen/history',
  },
];

const RECENTLY_PLAYED_LIMIT = 20;
const RADIO_BLOCK_ID = 'radio';

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

/** Someone new to Listen (signed out, or nothing played yet) starts on the
 * radio channels; a saved section order still wins in `orderListenBlocks`. */
function radioRowFirst(blocks: SortableBlock[]): SortableBlock[] {
  const radio = blocks.find((block) => block.id === RADIO_BLOCK_ID);
  return radio ? [radio, ...blocks.filter((block) => block !== radio)] : blocks;
}

const HistoryView = lazy(() =>
  import('./HistoryView').then((m) => ({ default: m.HistoryView })),
);

export function ListenView({ tab: tabProp = 'listen' }: { tab?: ListenTab }) {
  const { t } = useTranslation('web');
  const rowLabels = {
    filterPlaceholder: t('listen.filterPlaceholder'),
    nothingFound: t('listen.nothingFound'),
  };
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const tab = activeListenTab(pathname) ?? tabProp;
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const setPlaybackStatus = usePlayerStore((s) => s.setStatus);
  const history = useLibraryStore((s) => s.history);
  const user = useAuthStore((s) => s.user);
  const signedIn = Boolean(user);
  const sections = useListenSections(signedIn, user?.id ?? '');
  const listenOrder = useListenerWidgetsStore((s) => s.listenOrder);
  const setListenOrder = useListenerWidgetsStore((s) => s.setListenOrder);
  const widgetBlocks = useListenerWidgetBlocks();
  const [reordering, setReordering] = useState(false);
  useEffect(() => scheduleIdleRoutePrefetch(), []);

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
            playing ? (
              <span className="font-semibold">{t('listen.playingNow')}</span>
            ) : (
              `@${channel.user.username}`
            )
          }
          artworkOverlay={
            channel.state === 'LIVE' ? (
              <Badge
                variant="pill"
                color="red"
                data-testid="on-air-live-marker"
                className="gap-1 font-bold tracking-wide uppercase"
              >
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-current motion-safe:animate-pulse"
                />
                {t('listen.liveBadge')}
              </Badge>
            ) : (
              <Badge variant="pill" color="secondary">
                {t('listen.replayBadge')}
              </Badge>
            )
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
      id: recentItems.length > 0 ? 'recently-played' : 'selects',
      label:
        recentItems.length > 0
          ? t('listen.recentlyPlayedAndSelects')
          : t('listen.tahtiSelects'),
      content: (
        <div className="@container min-w-0">
          <div
            data-testid="listen-history-selects"
            className={
              recentItems.length > 0
                ? 'grid min-w-0 grid-cols-1 gap-6 @3xl:grid-cols-2'
                : 'min-w-0'
            }
          >
            {recentItems.length > 0 ? (
              <div className="min-w-0">
                <CardsRow
                  defaultLayout="cards"
                  data-testid="listen-recently-played"
                  title={t('listen.recentlyPlayed')}
                  filterable={false}
                  badge={t('listen.history')}
                  badgeColor="yellow"
                  items={recentItems}
                  labels={{
                    ...rowLabels,
                    filterPlaceholder: t('listen.filterTracks'),
                  }}
                  renderItem={renderRecentItem}
                />
              </div>
            ) : null}
            <div className="min-w-0">
              <TahtiSelectsRow />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'new-releases',
      label: t('listen.newReleases'),
      content: <NewReleasesRow />,
    },
    {
      id: 'on-air',
      label: t('listen.liveNow'),
      content: (
        <ListenSection
          data-testid="listen-on-air"
          title={t('listen.liveNow')}
          badge={t('listen.liveBadge')}
          badgeColor="green"
          status={sections.onAir.status}
          empty={liveItems.length === 0}
          emptyTitle={t('listen.nobodyLive')}
          emptyDescription={
            replayItems.length > 0
              ? t('listen.replayingBelow')
              : t('listen.liveChannelsAppear')
          }
          onRetry={() => sections.retry('onAir')}
        >
          <CardsRow
            defaultLayout="cards"
            data-testid="listen-on-air"
            title={t('listen.liveNow')}
            badge={t('listen.liveBadge')}
            badgeColor="green"
            items={liveItems}
            labels={{
              ...rowLabels,
              filterPlaceholder: t('listen.filterChannels'),
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
            label: t('listen.replays'),
            content: (
              <CardsRow
                defaultLayout="cards"
                data-testid="listen-replays"
                title={t('listen.replays')}
                badge={t('listen.replayBadge')}
                badgeColor="secondary"
                items={replayItems}
                labels={{
                  ...rowLabels,
                  filterPlaceholder: t('listen.filterChannels'),
                }}
                renderItem={renderOnAirItem}
              />
            ),
          },
        ]
      : []),
    {
      id: 'trending',
      label: t('listen.trending'),
      content: <TrendingRow />,
    },
    {
      id: 'coming-up',
      label: t('listen.comingUp'),
      content: <HomeComingUp />,
    },
    {
      id: 'new-tracks',
      label: t('listen.newTracks'),
      content: (
        <ListenSection
          data-testid="listen-new-tracks"
          title={t('listen.newTracks')}
          status={sections.latestTracks.status}
          empty={sections.latestTracks.data.length === 0}
          emptyTitle={t('listen.noNewTracks')}
          onRetry={() => sections.retry('latestTracks')}
        >
          <section
            className="flex flex-col gap-3"
            data-testid="listen-new-tracks"
          >
            <SectionTitle
              title={t('listen.newTracks')}
              className="border-accent-purple/40 border-l-4 pl-3"
            />
            <div className="shadow-float rounded-[var(--radius-card)]">
              <PlayableAmbientTrackList
                items={sections.latestTracks.data}
                playAll
                getTrackMeta={latestTrackMeta}
              />
            </div>
          </section>
        </ListenSection>
      ),
    },
    {
      id: RADIO_BLOCK_ID,
      label: t('nav.radio'),
      content: (
        <RadioStationsRow
          presets={sections.presets}
          setPresets={sections.setPresets}
          onRetry={() => sections.retry('presets')}
          signedIn={signedIn}
        />
      ),
    },
    ...widgetBlocks.blocks,
    {
      id: 'disco-widgets',
      label: t('listen.communityWidgets'),
      content: (
        <DiscoWidgetsSection
          widgets={sections.discoWidgets.data}
          status={sections.discoWidgets.status}
          onRetry={() => sections.retry('discoWidgets')}
        />
      ),
    },
  ];
  const newListener = !signedIn || history.length === 0;
  const orderedBlocks = orderListenBlocks(
    newListener ? radioRowFirst(dashboardBlocks) : dashboardBlocks,
    listenOrder,
  );

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
        <Tabs.List
          aria-label={t('listen.sections')}
          className="overflow-x-auto"
        >
          {LISTEN_SECTION_TABS.map((item) => (
            <Tabs.Tab key={item.id}>
              <TabLabel icon={<item.Icon size={14} />}>
                {t(item.labelKey)}
              </TabLabel>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
      <ViewShell
        title={tab === 'history' ? t('listen.history') : t('nav.listen')}
        classes={{ root: 'px-0 pt-0' }}
        actions={
          tab === 'listen' ? (
            <>
              <Tooltip
                content={
                  reordering
                    ? t('listen.doneOrdering')
                    : t('listen.orderSections')
                }
                side="top"
              >
                <Button
                  size="icon"
                  variant={reordering ? 'default' : 'secondary'}
                  aria-pressed={reordering}
                  aria-label={t('listen.orderSections')}
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
              <AddListenWidgetDialog />
            </>
          ) : undefined
        }
      >
        {tab === 'history' ? (
          <Suspense
            fallback={<PageLoading label={t('loading.loadingHistory')} />}
          >
            <HistoryView embedded />
          </Suspense>
        ) : null}

        {tab === 'listen' ? (
          <div className="flex flex-col gap-4" data-testid="listen-dashboard">
            {signedIn ? <GuidelinesBanner /> : null}
            {signedIn ? null : <WelcomeStrip />}
            <SortableBlocks
              blocks={orderedBlocks}
              reordering={reordering}
              onReorder={setListenOrder}
            />
            {widgetBlocks.dialog}
          </div>
        ) : null}
      </ViewShell>
    </div>
  );
}
