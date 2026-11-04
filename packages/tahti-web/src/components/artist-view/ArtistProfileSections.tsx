import { Link, useNavigate } from '@tanstack/react-router';
import {
  BanIcon,
  CalendarDays,
  CodeIcon,
  DownloadIcon,
  FlagIcon,
  MoreHorizontalIcon,
  RadioTowerIcon,
  RssIcon,
  UsersRound,
} from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { toast } from 'sonner';

import {
  Button,
  ButtonLink,
  EditIconButton,
  Popover,
  SaveButton,
  SectionTitle,
  Textarea,
} from '@tahti-player/ui';

import type { DiscoWidgetRenderItem } from '../../api/disco-widgets';
import type { PublicMention } from '../../api/mentions';
import type { PublicRadioShow } from '../../api/shows';
import { patchMeProfile } from '../../api/studio-extras';
import type { PublicProfile } from '../../api/types';
import {
  publicPressKitUrl,
  type ArtistProfileEmbed,
} from '../../lib/artistProfile';
import { safeCreditName } from '../../lib/displayName';
import { DiscoWidgetsSection } from '../disco-widgets/DiscoWidgetsSection';
import { EmbedButton } from '../EmbedButton';
import { ListingDate } from '../ListingDate';
import { NewsletterSubscribeToggle } from '../NewsletterSubscribeToggle';
import { ReportButton } from '../ReportButton';
import { ShowEpisodeList } from '../ShowEpisodeList';
import { Eyebrow } from '../tahti/Eyebrow';
import { ArtistBackgroundMusicButton } from './ArtistBackgroundMusicButton';
import { useArtistBlock } from './ArtistBlockButton';

const headerButtonClass =
  'bg-background border-border rounded-md border-(length:--border-width)';

type Artist = PublicProfile['artist'];

