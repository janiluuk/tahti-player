import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  ArrowUpDownIcon,
  CheckIcon,
  HistoryIcon,
  ListMusicIcon,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  Card,
  CardsRow,
  preloadSortableBlocks,
  SortableBlocks,
  TabLabel,
  Tabs,
  Tooltip,
  ViewShell,
  type SortableBlock,
} from '@tahti-player/ui';

import { fetchChannel } from '../api/client';
import type { OnAirChannel } from '../api/listen';
import { AddListenWidgetDialog } from '../components/AddListenWidgetDialog';
import { DiscoWidgetsSection } from '../components/disco-widgets/DiscoWidgetsSection';
import { DiscoverGatewayBackground } from '../components/DiscoverGatewayBackground';
import { GuidelinesBanner } from '../components/GuidelinesBanner';
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
import { PageEmpty, TrackListSkeleton } from '../components/PageStates';
import {
  PlayableAmbientTrackList,
  preloadPlayableTrackTable,
} from '../components/PlayableAmbientTrackList';
import { RemoveWidgetDialog } from '../components/RemoveWidgetDialog';
import { usePhoneViewport } from '../hooks/usePhoneViewport';
import { scheduleIdleRoutePrefetch } from '../lib/idleRoutePrefetch';
import { prefetchListenCardIntent } from '../lib/intentRoutePrefetch';
import { activeListenTab } from '../lib/navigationActive';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import {
  isWidgetBlockId,
  LATEST_NEWS_BLOCK_ID,
  mergeBlockOrder,
  RADIO_BLOCK_ID,
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

type OnAirRowItem = { id: string; title: string; channel: OnAirChannel };

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
  return blockFirst(blocks, RADIO_BLOCK_ID);
}

