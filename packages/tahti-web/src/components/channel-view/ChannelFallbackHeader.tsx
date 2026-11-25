import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { ClampedText } from '@tahti-player/ui';

import { isHeaderImageUrl } from '../../api/channel-design';
import type { PublicChannel } from '../../api/types';
import { avatarPoster } from '../../lib/avatarPoster';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../EntitySocialHeader';
import { ChannelTopBar } from './ChannelTopBar';

type ChannelFallbackHeaderProps = {
  channel: PublicChannel;
  editing: boolean;
  subtle: boolean;
  actions: ReactNode;
  backButton: ReactNode;
  stats: EntitySocialStat[];
  statsDimmed: boolean;
  onSelectHeader: () => void;
  stagePlayer: ReactNode;
};

/** Top of a channel page whose layout has no hero block: top bar, page
 * actions, the social header and the stage player that the hero would
 * otherwise carry. */
export function ChannelFallbackHeader({
  channel,
  editing,
  subtle,
  actions,
  backButton,
  stats,
  statsDimmed,
  onSelectHeader,
  stagePlayer,
}: ChannelFallbackHeaderProps) {
  return (
    <>
      <ChannelTopBar text={channel.topBarText} />
      {actions ? (
        <div className="flex flex-wrap items-center justify-end gap-2 pl-14">
          {actions}
        </div>
      ) : null}

      {(editing || channel.user.showPageHero !== false) && (
        <div
          onClick={() => {
            if (editing) {
              onSelectHeader();
            }
          }}
          className={editing ? 'cursor-pointer rounded-lg' : undefined}
        >
          <EntitySocialHeader
            compactOnPhone
            leading={editing ? undefined : backButton}
            title={channel.user.displayName}
            isMember={channel.user.isMember}
            imageUrl={
              channel.user.avatarUrl ??
              placeholderArtworkUrl(channel.user.username)
            }
            imagePosterUrl={avatarPoster(channel.user)}
            roundImage
            colorScheme={channel.colorScheme}
            subtitle={
              <Link
                to="/u/$username"
                params={{ username: channel.user.username }}
                className="hover:text-foreground underline-offset-2 hover:underline"
              >
                @{channel.user.username}
              </Link>
            }
            description={
              channel.user.bio ? (
                <ClampedText className="whitespace-pre-wrap">
                  {channel.user.bio}
                </ClampedText>
              ) : null
            }
            backdropUrl={
              channel.videoBackgroundUrl &&
              isHeaderImageUrl(channel.videoBackgroundUrl)
                ? channel.videoBackgroundUrl
                : null
            }
            stats={stats}
            statsDimmed={statsDimmed}
            data-testid="channel-social-header"
          />
        </div>
      )}

      <div
        className={
          subtle
            ? 'border-border/60 overflow-hidden rounded-lg border'
            : 'border-border overflow-hidden rounded-xl border'
        }
        data-testid="channel-stage-player-fixed"
      >
        {stagePlayer}
      </div>
    </>
  );
}
