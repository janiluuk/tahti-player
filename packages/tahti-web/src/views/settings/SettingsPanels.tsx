import { lazy, Suspense, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Loader } from '@tahti-player/ui';

import { useAuthStore } from '../../stores/authStore';
import { WhatsNewPanel } from '../WhatsNewView';
import { AccountPanel } from './panels/AccountPanel';
import { ArtistPanel, ReleaseVisualDefaultsPanel } from './panels/ArtistPanel';
import { BroadcastPanel, type BroadcastSection } from './panels/BroadcastPanel';
import { ChannelPanel } from './panels/ChannelPanel';
import { IntegrationsPanel } from './panels/IntegrationsPanel';
import { PlaybackLanguagePanel } from './panels/PlaybackLanguagePanel';
import { ThemesPanel } from './panels/ThemesPanel';
import { settingsNavFor, type SettingsSectionId } from './settingsNav';

const PluginStorePanel = lazy(() =>
  import('../../components/PluginStorePanel').then((module) => ({
    default: module.PluginStorePanel,
  })),
);

export { BroadcastPanel, type BroadcastSection, ReleaseVisualDefaultsPanel };

export function SettingsSectionBody({
  section,
}: {
  section: SettingsSectionId;
}) {
  let content: ReactNode;
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const signedIn = Boolean(user);
  const hasChannel = useAuthStore(
    (s) => Boolean(s.user?.channel) || !s.profileLoaded,
  );

  switch (section) {
    case 'account':
      content = <AccountPanel />;
      break;
    case 'artist':
      content = <ArtistPanel />;
      break;
    case 'channel':
      content = <ChannelPanel />;
      break;
    case 'broadcast':
      content = <BroadcastPanel />;
      break;
    case 'playback':
      content = <PlaybackLanguagePanel />;
      break;
    case 'integrations':
      content = <IntegrationsPanel />;
      break;
    case 'themes':
      content = <ThemesPanel />;
      break;
    case 'plugin-store':
      content = (
        <Suspense
          fallback={
            <div className="flex min-h-48 items-center justify-center">
              <Loader aria-label={t('settingsAddOns.loading')} />
            </div>
          }
        >
          <PluginStorePanel />
        </Suspense>
      );
      break;
    case 'whats-new':
      content = <WhatsNewPanel />;
      break;
    default:
      return null;
  }

  const navItem = settingsNavFor({ signedIn, hasChannel }).find(
    (item) => item.id === section,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {navItem ? t(navItem.labelKey) : null}
        </h1>
        {navItem?.descriptionKey ? (
          <p className="text-foreground-secondary text-sm">
            {t(navItem.descriptionKey)}
          </p>
        ) : null}
      </header>
      {content}
    </div>
  );
}