function ArtistMoreMenu({
  profile,
  isSelf,
  fanTiers,
  subscriptionsOn,
}: {
  profile: PublicProfile;
  isSelf: boolean;
  fanTiers: PublicProfile['fanTiers'];
  subscriptionsOn: boolean;
}) {
  const navigate = useNavigate();
  const { artist, channel } = profile;
  const [embedOpen, setEmbedOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const block = useArtistBlock(artist.username, artist.displayName);
  const rssHref = profile.links.feeds?.sound;
  const pressKit = !isSelf && profile.links.presskit;
  const canOpenChannel = Boolean(channel?.slug);
  const canSubscribeFanTiers =
    !isSelf && subscriptionsOn && fanTiers.length > 0;
  const canEmbed = Boolean(channel?.slug) && !isSelf;
  const canReport = Boolean(channel?.slug) && !isSelf;
  const canBlock = !isSelf && block.available;

  if (
    !rssHref &&
    !pressKit &&
    !canOpenChannel &&
    !canSubscribeFanTiers &&
    !canEmbed &&
    !canReport &&
    !canBlock
  ) {
    return null;
  }

  const copyRss = async () => {
    if (!rssHref) {
      return;
    }
    try {
      await navigator.clipboard.writeText(rssHref);
      toast.success('Feed link copied. Paste it into your podcast app.');
    } catch {
      toast.error('Could not copy the feed link.');
    }
  };

  return (
    <>
      <Popover
        anchor="bottom end"
        tooltip={{ content: 'More', side: 'top' }}
        trigger={
          <Button
            variant="secondary"
            size="icon-sm"
            aria-label={`More actions for ${artist.displayName}`}
            className={headerButtonClass}
          >
            <MoreHorizontalIcon size={16} aria-hidden />
          </Button>
        }
        panelClassName="min-w-48"
      >
        <Popover.Menu>
          {canOpenChannel && channel?.slug ? (
            <Popover.Item
              icon={<RadioTowerIcon size={16} />}
              closeOnClick
              onClick={() => {
                void navigate({
                  to: '/channel/$slug',
                  params: { slug: channel.slug },
                });
              }}
            >
              Open channel
            </Popover.Item>
          ) : null}
          {canSubscribeFanTiers ? (
            <Popover.Item
              icon={<UsersRound size={16} />}
              closeOnClick
              onClick={() => {
                void navigate({
                  to: '/subscribe/$username',
                  params: { username: artist.username },
                });
              }}
            >
              {`Subscribe to ${artist.displayName}'s fan tiers`}
            </Popover.Item>
          ) : null}
          {pressKit ? (
            <Popover.Item
              icon={<DownloadIcon size={16} />}
              onClick={() => {
                window.location.assign(publicPressKitUrl(artist.username));
              }}
            >
              Download press kit
            </Popover.Item>
          ) : null}
          {rssHref ? (
            <Popover.Item
              icon={<RssIcon size={16} />}
              onClick={() => void copyRss()}
            >
              Copy RSS feed
            </Popover.Item>
          ) : null}
          {canEmbed ? (
            <Popover.Item
              icon={<CodeIcon size={16} />}
              onClick={() => setEmbedOpen(true)}
            >
              Embed
            </Popover.Item>
          ) : null}
          {canReport ? (
            <Popover.Item
              icon={<FlagIcon size={16} />}
              onClick={() => setReportOpen(true)}
            >
              Report
            </Popover.Item>
          ) : null}
          {canBlock ? (
            <Popover.Item icon={<BanIcon size={16} />} onClick={block.toggle}>
              {block.blocked ? 'Unblock' : 'Block'}
            </Popover.Item>
          ) : null}
        </Popover.Menu>
      </Popover>
      {canEmbed && channel?.slug ? (
        <EmbedButton
          target={{ kind: 'channel', slug: channel.slug }}
          open={embedOpen}
          onOpenChange={setEmbedOpen}
          showTrigger={false}
        />
      ) : null}
      {canReport && channel?.slug ? (
        <ReportButton
          targetType="CHANNEL"
          targetId={channel.slug}
          label={artist.displayName}
          open={reportOpen}
          onOpenChange={setReportOpen}
          showTrigger={false}
        />
      ) : null}
      {canBlock ? block.dialog : null}
    </>
  );
}

export function ArtistHeaderActions({
  profile,
  isOwner,
  isSelf,
  onEditLook,
}: {
  profile: PublicProfile;
  isOwner: boolean;
  isSelf: boolean;
  onEditLook: () => void;
}) {
  const { artist, channel, fanTiers } = profile;
  const subscriptionsOn = artist.freeSubscriptionsEnabled !== false;
  return (
    <>
      <ArtistBackgroundMusicButton
        url={profile.backgroundMusicUrl}
        artistName={artist.displayName}
        className={headerButtonClass}
      />
      {!isSelf && subscriptionsOn ? (
        <NewsletterSubscribeToggle
          artistUsername={artist.username}
          artistDisplayName={artist.displayName}
          iconOnly
        />
      ) : null}
      <ArtistMoreMenu
        profile={profile}
        isSelf={isSelf}
        fanTiers={fanTiers}
        subscriptionsOn={subscriptionsOn}
      />
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
        <form
          className="flex max-w-2xl flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <Textarea
            aria-label="Full bio"
            autoFocus
            rows={6}
            placeholder="Share your full history — how you got started, your influences, milestones…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            submitOnModEnter
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <SaveButton saving={saving} type="submit" />
          </div>
        </form>
      ) : artist.fullBio ? (
        <div className="max-w-2xl">
          <p className="text-foreground text-sm whitespace-pre-wrap">
            {artist.fullBio}
          </p>
          {isOwner && (
            <EditIconButton
              label="Edit full bio"
              className="mt-2"
              onClick={() => startEditing(artist.fullBio ?? '')}
            />
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
          <SectionTitle title="Live shows" />
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
            channelSlug={channelSlug}
            username={username}
          />
        ) : null}
        {shows.pastEpisodes.length > 0 ? (
          <ShowEpisodeList
            title="Past recordings"
            episodes={shows.pastEpisodes}
            channelSlug={channelSlug}
          />
        ) : null}
      </div>
    </section>
  );
}

const MENTION_SURFACE_LABELS: Record<string, string> = {
  TRACKLIST: 'Tracklist credit',
  BIO: 'Artist description',
  ANNOUNCEMENT: 'Channel announcement',
  CHAT: 'Channel chat',
  RELEASE: 'Release notes',
  NEWSLETTER: 'Newsletter',
  DISCUSSION: 'Discussion reply',
};

function mentionerDisplayName(mention: PublicMention): string {
  const { displayName, username } = mention.mentioner;
  return safeCreditName(displayName, username) ?? username;
}

function mentionSourceTitle(mention: PublicMention): string {
  return (
    safeCreditName(mention.sourceTitle, null) ?? mentionerDisplayName(mention)
  );
}

function mentionSourcePath(mention: PublicMention): string {
  const url = mention.sourceUrl;
  return url && url.startsWith('/') && !url.startsWith('//')
    ? url
    : `/u/${mention.mentioner.username}`;
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
        <SectionTitle title="Tagged in" />
        <p className="text-foreground-secondary mt-1 text-sm">
          Projects and artist pages where this artist has been credited.
        </p>
      </div>
      <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
        {mentions.map((mention) => (
          <li
            key={mention.id}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 p-3"
          >
            <div className="min-w-0 flex-1 basis-40 break-words">
              <Link
                to={mentionSourcePath(mention) as never}
                className="text-primary-strong truncate text-sm font-semibold hover:underline"
              >
                {mentionSourceTitle(mention)}
              </Link>
              <p className="text-foreground-secondary text-xs">
                {MENTION_SURFACE_LABELS[mention.surface] ?? 'Mention'}
                {` · by ${mentionerDisplayName(mention)}`}
              </p>
            </div>
            <span className="text-foreground-secondary shrink-0 text-xs">
              <ListingDate value={mention.createdAt} />
            </span>
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
      <div
        className="grid gap-3 lg:grid-cols-2"
        role="group"
        aria-label="Artist embeds"
      >
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