function blockFirst(blocks: SortableBlock[], id: string): SortableBlock[] {
  const first = blocks.find((block) => block.id === id);
  return first ? [first, ...blocks.filter((block) => block !== first)] : blocks;
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
  const phone = usePhoneViewport();
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
  const hiddenListenBlockIds = useListenerWidgetsStore(
    (s) => s.hiddenListenBlockIds,
  );
  const hideListenBlock = useListenerWidgetsStore((s) => s.hideListenBlock);
  const resetListenLayout = useListenerWidgetsStore((s) => s.resetListenLayout);
  const widgetBlocks = useListenerWidgetBlocks();
  const [reordering, setReordering] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  useEffect(() => scheduleIdleRoutePrefetch(), []);
  useEffect(() => preloadPlayableTrackTable(), []);

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
  const onAirRowItems = [...liveItems, ...replayItems];

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

  const dashboardBlocks: SortableBlock[] = [
    {
      id: 'selects',
      label: t('listen.tahtiSelects'),
      content: (
        <div className="@container min-w-0" data-testid="listen-selects">
          <TahtiSelectsRow />
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
      label: t('listen.liveAndReplays'),
      content: (
        <ListenSection
          data-testid="listen-on-air"
          title={t('listen.liveAndReplays')}
          status={sections.onAir.status}
          empty={onAirRowItems.length === 0}
          emptyTitle={t('listen.nobodyLive')}
          emptyDescription={t('listen.liveChannelsAppear')}
          onRetry={() => sections.retry('onAir')}
        >
          <CardsRow
            defaultLayout="cards"
            data-testid="listen-on-air"
            title={t('listen.liveAndReplays')}
            badge={liveItems.length > 0 ? t('listen.liveBadge') : undefined}
            badgeColor="green"
            items={onAirRowItems}
            labels={{
              ...rowLabels,
              filterPlaceholder: t('listen.filterChannels'),
            }}
            renderItem={renderOnAirItem}
          />
        </ListenSection>
      ),
    },
    {
      id: 'trending',
      label: t('listen.trending'),
      content: <TrendingRow />,
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
          skeleton="list"
        >
          <div data-testid="listen-new-tracks">
            <PlayableAmbientTrackList
              items={sections.latestTracks.data}
              heading={t('listen.newTracks')}
              initialView="list"
              filterable
              className="border-border/40 bg-background-secondary/40 rounded-[var(--radius-card)] border p-2 sm:p-3"
              playAll
              getTrackMeta={latestTrackMeta}
            />
          </div>
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
  const visibleBlocks = blockFirst(
    newListener ? radioRowFirst(dashboardBlocks) : dashboardBlocks,
    LATEST_NEWS_BLOCK_ID,
  ).filter((block) => !hiddenListenBlockIds.includes(block.id));
  const orderedBlocks = orderListenBlocks(visibleBlocks, listenOrder);

  const listenActions =
    tab === 'listen' ? (
      <>
        <Tooltip
          content={
            reordering ? t('listen.doneOrdering') : t('listen.orderSections')
          }
          side="top"
        >
          <Button
            size="icon"
            variant={reordering ? 'default' : 'secondary'}
            aria-pressed={reordering}
            aria-label={t('listen.orderSections')}
            onClick={() => setReordering((on) => !on)}
            onPointerEnter={() => void preloadSortableBlocks()}
            onFocus={() => void preloadSortableBlocks()}
            data-testid="listen-order-toggle"
            className="md:w-auto md:gap-2 md:px-4"
          >
            {reordering ? (
              <CheckIcon size={17} aria-hidden />
            ) : (
              <ArrowUpDownIcon size={17} aria-hidden />
            )}
            <span aria-hidden className="hidden md:inline">
              {reordering
                ? t('listen.doneOrdering')
                : t('listen.orderSections')}
            </span>
          </Button>
        </Tooltip>
        <AddListenWidgetDialog />
        {reordering || hiddenListenBlockIds.length > 0 ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setResetOpen(true)}
            data-testid="listen-reset-widgets"
          >
            {t('listenLayout.reset')}
          </Button>
        ) : null}
      </>
    ) : undefined;

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
        <div className="flex min-w-0 items-center gap-2">
          <Tabs.List
            aria-label={t('listen.sections')}
            className="min-w-0 flex-1 overflow-x-auto"
          >
            {LISTEN_SECTION_TABS.map((item) => (
              <Tabs.Tab key={item.id}>
                <TabLabel icon={<item.Icon size={14} />}>
                  {t(item.labelKey)}
                </TabLabel>
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {phone && listenActions ? (
            <div
              className="flex shrink-0 items-center gap-2"
              data-testid="listen-phone-actions"
            >
              {listenActions}
            </div>
          ) : null}
        </div>
      </Tabs.Root>
      <ViewShell
        title={tab === 'history' ? t('listen.history') : t('nav.listen')}
        // The Listen / History tabs above already name the page.
        classes={{ root: 'px-0 pt-0', title: 'max-sm:sr-only' }}
        actions={phone ? undefined : listenActions}
      >
        {tab === 'history' ? (
          <Suspense
            fallback={
              <div
                role="status"
                aria-label={t('loading.loadingHistory')}
                className="flex flex-col gap-3"
              >
                <TrackListSkeleton rows={5} />
              </div>
            }
          >
            <HistoryView embedded />
          </Suspense>
        ) : null}

        {tab === 'listen' ? (
          <div className="flex flex-col gap-4" data-testid="listen-dashboard">
            {signedIn ? <GuidelinesBanner /> : null}
            {signedIn ? null : <WelcomeStrip />}
            {orderedBlocks.length === 0 ? (
              <PageEmpty
                title={t('listenLayout.emptyTitle')}
                description={t('listenLayout.emptyDescription')}
              />
            ) : (
              <SortableBlocks
                blocks={orderedBlocks}
                reordering={reordering}
                onReorder={setListenOrder}
                onRemove={(id) => {
                  const block = orderedBlocks.find((item) => item.id === id);
                  setPendingRemove({ id, label: block?.label ?? id });
                }}
                removeLabel={(label) => t('listenLayout.remove', { label })}
              />
            )}
            {widgetBlocks.dialog}
            <RemoveWidgetDialog
              isOpen={pendingRemove != null}
              label={pendingRemove?.label ?? ''}
              detail={t('listenLayout.removeDetail', {
                label: pendingRemove?.label ?? '',
              })}
              onCancel={() => setPendingRemove(null)}
              onConfirm={() => {
                if (pendingRemove) {
                  hideListenBlock(pendingRemove.id);
                }
                setPendingRemove(null);
              }}
            />
            <RemoveWidgetDialog
              isOpen={resetOpen}
              label={t('listenLayout.reset')}
              title={t('listenLayout.resetTitle')}
              detail={t('listenLayout.resetDetail')}
              confirmLabel={t('listenLayout.reset')}
              onCancel={() => setResetOpen(false)}
              onConfirm={() => {
                resetListenLayout();
                setResetOpen(false);
                setReordering(false);
              }}
            />
          </div>
        ) : null}
      </ViewShell>
    </div>
  );
}
