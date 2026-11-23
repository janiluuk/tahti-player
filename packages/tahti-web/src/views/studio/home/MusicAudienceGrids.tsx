import {
  BarChart3Icon,
  RadioIcon,
  RocketIcon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';

import { Group, StudioActionTile } from './HomeTiles';

/** One shortcut tile per Studio top tab (Music · Broadcast · Fans · Stats · Profile). */
export function MusicAudienceGrids() {
  const { t } = useTranslation('web');

  return (
    <Group title={t('studioHomeView.studio')}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StudioActionTile
          to="/studio/releases"
          icon={RocketIcon}
          label={t('studio.music')}
          subtitle={t('studioHomeGrid.releases')}
          color="bg-primary"
        />
        <StudioActionTile
          to="/studio/broadcast"
          icon={RadioIcon}
          label={t('studio.goLive')}
          subtitle={t('studioHomeGrid.broadcast')}
          color="bg-accent-red"
        />
        <StudioActionTile
          to="/studio/fans"
          icon={UsersIcon}
          label={t('studio.fans')}
          subtitle={t('studioHomeGrid.posts')}
          color="bg-accent-blue"
        />
        <StudioActionTile
          to="/studio/stats"
          icon={BarChart3Icon}
          label={t('studio.stats')}
          subtitle={t('studioHomeGrid.playsDownloads')}
          color="bg-accent-cyan"
        />
        <StudioActionTile
          to="/studio/profile"
          icon={UserRoundIcon}
          label={t('studio.profile')}
          subtitle={t('studioHomeGrid.channelLook')}
          color="bg-accent-purple"
        />
      </div>
    </Group>
  );
}
