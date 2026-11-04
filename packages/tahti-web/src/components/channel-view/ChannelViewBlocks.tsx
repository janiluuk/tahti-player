import { Link } from '@tanstack/react-router';
import {
  CalendarClockIcon,
  LayoutTemplateIcon,
  MessageCircle,
} from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { i18n } from '@tahti-player/i18n';
import { Badge, Button, StatChip, Tooltip } from '@tahti-player/ui';

import type { ChannelLink } from '../../api/channel-design';
import type { PublicRadioShow } from '../../api/shows';
import type { PublicChannel, TahtiPlayable } from '../../api/types';
import type { ChannelPageItem } from '../../lib/channelPageLayout';
import { isSafeChannelLinkUrl } from '../../lib/safeHref';
import { splitEmbedPlayables } from '../../lib/splitEmbedPlayables';
import type { ListenerWidgetInstance } from '../../stores/listenerWidgetsStore';
import { ChannelStoryFeed } from '../ArtistStoryFeed';
import { ChannelPlaylistBlock } from '../ChannelPlaylistBlock';
import { ListenerWidgetEmbed } from '../ListenerWidgetEmbed';
import { PageEmpty, PageError, PageLoading } from '../PageStates';
import { PlayableAmbientTrackList } from '../PlayableAmbientTrackList';
import { ProfileSection } from '../ProfileSection';
import { ShowEpisodeList } from '../ShowEpisodeList';
import { SocialLinkIcon } from '../SocialLinkIcon';
import { Eyebrow } from '../tahti/Eyebrow';
import { ChannelCatalogSections } from './ChannelCatalogSections';
import type { ChannelTrackMeta } from './channelTrackMeta';
import { RadioProgrammingGrid } from './RadioProgrammingGrid';
import type { ChannelSection, ChannelSectionStatus } from './useChannelData';

/** Booked live slots (`/api/v1/radio/slots`) all air on this station. */
const TAHTI_RADIO_SLUG = 'tahti-radio';

/** Render-inputs for the small `ChannelPageItem` block types -- everything
 * `renderChannelBlock` below needs, and nothing more (no state, no effects,
 * no handler this file owns). `hero` (the player stage + header, ~50+
 * closure variables) stays in ChannelView.tsx itself; this covers the
 * other 11 types. */
export type ChannelBlockRenderContext = {
  editing: boolean;
  channel: PublicChannel;
  slug: string;
  isOwner: boolean;
  pinnedPlayables: TahtiPlayable[];
  catalogPlayables: TahtiPlayable[];
  /** Genre and public totals per track row (from the channel's items). */
  getTrackMeta: ChannelTrackMeta;
  channelLinksDraft: ChannelLink[];
  liveShows: PublicRadioShow | null;
  sectionStatus: Record<ChannelSection, ChannelSectionStatus>;
  onRetrySection: (section: ChannelSection) => void;
  chatOn: boolean;
  onOpenChat: () => void;
  listenerWidgetInstances: ListenerWidgetInstance[];
};

function ChannelTrackRows({
  items,
  pinnedPlayables,
  getTrackMeta,
  emptyMessage,
}: {
  items: TahtiPlayable[];
  pinnedPlayables: TahtiPlayable[];
  getTrackMeta: ChannelTrackMeta;
  emptyMessage: string;
}) {
  const pinnedIds = useMemo(
    () => new Set(pinnedPlayables.map((item) => item.id)),
    [pinnedPlayables],
  );
  const pinnedNote = useCallback(
    (item: TahtiPlayable) =>
      pinnedIds.has(item.id) ? (
        <Eyebrow tone="muted">{i18n.t('web:channelBlocks.pinned')}</Eyebrow>
      ) : null,
    [pinnedIds],
  );
  return (
    <PlayableAmbientTrackList
      items={items}
      playAll
      filterable
      allowGrid={false}
      className="bg-background-secondary"
      getTrackMeta={getTrackMeta}
      getAnnotation={pinnedIds.size > 0 ? pinnedNote : undefined}
      emptyMessage={emptyMessage}
    />
  );
}

