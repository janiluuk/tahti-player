import { InfoIcon } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { Box, Button, Tooltip } from '@tahti-player/ui';

import { PluginStorePanel } from '../../components/PluginStorePanel';
import { WhatsNewPanel } from '../WhatsNewView';
import { AccountPanel } from './panels/AccountPanel';
import { ArtistPanel, ReleaseVisualDefaultsPanel } from './panels/ArtistPanel';
import { BroadcastPanel, type BroadcastSection } from './panels/BroadcastPanel';
import { ChannelPanel } from './panels/ChannelPanel';
import { ThemesPanel } from './panels/ThemesPanel';
import { SETTINGS_NAV, type SettingsSectionId } from './settingsNav';

export { BroadcastPanel, type BroadcastSection, ReleaseVisualDefaultsPanel };

export function SettingsSectionBody({
  section,
}: {
  section: SettingsSectionId;
}) {
  let content: ReactNode;
  const [showAddonInfo, setShowAddonInfo] = useState(false);

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
    case 'themes':
      content = <ThemesPanel />;
      break;
    case 'plugin-store':
      content = <PluginStorePanel />;
      break;
    case 'whats-new':
      content = <WhatsNewPanel />;
      break;
    default:
      return null;
  }

  const navItem = SETTINGS_NAV.find((item) => item.id === section);
  const isAddonStore = section === 'plugin-store';

  useEffect(() => {
    if (!isAddonStore) {
      setShowAddonInfo(false);
    }
  }, [isAddonStore]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {navItem?.label}
          </h1>
          {isAddonStore ? (
            <Tooltip
              content={`About ${navItem?.label ?? 'Add-ons'}`}
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label={`About ${navItem?.label ?? 'Add-ons'}`}
                aria-expanded={showAddonInfo}
                onClick={() => setShowAddonInfo((value) => !value)}
              >
                <InfoIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          ) : null}
        </div>
        {isAddonStore ? (
          showAddonInfo && navItem?.description ? (
            <Box
              variant="tertiary"
              role="note"
              className="border-primary/40 bg-primary/10 flex-row items-start gap-2 py-3"
            >
              <InfoIcon
                className="text-primary mt-0.5 shrink-0"
                size={16}
                aria-hidden
              />
              <p className="text-foreground text-sm">{navItem.description}</p>
            </Box>
          ) : null
        ) : (
          <p className="text-foreground-secondary text-sm">
            {navItem?.description}
          </p>
        )}
      </header>
      {content}
    </div>
  );
}
