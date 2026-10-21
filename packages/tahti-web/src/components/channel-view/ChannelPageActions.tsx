import {
  FlagIcon,
  HeartIcon,
  ListMusicIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RssIcon,
  Share2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Popover, Tooltip } from '@tahti-player/ui';

import type { PublicChannel } from '../../api/types';
import { channelRssFeedUrl } from '../../lib/channelRssFeed';
import { ChannelShareButton } from '../ChannelShareButton';
import { ReportButton } from '../ReportButton';
import { RssFeedButton } from '../RssFeedButton';
import { ChannelAirBadge } from './ChannelAirBadge';
import { ChannelVizPackLabel } from './ChannelVizPackLabel';

type ChannelPageActionsProps = {
  channel: PublicChannel;
  slug: string;
  isOwner: boolean;
  isAdministrator: boolean;
  onEditDesign?: () => void;
  onOpenStreamManager?: () => void;
  /** Shown when the stage player (which carries its own Follow) is off air. */
  follow?: { following: boolean; busy: boolean; toggle: () => unknown } | null;
};

export function ChannelPageActions({
  channel,
  slug,
  isOwner,
  isAdministrator,
  onEditDesign,
  onOpenStreamManager,
  follow,
}: ChannelPageActionsProps) {
  const displayName = channel.user.displayName;
  const showShare = channel.user.showShareButton !== false;
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const copyRss = async () => {
    try {
      await navigator.clipboard.writeText(channelRssFeedUrl(slug));
      toast.success('Feed link copied. Paste it into your podcast app.');
    } catch {
      toast.error('Could not copy the feed link.');
    }
  };

  const streamManager =
    (isOwner || isAdministrator) && onOpenStreamManager ? (
      <Tooltip content="Open Stream Manager" side="top">
        <Button
          size="icon-sm"
          variant="secondary"
          onClick={onOpenStreamManager}
          aria-label="Open Stream Manager"
        >
          <ListMusicIcon size={16} aria-hidden />
        </Button>
      </Tooltip>
    ) : null;

  const editDesign =
    isOwner && onEditDesign ? (
      <Button size="sm" variant="secondary" onClick={onEditDesign}>
        <span className="inline-flex items-center gap-1.5">
          <PencilIcon size={14} aria-hidden />
          Edit design
        </span>
      </Button>
    ) : null;

  const desktopShare = showShare ? (
    <ChannelShareButton
      channelSlug={slug}
      displayName={displayName}
      iconOnly={false}
    />
  ) : null;

  const followButton = follow ? (
    <Button
      size="sm"
      variant={follow.following ? 'secondary' : 'default'}
      disabled={follow.busy}
      aria-pressed={follow.following}
      onClick={() => void follow.toggle()}
      className="gap-1.5"
    >
      <HeartIcon
        size={14}
        aria-hidden
        className={follow.following ? 'fill-current' : undefined}
      />
      {follow.following ? 'Following' : 'Follow'}
    </Button>
  ) : null;

  const desktopRss = (
    <RssFeedButton
      href={channelRssFeedUrl(slug)}
      label={`RSS feed of ${displayName}'s channel`}
    />
  );

  const desktopReport = !isOwner ? (
    <ReportButton targetType="CHANNEL" targetId={slug} label={displayName} />
  ) : null;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="channel-page-actions"
    >
      <ChannelAirBadge channel={channel} />
      <ChannelVizPackLabel channel={channel} />
      {followButton}
      {streamManager}
      <div className="hidden items-center gap-2 sm:flex">
        {editDesign}
        {desktopShare}
        {desktopRss}
        {desktopReport}
      </div>
      <div className="sm:hidden">
        <Popover
          anchor="bottom end"
          tooltip={{ content: 'More', side: 'top' }}
          trigger={
            <Button
              variant="secondary"
              size="icon-sm"
              aria-label="More channel actions"
            >
              <MoreHorizontalIcon size={16} aria-hidden />
            </Button>
          }
          panelClassName="min-w-44"
        >
          <Popover.Menu>
            {isOwner && onEditDesign ? (
              <Popover.Item
                icon={<PencilIcon size={16} />}
                onClick={onEditDesign}
              >
                Edit design
              </Popover.Item>
            ) : null}
            {showShare ? (
              <Popover.Item
                icon={<Share2Icon size={16} />}
                onClick={() => setShareOpen(true)}
              >
                Share
              </Popover.Item>
            ) : null}
            <Popover.Item
              icon={<RssIcon size={16} />}
              onClick={() => void copyRss()}
            >
              Copy RSS feed
            </Popover.Item>
            {!isOwner ? (
              <Popover.Item
                icon={<FlagIcon size={16} />}
                onClick={() => setReportOpen(true)}
              >
                Report
              </Popover.Item>
            ) : null}
          </Popover.Menu>
        </Popover>
        {showShare ? (
          <ChannelShareButton
            channelSlug={slug}
            displayName={displayName}
            open={shareOpen}
            onOpenChange={setShareOpen}
            showTrigger={false}
          />
        ) : null}
        {!isOwner ? (
          <ReportButton
            targetType="CHANNEL"
            targetId={slug}
            label={displayName}
            open={reportOpen}
            onOpenChange={setReportOpen}
            showTrigger={false}
          />
        ) : null}
      </div>
    </div>
  );
}
