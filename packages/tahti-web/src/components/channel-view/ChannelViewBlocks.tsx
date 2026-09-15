import { Link } from '@tanstack/react-router';
import {
  CalendarClockIcon,
  LayoutTemplateIcon,
  MessageCircle,
  Mic,
} from 'lucide-react';

import { Button, StatChip, Tooltip } from '@tahti-player/ui';

import type { ChannelLink } from '../../api/channel-design';
import type { PublicRadioShow } from '../../api/shows';
import type { PublicChannel, TahtiPlayable } from '../../api/types';
import type { ChannelPageItem } from '../../lib/channelPageLayout';
import type { ListenerWidgetInstance } from '../../stores/listenerWidgetsStore';
import { ChannelPlaylistBlock } from '../ChannelPlaylistBlock';
import { ListenerWidgetEmbed } from '../ListenerWidgetEmbed';
import { PlayableTrackTable } from '../PlayableTrackTable';
import { ShowEpisodeList } from '../ShowEpisodeList';
import { SocialLinkIcon } from '../SocialLinkIcon';
import { Eyebrow } from '../tahti/Eyebrow';

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
  channelLinksDraft: ChannelLink[];
  liveShows: PublicRadioShow | null;
  chatOn: boolean;
  onOpenChat: () => void;
  listenerWidgetInstances: ListenerWidgetInstance[];
};

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
  const { editing, channel, slug, isOwner } = ctx;
  switch (item.type) {
    case 'hero':
      return null;
    case 'sound':
      return (
        <section id="channel-block-sound" className="flex flex-col gap-6">
          {!editing && (
            <h2 className="text-xl font-bold tracking-tight">Tracks</h2>
          )}
          {ctx.pinnedPlayables.length > 0 && (
            <div className="flex flex-col gap-3">
              <Eyebrow>Pinned</Eyebrow>
              <PlayableTrackTable
                items={ctx.pinnedPlayables}
                emptyMessage="No pinned tracks."
              />
            </div>
          )}
          <div className="flex flex-col gap-3">
            {ctx.pinnedPlayables.length > 0 && <Eyebrow>Catalog</Eyebrow>}
            <PlayableTrackTable
              items={ctx.catalogPlayables}
              emptyMessage={
                ctx.pinnedPlayables.length > 0
                  ? 'No other public tracks.'
                  : 'No public tracks for this channel yet.'
              }
            />
          </div>
        </section>
      );
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
            <div className="text-sm font-bold tracking-tight">Live chat</div>
            <p className="text-foreground-secondary text-xs">
              {ctx.chatOn
                ? 'Shown in the right sidebar Chat tab — not duplicated on this page.'
                : 'Chat is disabled for this channel.'}
            </p>
          </div>
          {ctx.chatOn ? (
            <Tooltip content="Open chat in sidebar" side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={ctx.onOpenChat}
                aria-label="Open chat in sidebar"
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
      return (
        <section id="channel-block-about" className="flex flex-col gap-3">
          {channel.user.bio ? (
            <p className="text-foreground text-sm whitespace-pre-wrap">
              {channel.user.bio}
            </p>
          ) : (
            <p className="text-foreground-secondary text-sm">No bio yet.</p>
          )}
          <Link
            to="/u/$username"
            params={{ username: channel.user.username }}
            className="text-sm underline-offset-2 hover:underline"
          >
            Full artist profile →
          </Link>
        </section>
      );
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
            <p className="text-foreground-secondary mt-1 text-xs">
              {editing
                ? 'Add links in the side panel to show them here.'
                : 'No links yet.'}
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {links
                .filter(
                  (link) =>
                    link.label.trim() &&
                    link.url.trim() &&
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
                    className={`border-border hover:border-primary/50 hover:bg-primary/5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      editing && link.hidden ? 'opacity-50' : ''
                    }`}
                  >
                    <SocialLinkIcon label={link.label} url={link.url} />
                    {link.label}
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
            Programming
          </h2>
          {nextAt || channel.nextBroadcastNote ? (
            <p className="text-foreground-secondary text-sm">
              {nextAt
                ? `Next up · ${nextAt.toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })} · ${nextAt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : null}
              {nextAt && channel.nextBroadcastNote ? ' — ' : null}
              {channel.nextBroadcastNote}
            </p>
          ) : (
            <p className="text-foreground-secondary text-sm">
              No broadcast currently scheduled.
            </p>
          )}
          <Link
            to="/schedule"
            className="text-sm underline-offset-2 hover:underline"
          >
            View full schedule →
          </Link>
        </section>
      );
    }
    case 'stats':
      return (
        <section
          className={`flex items-center gap-6 px-4 py-3 ${editing ? '' : 'border-border rounded-lg border'}`}
        >
          <StatChip value={channel.followerCount ?? '—'} label="Followers" />
        </section>
      );
    case 'events': {
      if (
        !ctx.liveShows ||
        (ctx.liveShows.upcomingEpisodes.length === 0 &&
          ctx.liveShows.pastEpisodes.length === 0)
      ) {
        return editing ? (
          <div className="px-4 py-3 text-sm">
            <h2 className="text-sm font-bold tracking-tight">Live shows</h2>
            <p className="text-foreground-secondary mt-1 text-xs">
              No scheduled or past broadcasts yet — this block shows once there
              are some.
            </p>
          </div>
        ) : null;
      }
      return (
        <section
          className={`flex flex-col gap-4 px-4 py-3 ${editing ? '' : 'border-border rounded-lg border'}`}
        >
          <h2 className="text-sm font-bold tracking-tight">Live shows</h2>
          <div className="grid gap-5 lg:grid-cols-2">
            {ctx.liveShows.upcomingEpisodes.length > 0 ? (
              <ShowEpisodeList
                title="Upcoming"
                episodes={ctx.liveShows.upcomingEpisodes}
                icon={<Mic size={16} aria-hidden />}
                channelSlug={slug}
                username={channel.user.username}
              />
            ) : null}
            {ctx.liveShows.pastEpisodes.length > 0 ? (
              <ShowEpisodeList
                title="Past recordings"
                episodes={ctx.liveShows.pastEpisodes}
                icon={<MessageCircle size={16} aria-hidden />}
                channelSlug={slug}
              />
            ) : null}
          </div>
        </section>
      );
    }
    case 'subscribe':
      return editing ? (
        <div className="px-4 py-3 text-sm">
          <h2 className="text-sm font-bold tracking-tight">
            Support {channel.user.displayName}
          </h2>
          <p className="text-foreground-secondary mt-1 text-xs">
            Fan membership pitch — links out to the subscribe page.
          </p>
          <span className="border-primary/40 text-primary mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-semibold">
            Subscribe (preview)
          </span>
        </div>
      ) : isOwner ? null : (
        <section className="border-border rounded-lg border px-4 py-3">
          <h2 className="text-sm font-bold tracking-tight">
            Support {channel.user.displayName}
          </h2>
          <p className="text-foreground-secondary mt-1 text-xs">
            Become a fan member for perks and to help keep the channel running.
          </p>
          <Link
            to="/subscribe/$username"
            params={{ username: channel.user.username }}
            className="mt-3 inline-block"
          >
            <Button size="sm" variant="secondary">
              Subscribe
            </Button>
          </Link>
        </section>
      );
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
