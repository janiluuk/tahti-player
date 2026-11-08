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

import { useTranslation } from '@tahti-player/i18n';

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
  const { t } = useTranslation('web');
  const { counts } = state;

  return (
    <>
      <Group title={t('studioHomeGrid.broadcast')}>
        <ShortcutGrid>
          <StudioActionTile
            to="/studio/go-live"
            icon={RadioIcon}
            label={t('studioHomeGrid.goLive')}
            subtitle={t('studioHomeGrid.keysSignalOnAir')}
            color="bg-accent-red"
          />
          <StudioActionTile
            to="/studio/schedule"
            icon={CalendarIcon}
            label={t('studioHomeGrid.schedule')}
            subtitle={t('studioHomeGrid.nextShowProgramme')}
            color="bg-accent-blue"
          />
        </ShortcutGrid>
      </Group>
      <Group title={t('studioHomeGrid.music')}>
        <ShortcutGrid>
          <StudioActionTile
            to="/studio/shows"
            icon={MicIcon}
            label={t('studioHomeGrid.shows')}
            subtitle={t('studioHomeGrid.episodesSlots')}
            color="bg-accent-purple"
          />
          <StudioActionTile
            to="/studio/sounds"
            icon={LibraryBigIcon}
            label={t('studioHomeGrid.music')}
            subtitle={
              counts.sounds ? `${counts.sounds} items` : 'Tracks & files'
            }
            color="bg-accent-orange"
          />
          <StudioActionTile
            to="/library/upload"
            icon={UploadCloudIcon}
            label={t('studioHomeGrid.upload')}
            subtitle={t('studioHomeGrid.addAudio')}
            color="bg-accent-blue"
          />
          <StudioActionTile
            to="/studio/collections"
            icon={DiscAlbumIcon}
            label={t('studioHomeGrid.collections')}
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
            label={t('studioHomeGrid.releases')}
            subtitle={
              counts.releases ? `${counts.releases} releases` : 'Share releases'
            }
            color="bg-primary"
          />
          {counts.releases > 0 ? (
            <StudioActionTile
              to="/studio/distribution"
              icon={Share2Icon}
              label={t('studioHomeGrid.distribution')}
              subtitle={t('studioHomeGrid.deliveryStatusRoyalties')}
              color="bg-accent-cyan"
            />
          ) : null}
        </ShortcutGrid>
      </Group>
      <Group title={t('studioHomeGrid.audienceChannel')}>
        <ShortcutGrid>
          <StudioActionTile
            to="/studio/updates"
            icon={NewspaperIcon}
            label={t('studioHomeGrid.posts')}
            subtitle={t('studioHomeGrid.updatesNewsletter')}
            color="bg-accent-blue"
          />
          <StudioActionTile
            to="/studio/stats"
            icon={BarChart3Icon}
            label={t('studioHomeGrid.stats')}
            subtitle={t('studioHomeGrid.playsDownloads')}
            color="bg-accent-cyan"
          />
          <StudioActionTile
            to="/studio/audience"
            icon={WalletIcon}
            label={t('studioHomeGrid.earnings')}
            subtitle={t('studioHomeGrid.ordersGrants')}
            color="bg-accent-yellow"
          />
          {stripeConfigured ? (
            <StudioActionTile
              to="/studio/stripe"
              icon={CreditCardIcon}
              label={t('studioHomeGrid.stripe')}
              subtitle={t('studioHomeGrid.payoutAccount')}
              color="bg-accent-yellow"
            />
          ) : null}
          <StudioActionTile
            to="/studio/channel"
            icon={LayoutTemplateIcon}
            label={t('studioHomeGrid.channelLook')}
            subtitle={t('studioHomeGrid.designDomain')}
            color="bg-accent-purple"
          />
        </ShortcutGrid>
      </Group>
    </>
  );
}
