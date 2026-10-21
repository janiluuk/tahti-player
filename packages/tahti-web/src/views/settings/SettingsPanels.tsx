import { lazy, Suspense, type ReactNode } from 'react';

import { Loader } from '@tahti-player/ui';

import { hasAccountRole } from '../../lib/accountRoles';
import { useAuthStore } from '../../stores/authStore';
import { WhatsNewPanel } from '../WhatsNewView';
import { AccountPanel } from './panels/AccountPanel';
import { ArtistPanel, ReleaseVisualDefaultsPanel } from './panels/ArtistPanel';
import { BroadcastPanel, type BroadcastSection } from './panels/BroadcastPanel';
import { ChannelPanel } from './panels/ChannelPanel';
import { IntegrationsPanel } from './panels/IntegrationsPanel';
import { LogsPanel } from './panels/LogsPanel';
import { PlaybackPanel } from './panels/PlaybackPanel';
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
  const user = useAuthStore((s) => s.user);
  const signedIn = Boolean(user);
  const isBoard = hasAccountRole(user, 'BOARD');
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
      content = <PlaybackPanel />;
      break;
    case 'integrations':
      content = <IntegrationsPanel />;
      break;
    case 'themes':
      content = <ThemesPanel />;
      break;
    case 'logs':
      content = <LogsPanel />;
      break;
    case 'plugin-store':
      content = (
        <Suspense
          fallback={
            <div className="flex min-h-48 items-center justify-center">
              <Loader aria-label="Loading add-ons" />
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

  const navItem = settingsNavFor({ signedIn, hasChannel, isBoard }).find(
    (item) => item.id === section,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {navItem?.label}
        </h1>
        {navItem?.description ? (
          <p className="text-foreground-secondary text-sm">
            {navItem.description}
          </p>
        ) : null}
      </header>
      {content}
    </div>
  );
}
