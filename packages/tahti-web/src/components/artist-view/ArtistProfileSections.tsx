import { Link } from '@tanstack/react-router';
import {
  CalendarDays,
  DownloadIcon,
  MessageCircle,
  Mic,
  RadioTowerIcon,
  UsersRound,
} from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { toast } from 'sonner';

import {
  Button,
  ButtonAnchor,
  ButtonLink,
  SaveButton,
  Textarea,
  Tooltip,
} from '@tahti-player/ui';

import type { PinnedAnnouncement } from '../../api/announcements';
import type { DiscoWidgetRenderItem } from '../../api/disco-widgets';
import type { PublicMention } from '../../api/mentions';
import type { PublicRadioShow } from '../../api/shows';
import { patchMeProfile, type ArtistPost } from '../../api/studio-extras';
import type { PublicProfile } from '../../api/types';
import {
  publicPressKitUrl,
  type ArtistProfileEmbed,
} from '../../lib/artistProfile';
import { DiscoWidgetsSection } from '../disco-widgets/DiscoWidgetsSection';
import { EmbedButton } from '../EmbedButton';
import { NewsletterSubscribeToggle } from '../NewsletterSubscribeToggle';
import { ShowEpisodeList } from '../ShowEpisodeList';
import { Eyebrow } from '../tahti/Eyebrow';

const headerButtonClass =
  'bg-background border-border rounded-md border-(length:--border-width)';

type Artist = PublicProfile['artist'];

export function ArtistHeaderActions({
  profile,
  isOwner,
  onEditLook,
}: {
  profile: PublicProfile;
  isOwner: boolean;
  onEditLook: () => void;
}) {
  const { artist, channel, fanTiers } = profile;
  const subscriptionsOn = artist.freeSubscriptionsEnabled !== false;
  return (
    <>
      {!isOwner && subscriptionsOn ? (
        <NewsletterSubscribeToggle
          artistUsername={artist.username}
          artistDisplayName={artist.displayName}
          iconOnly
        />
      ) : null}
      {!isOwner && subscriptionsOn && fanTiers.length > 0 ? (
        <Tooltip
          content={`Subscribe to ${artist.displayName}'s fan tiers`}
          side="top"
        >
          <ButtonLink
            to="/subscribe/$username"
            params={{ username: artist.username }}
            size="icon-sm"
            variant="secondary"
            aria-label={`Subscribe to ${artist.displayName}'s fan tiers`}
            className={headerButtonClass}
          >
            <UsersRound size={16} aria-hidden />
          </ButtonLink>
        </Tooltip>
      ) : null}
      {!isOwner && profile.links.presskit ? (
        <Tooltip content="Download press kit" side="top">
          <ButtonAnchor
            href={publicPressKitUrl(artist.username)}
            download
            size="icon-sm"
            variant="secondary"
            aria-label="Download press kit"
            className={headerButtonClass}
          >
            <DownloadIcon size={16} aria-hidden />
          </ButtonAnchor>
        </Tooltip>
      ) : null}
      {channel?.slug && !isOwner ? (
        <EmbedButton
          target={{ kind: 'channel', slug: channel.slug }}
          iconOnly
        />
      ) : null}
      {channel?.slug ? (
        <Tooltip content="Open channel" side="top">
          <ButtonLink
            to="/channel/$slug"
            params={{ slug: channel.slug }}
            size="icon-sm"
            variant="secondary"
            aria-label="Open channel"
            className={headerButtonClass}
          >
            <RadioTowerIcon size={16} aria-hidden />
          </ButtonLink>
        </Tooltip>
      ) : null}
      {isOwner && channel?.slug ? (
        <ButtonLink
          to="/channel/$slug"
          params={{ slug: channel.slug }}
          search={{ edit: true }}
          size="sm"
          variant="secondary"
          className={headerButtonClass}
        >
          Edit design
        </ButtonLink>
      ) : isOwner ? (
        <Button
          size="sm"
          variant="secondary"
          className={headerButtonClass}
          onClick={onEditLook}
        >
          Edit look
        </Button>
      ) : null}
    </>
  );
}

