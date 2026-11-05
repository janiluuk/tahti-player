import {
  FlagIcon,
  HeartIcon,
  ListMusicIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RadioTowerIcon,
  RssIcon,
  Share2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Button, ButtonLink, Popover, Tooltip } from '@tahti-player/ui';

import type { PublicChannel } from '../../api/types';
import { channelRssFeedUrl } from '../../lib/channelRssFeed';
import { ChannelShareButton } from '../ChannelShareButton';
import { ReportButton } from '../ReportButton';
import { RssFeedButton } from '../RssFeedButton';
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
  const { t } = useTranslation('web');
  const displayName = channel.user.displayName;
  const showShare = channel.user.showShareButton !== false;
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const copyRss = async () => {
    try {
      await navigator.clipboard.writeText(channelRssFeedUrl(slug));
      toast.success(t('channelShare.feedCopied'));
    } catch {
      toast.error(t('channelShare.feedCopyFailed'));
    }
  };

  const openRadio =
    channel.channelKind === 'RADIO' ? (
      <Tooltip content={t('channelPage.openRadio')} side="top">
        <ButtonLink
          to="/radio"
          size="icon-sm"
          variant="secondary"
          aria-label={t('channelPage.openRadio')}
          data-testid="channel-open-radio"
        >
          <RadioTowerIcon size={16} aria-hidden />
        </ButtonLink>
      </Tooltip>
    ) : null;

  const streamManager =
    (isOwner || isAdministrator) && onOpenStreamManager ? (
      <Tooltip content={t('channelPage.openStreamManager')} side="top">
        <Button
          size="icon-sm"
          variant="secondary"
          onClick={onOpenStreamManager}
          aria-label={t('channelPage.openStreamManager')}
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
          {t('channelPage.editDesign')}
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
      {follow.following ? t('actions.following') : t('actions.follow')}
    </Button>
  ) : null;

  // The share dialog carries the feed link; a channel that hides Share
  // still needs a way to reach its RSS feed.
  const desktopRss = showShare ? null : (
    <RssFeedButton
      href={channelRssFeedUrl(slug)}
      label={t('channelPage.rssFeedOf', { name: displayName })}
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
      <ChannelVizPackLabel channel={channel} />
      {followButton}
      {openRadio}
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
          tooltip={{ content: t('nav.more'), side: 'top' }}
          trigger={
            <Button
              variant="text"
              size="icon-sm"
              aria-label={t('channelPage.moreActions')}
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
                {t('channelPage.editDesign')}
              </Popover.Item>
            ) : null}
            {showShare ? (
              <Popover.Item
                icon={<Share2Icon size={16} />}
                onClick={() => setShareOpen(true)}
              >
                {t('actions.share')}
              </Popover.Item>
            ) : null}
            {showShare ? null : (
              <Popover.Item
                icon={<RssIcon size={16} />}
                onClick={() => void copyRss()}
              >
                {t('channelShare.copyRss')}
              </Popover.Item>
            )}
            {!isOwner ? (
              <Popover.Item
                icon={<FlagIcon size={16} />}
                onClick={() => setReportOpen(true)}
              >
                {t('channelPage.report')}
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