/** The channel's tracks hosted on other sites (hearthis.at, SoundCloud,
 * Mixcloud…), shown on the page's own Embeds tab. */
export function ChannelEmbedsSection({
  embeds,
  pinnedPlayables,
  getTrackMeta,
}: {
  embeds: TahtiPlayable[];
  pinnedPlayables: TahtiPlayable[];
  getTrackMeta: ChannelTrackMeta;
}) {
  return (
    <ProfileSection
      id="channel-block-embeds"
      className="gap-3"
      title={i18n.t('web:channelBlocks.embeds')}
      data-testid="channel-embeds"
    >
      <ChannelTrackRows
        items={embeds}
        pinnedPlayables={pinnedPlayables}
        getTrackMeta={getTrackMeta}
        emptyMessage={i18n.t('web:channelBlocks.embedsEmpty')}
      />
    </ProfileSection>
  );
}

function ChannelSoundSections({ ctx }: { ctx: ChannelBlockRenderContext }) {
  const { tracks, embeds } = useMemo(
    () =>
      splitEmbedPlayables([...ctx.pinnedPlayables, ...ctx.catalogPlayables]),
    [ctx.pinnedPlayables, ctx.catalogPlayables],
  );
  return (
    <ProfileSection
      id="channel-block-sound"
      className="gap-3"
      title={ctx.editing ? undefined : i18n.t('web:channelBlocks.tracks')}
      status={ctx.sectionStatus.sounds}
      loadingLabel={i18n.t('web:channelBlocks.loadingTracks')}
      errorTitle={i18n.t('web:channelBlocks.tracksErrorTitle')}
      errorDescription={i18n.t('web:channelBlocks.tracksErrorDescription')}
      onRetry={() => ctx.onRetrySection('sounds')}
      empty={
        tracks.length > 0
          ? null
          : embeds.length > 0
            ? {
                title: i18n.t('web:channelBlocks.noTracksHosted'),
                description: i18n.t(
                  'web:channelBlocks.noTracksHostedDescription',
                ),
              }
            : {
                title: i18n.t('web:channelBlocks.noPublicTracks'),
                description: i18n.t(
                  'web:channelBlocks.noPublicTracksDescription',
                ),
              }
      }
    >
      <ChannelTrackRows
        items={tracks}
        pinnedPlayables={ctx.pinnedPlayables}
        getTrackMeta={ctx.getTrackMeta}
        emptyMessage={i18n.t('web:channelBlocks.noPublicTracksEmpty')}
      />
    </ProfileSection>
  );
}

/** Renders one `ChannelPageItem`'s block content. `hero` is handled
 * directly in `ChannelView.tsx` before this is ever called for it -- the
 * case below is dead in practice, kept only so this function preserves the
 * original file's compile-time exhaustiveness guard: adding a type to
 * `CHANNEL_PAGE_ITEM_TYPES` without a matching case here now fails the
 * build instead of silently rendering nothing. */
