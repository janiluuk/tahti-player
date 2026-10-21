import {
  BarChart3Icon,
  CreditCardIcon,
  DiscAlbumIcon,
  LayoutTemplateIcon,
  LibraryBigIcon,
  MicIcon,
  NewspaperIcon,
  RocketIcon,
  Share2Icon,
  UploadCloudIcon,
  WalletIcon,
} from 'lucide-react';

import { CardGrid } from '@tahti-player/ui';

import { Group, StudioActionTile } from './HomeTiles';
import type { StudioHomeState } from './useStudioHome';

export function MusicAudienceGrids({
  state,
  stripeConfigured,
}: {
  state: StudioHomeState;
  stripeConfigured: boolean;
}) {
  const { counts } = state;

  return (
    <>
      <Group title="Music">
        <CardGrid>
          <StudioActionTile
            to="/studio/shows"
            icon={MicIcon}
            label="Shows"
            subtitle="Episodes & slots"
            color="bg-accent-purple"
          />
          <StudioActionTile
            to="/studio/sounds"
            icon={LibraryBigIcon}
            label="Music"
            subtitle={
              counts.sounds ? `${counts.sounds} items` : 'Tracks & files'
            }
            color="bg-accent-orange"
          />
          <StudioActionTile
            to="/library/upload"
            icon={UploadCloudIcon}
            label="Upload"
            subtitle="Add audio"
            color="bg-accent-blue"
          />
          <StudioActionTile
            to="/studio/collections"
            icon={DiscAlbumIcon}
            label="Collections"
            subtitle={
              counts.collections
                ? `${counts.collections} collections`
                : 'Albums, EPs, DJ sets & playlists'
            }
            color="bg-accent-yellow"
          />
          <StudioActionTile
            to="/studio/releases"
            icon={RocketIcon}
            label="Releases"
            subtitle={
              counts.releases ? `${counts.releases} releases` : 'Share releases'
            }
            color="bg-primary"
          />
          {counts.releases > 0 ? (
            <StudioActionTile
              to="/studio/distribution"
              icon={Share2Icon}
              label="Distribution"
              subtitle="Delivery status & royalties"
              color="bg-accent-cyan"
            />
          ) : null}
        </CardGrid>
      </Group>
      <Group title="Audience & channel">
        <CardGrid>
          <StudioActionTile
            to="/studio/updates"
            icon={NewspaperIcon}
            label="Updates"
            subtitle="Posts & newsletter"
            color="bg-accent-blue"
          />
          <StudioActionTile
            to="/studio/stats"
            icon={BarChart3Icon}
            label="Stats"
            subtitle="Plays & downloads"
            color="bg-accent-cyan"
          />
          <StudioActionTile
            to="/studio/audience"
            icon={WalletIcon}
            label="Revenue"
            subtitle="Orders & grants"
            color="bg-accent-yellow"
          />
          {stripeConfigured ? (
            <StudioActionTile
              to="/studio/stripe"
              icon={CreditCardIcon}
              label="Stripe"
              subtitle="Payout account"
              color="bg-accent-yellow"
            />
          ) : null}
          <StudioActionTile
            to="/studio/channel"
            icon={LayoutTemplateIcon}
            label="Channel look"
            subtitle="Design & domain"
            color="bg-accent-purple"
          />
        </CardGrid>
      </Group>
    </>
  );
}