export function ArtistBioSection({
  artist,
  isOwner,
  discoWidgets,
  surfaceStyle,
  onFullBioSaved,
}: {
  artist: Artist;
  isOwner: boolean;
  discoWidgets: DiscoWidgetRenderItem[];
  surfaceStyle: CSSProperties;
  onFullBioSaved: (fullBio: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  if (!(editing || artist.fullBio || isOwner || discoWidgets.length > 0)) {
    return null;
  }

  const startEditing = (initial: string) => {
    setDraft(initial);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const result = await patchMeProfile({ fullBio: draft.trim() || null });
      if (!result.ok) {
        toast.error(`Could not save your bio: ${result.error}`);
        return;
      }
      onFullBioSaved(result.data.fullBio ?? null);
      setEditing(false);
      toast.success('Full bio saved');
    } catch {
      toast.error('Could not save your bio. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="flex flex-col gap-5 rounded-2xl border p-4 shadow-sm sm:p-6"
      style={surfaceStyle}
    >
      {editing ? (
        <div className="flex max-w-2xl flex-col gap-2">
          <Textarea
            autoFocus
            rows={6}
            placeholder="Share your full history — how you got started, your influences, milestones…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <SaveButton saving={saving} onClick={() => void save()} />
          </div>
        </div>
      ) : artist.fullBio ? (
        <div className="max-w-2xl">
          <p className="text-foreground text-sm whitespace-pre-wrap">
            {artist.fullBio}
          </p>
          {isOwner && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() => startEditing(artist.fullBio ?? '')}
            >
              Edit full bio
            </Button>
          )}
        </div>
      ) : isOwner ? (
        <Button
          size="sm"
          variant="secondary"
          className="self-start"
          onClick={() => startEditing('')}
        >
          + Add full bio
        </Button>
      ) : null}
      <DiscoWidgetsSection widgets={discoWidgets} />
      {isOwner && (
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            to="/studio/channel"
            className="text-foreground-secondary underline-offset-2 hover:underline"
          >
            Full studio settings
          </Link>
        </div>
      )}
    </section>
  );
}

export function ArtistLiveShows({
  shows,
  channelSlug,
  username,
  surfaceStyle,
}: {
  shows: PublicRadioShow;
  channelSlug?: string;
  username: string;
  surfaceStyle: CSSProperties;
}) {
  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border p-4 sm:p-6"
      style={surfaceStyle}
    >
      <div>
        <div className="flex items-center gap-2">
          <CalendarDays size={18} aria-hidden />
          <h2 className="font-display text-lg font-bold tracking-tight">
            Live shows
          </h2>
        </div>
        <p className="text-foreground-secondary mt-1 text-sm">
          Upcoming broadcasts and recordings from this artist on Tahti Radio.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {shows.upcomingEpisodes.length > 0 ? (
          <ShowEpisodeList
            title="Upcoming"
            episodes={shows.upcomingEpisodes}
            icon={<Mic size={16} aria-hidden />}
            channelSlug={channelSlug}
            username={username}
          />
        ) : null}
        {shows.pastEpisodes.length > 0 ? (
          <ShowEpisodeList
            title="Past recordings"
            episodes={shows.pastEpisodes}
            icon={<MessageCircle size={16} aria-hidden />}
            channelSlug={channelSlug}
          />
        ) : null}
      </div>
    </section>
  );
}

export function ArtistTaggedIn({
  mentions,
  surfaceStyle,
}: {
  mentions: PublicMention[];
  surfaceStyle: CSSProperties;
}) {
  return (
    <section className="rounded-2xl border p-4 sm:p-6" style={surfaceStyle}>
      <div className="mb-3">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Tagged in
        </h2>
        <p className="text-foreground-secondary mt-1 text-sm">
          Projects and artist pages where this artist has been credited.
        </p>
      </div>
      <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {mentions.map((mention) => (
          <li
            key={mention.id}
            className="flex items-center justify-between gap-3 p-3"
          >
            <div className="min-w-0">
              <a
                href={mention.sourceUrl ?? `/u/${mention.mentioner.username}`}
                className="text-primary truncate text-sm font-semibold hover:underline"
              >
                {mention.sourceTitle ?? mention.mentioner.displayName}
              </a>
              <p className="text-foreground-secondary text-xs">
                {mention.surface === 'TRACKLIST'
                  ? 'Tracklist credit'
                  : 'Artist description'}
                {` · by ${mention.mentioner.displayName}`}
              </p>
            </div>
            <span className="text-foreground-secondary shrink-0 text-xs">
              {new Date(mention.createdAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ArtistFeed({ posts }: { posts: ArtistPost[] }) {
  return (
    <section className="flex flex-col gap-3">
      <Eyebrow>Feed</Eyebrow>
      <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {posts.map((post) => (
          <li key={post.id} className="flex flex-col gap-1 p-3">
            {post.title ? (
              <p className="text-sm font-semibold">{post.title}</p>
            ) : null}
            <p className="text-foreground-secondary text-sm">{post.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ArtistNews({ news }: { news: PinnedAnnouncement[] }) {
  return (
    <section className="flex flex-col gap-3">
      <Eyebrow>News</Eyebrow>
      <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {news.map((item) => (
          <li key={item.id} className="p-3 text-sm">
            {item.body}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ArtistEmbeds({ embeds }: { embeds: ArtistProfileEmbed[] }) {
  return (
    <section className="flex flex-col gap-3">
      <Eyebrow>Elsewhere</Eyebrow>
      <div className="grid gap-3 lg:grid-cols-2" aria-label="Artist embeds">
        {embeds.map((embed) => (
          <div
            key={`${embed.label}-${embed.url}`}
            className="border-border bg-background/40 overflow-hidden rounded-xl border"
          >
            <div className="text-foreground-secondary px-3 py-2 text-xs font-semibold tracking-wide uppercase">
              {embed.label}
            </div>
            <iframe
              title={`${embed.label} profile`}
              src={embed.url}
              width="100%"
              height={embed.height}
              className="block w-full border-0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
