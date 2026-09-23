import {
  BarChart3Icon,
  CreditCardIcon,
  DiscAlbumIcon,
  LayoutTemplateIcon,
  LibraryBigIcon,
  MicIcon,
  NewspaperIcon,
  RocketIcon,
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
            color="var(--accent-purple)"
          />
          <StudioActionTile
            to="/studio/sounds"
            icon={LibraryBigIcon}
            label="Music"
            subtitle={
              counts.sounds ? `${counts.sounds} items` : 'Tracks & files'
            }
            color="var(--accent-orange)"
          />
          <StudioActionTile
            to="/library/upload"
            icon={UploadCloudIcon}
            label="Upload"
            subtitle="Add audio"
            color="var(--accent-green)"
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
            color="var(--accent-yellow)"
          />
          <StudioActionTile
            to="/studio/releases"
            icon={RocketIcon}
            label="Releases"
            subtitle={
              counts.releases ? `${counts.releases} releases` : 'Share releases'
            }
            color="var(--primary)"
          />
        </CardGrid>
      </Group>
      <Group title="Audience & channel">
        <CardGrid>
          <StudioActionTile
            to="/studio/updates"
            icon={NewspaperIcon}
            label="Updates"
            subtitle="Posts & newsletter"
            color="var(--accent-blue)"
          />
          <StudioActionTile
            to="/studio/stats"
            icon={BarChart3Icon}
            label="Stats"
            subtitle="Plays & downloads"
            color="var(--accent-cyan)"
          />
          <StudioActionTile
            to="/studio/audience"
            icon={WalletIcon}
            label="Revenue"
            subtitle="Orders & grants"
            color="var(--accent-green)"
          />
          {stripeConfigured ? (
            <StudioActionTile
              to="/studio/stripe"
              icon={CreditCardIcon}
              label="Stripe"
              subtitle="Payout account"
              color="var(--accent-yellow)"
            />
          ) : null}
          <StudioActionTile
            to="/studio/channel"
            icon={LayoutTemplateIcon}
            label="Channel look"
            subtitle="Design & domain"
            color="var(--accent-purple)"
          />
        </CardGrid>
      </Group>
    </>
  );
}
