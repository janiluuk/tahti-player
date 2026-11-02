import {
  BarChart3Icon,
  CalendarIcon,
  CreditCardIcon,
  DiscAlbumIcon,
  LayoutTemplateIcon,
  LibraryBigIcon,
  MicIcon,
  NewspaperIcon,
  RadioIcon,
  RocketIcon,
  Share2Icon,
  UploadCloudIcon,
  WalletIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Group, StudioActionTile } from './HomeTiles';
import type { StudioHomeState } from './useStudioHome';

function ShortcutGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}

/** The dashboard's action shortcuts: small one-line tiles, grouped. */
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
      <Group title="Broadcast">
        <ShortcutGrid>
          <StudioActionTile
            to="/studio/go-live"
            icon={RadioIcon}
            label="Go live"
            subtitle="Keys, signal, on-air"
            color="bg-accent-red"
          />
          <StudioActionTile
            to="/studio/schedule"
            icon={CalendarIcon}
            label="Schedule"
            subtitle="Next show & programme"
            color="bg-accent-blue"
          />
        </ShortcutGrid>
      </Group>
      <Group title="Music">
        <ShortcutGrid>
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
        </ShortcutGrid>
      </Group>
      <Group title="Audience & channel">
        <ShortcutGrid>
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
        </ShortcutGrid>
      </Group>
    </>
  );
}