export function renderChannelBlock(
  item: ChannelPageItem,
  ctx: ChannelBlockRenderContext,
) {
  const { editing, channel, slug } = ctx;
  switch (item.type) {
    case 'hero':
      return null;
    case 'sound': {
      return (
        <>
          <ChannelSoundSections ctx={ctx} />
          {channel.channelKind === 'RADIO' ? null : (
            <ChannelCatalogSections
              username={channel.user.username}
              displayName={channel.user.displayName}
              channelSlug={slug}
            />
          )}
        </>
      );
    }
    case 'chat':
      // Chat lives in the Nuclear right rail only — never embed a second panel.
      return (
        <section
          className={`flex max-w-xl items-center gap-3 px-4 py-3 ${editing ? '' : 'border-border rounded-lg border border-dashed'}`}
        >
          <MessageCircle
            size={18}
            className="text-foreground-secondary shrink-0 opacity-70"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold tracking-tight">
              {i18n.t('web:channelBlocks.liveChat')}
            </div>
            <p className="text-foreground-secondary text-xs">
              {ctx.chatOn
                ? i18n.t('web:channelBlocks.chatOpenDescription')
                : i18n.t('web:channelBlocks.chatDisabled')}
            </p>
          </div>
          {ctx.chatOn ? (
            <Tooltip
              content={i18n.t('web:channelBlocks.openLiveChat')}
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={ctx.onOpenChat}
                aria-label={i18n.t('web:channelBlocks.openLiveChat')}
              >
                <MessageCircle size={16} aria-hidden />
              </Button>
            </Tooltip>
          ) : null}
        </section>
      );
    case 'navigation': {
      const navTabCount = item.navigationTabs?.length ?? 0;
      return (
        <section
          className={`flex max-w-xl items-center gap-3 px-4 py-3 ${editing ? '' : 'border-border rounded-lg border border-dashed'}`}
        >
          <LayoutTemplateIcon
            size={18}
            className="text-foreground-secondary shrink-0 opacity-70"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold tracking-tight">Navigation</div>
            <p className="text-foreground-secondary text-xs">
              {navTabCount >= 2
                ? `${navTabCount} tabs shown under the player.`
                : 'Off — add a second tab to show the bar under the player.'}
            </p>
          </div>
        </section>
      );
    }
    case 'about':
      // Folded into the backdrop (ChannelBackdropCard's bioVisible, driven
      // by this same item's `visible` flag) -- never reaches this
      // function in practice since ChannelView filters BACKDROP_FOLDED_
      // ITEM_TYPES out of the rendered item list before renderBlock ever
      // sees them. Kept only for the exhaustiveness guard (see this file's
      // top-of-function comment).
      return null;
    case 'links': {
      const links = editing
        ? ctx.channelLinksDraft
        : (channel.channelLinks ?? []);
      return (
        <section
          className={`px-4 py-3 ${editing ? '' : 'border-border rounded-lg border'}`}
        >
          <h2 className="text-sm font-bold tracking-tight">Links</h2>
          {links.length === 0 ? (
            <PageEmpty
              title={
                editing
                  ? 'Add links in the side panel to show them here.'
                  : 'No links yet.'
              }
            />
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {links
                .filter(
                  (link) =>
                    link.label.trim() &&
                    link.url.trim() &&
                    isSafeChannelLinkUrl(link.url) &&
                    (editing || !link.hidden),
                )
                .map((link) => (
                  <a
                    key={`${link.label}-${link.url}`}
                    href={link.url}
                    target={
                      link.url.startsWith('mailto:') ? undefined : '_blank'
                    }
                    rel="noopener noreferrer"
                    className={
                      editing && link.hidden ? 'opacity-50' : undefined
                    }
                  >
                    <Badge variant="pill" color="secondary" className="gap-1.5">
                      <SocialLinkIcon label={link.label} url={link.url} />
                      {link.label}
                    </Badge>
                  </a>
                ))}
            </div>
          )}
        </section>
      );
    }
    case 'programming': {
      const nextAt = channel.nextBroadcastAt
        ? new Date(channel.nextBroadcastAt)
        : null;
      return (
        <section
          id="channel-block-programming"
          className={`flex flex-col gap-3 px-4 py-3 ${editing ? '' : 'border-border rounded-lg border'}`}
        >
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <CalendarClockIcon size={16} aria-hidden />
            {i18n.t('web:channelBlocks.programming')}
          </h2>
          {nextAt || channel.nextBroadcastNote ? (
            <p className="text-foreground-secondary text-sm">
              {nextAt
                ? i18n.t('web:channelBlocks.nextUp', {
                    when: `${nextAt.toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })} · ${nextAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`,
                  })
                : null}
              {nextAt && channel.nextBroadcastNote ? ' — ' : null}
              {channel.nextBroadcastNote}
            </p>
          ) : (
            <PageEmpty
              title={i18n.t('web:channelBlocks.noBroadcastScheduled')}
            />
          )}
          {slug === TAHTI_RADIO_SLUG ? <RadioProgrammingGrid /> : null}
          <Link
            to="/schedule"
            className="text-sm underline-offset-2 hover:underline"
          >
            {i18n.t('web:channelBlocks.viewFullSchedule')}
          </Link>
        </section>
      );
    }
    case 'stats':
      return (
        <section
          className={`flex items-center gap-6 px-4 py-3 ${editing ? '' : 'border-border rounded-lg border'}`}
        >
          <StatChip
            value={channel.followerCount ?? '—'}
            label={i18n.t('web:channelBlocks.followers')}
          />
        </section>
      );
    case 'events': {
      if (ctx.sectionStatus.shows !== 'ready') {
        return (
          <section
            className={`flex flex-col gap-2 px-4 py-3 ${editing ? '' : 'border-border rounded-lg border'}`}
          >
            <h2 className="text-sm font-bold tracking-tight">
              {i18n.t('web:channelBlocks.liveShows')}
            </h2>
            {ctx.sectionStatus.shows === 'loading' ? (
              <PageLoading label={i18n.t('web:channelBlocks.loadingShows')} />
            ) : (
              <PageError
                title={i18n.t('web:channelBlocks.showsError')}
                onRetry={() => ctx.onRetrySection('shows')}
              />
            )}
          </section>
        );
      }
      if (
        !ctx.liveShows ||
        (ctx.liveShows.upcomingEpisodes.length === 0 &&
          ctx.liveShows.pastEpisodes.length === 0)
      ) {
        return (
          <section
            className={`flex flex-col gap-2 px-4 py-3 ${editing ? '' : 'border-border rounded-lg border'}`}
          >
            <h2 className="text-sm font-bold tracking-tight">
              {i18n.t('web:channelBlocks.liveShows')}
            </h2>
            <PageEmpty
              title={i18n.t('web:channelBlocks.noShowsTitle')}
              description={
                editing
                  ? i18n.t('web:channelBlocks.noShowsEditingDescription')
                  : i18n.t('web:channelBlocks.noShowsDescription')
              }
            />
          </section>
        );
      }
      return (
        <section
          className={`flex flex-col gap-4 px-4 py-3 ${editing ? '' : 'border-border rounded-lg border'}`}
        >
          <h2 className="text-sm font-bold tracking-tight">
            {i18n.t('web:channelBlocks.liveShows')}
          </h2>
          <div className="grid gap-5 lg:grid-cols-2">
            {ctx.liveShows.upcomingEpisodes.length > 0 ? (
              <ShowEpisodeList
                title={i18n.t('web:channelBlocks.upcoming')}
                episodes={ctx.liveShows.upcomingEpisodes}
                channelSlug={slug}
                username={channel.user.username}
              />
            ) : null}
            {ctx.liveShows.pastEpisodes.length > 0 ? (
              <ShowEpisodeList
                title={i18n.t('web:channelBlocks.pastRecordings')}
                episodes={ctx.liveShows.pastEpisodes}
                channelSlug={slug}
              />
            ) : null}
          </div>
        </section>
      );
    }
    case 'subscribe':
      // Folded into the backdrop (ChannelBackdropCard's subscribeVisible
      // CTA button, driven by this same item's `visible` flag) -- see the
      // 'about' case above for why this never actually runs.
      return null;
    case 'embed': {
      const instance = ctx.listenerWidgetInstances.find(
        (candidate) => candidate.id === item.embedInstanceId,
      );
      return instance ? <ListenerWidgetEmbed instance={instance} /> : null;
    }
    case 'playlist':
      return item.playlistSlug ? (
        <ChannelPlaylistBlock
          playlistSlug={item.playlistSlug}
          display={item.playlistDisplay ?? 'tracklist'}
          editing={editing}
        />
      ) : null;
    case 'avatar':
      // Folded into the backdrop (ChannelBackdropCard's avatarVisible) --
      // see the 'about' case above for why this never actually runs.
      return null;
    case 'feed':
      return (
        <ChannelStoryFeed
          slug={slug}
          editing={editing}
          author={{
            username: channel.user.username,
            displayName: channel.user.displayName,
            avatarUrl: channel.user.avatarUrl ?? null,
          }}
        />
      );
    default: {
      // Exhaustiveness guard: adding a type to CHANNEL_PAGE_ITEM_TYPES
      // without a matching case here used to compile fine and silently
      // render nothing — this turns that into a build error instead.
      const unhandled: never = item.type;
      void unhandled;
      return null;
    }
  }
}
