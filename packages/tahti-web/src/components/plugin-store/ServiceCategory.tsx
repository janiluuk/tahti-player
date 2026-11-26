import { useNavigate } from '@tanstack/react-router';
import { PackageIcon } from 'lucide-react';
import { useEffect } from 'react';

import { PluginStoreItem } from '@tahti-player/ui';

import type { IntegrationId } from '../../api/sources';
import { usePluginInstallStore } from '../../stores/pluginInstallStore';
import { useSettingsModalStore } from '../../stores/settingsModalStore';
import { SourceServiceIcon } from '../SourceServiceIcon';
import { ColorfulAddonIcon } from './ColorfulAddonIcon';
import { HearthisCard } from './service-category/HearthisCard';
import { OAuthServiceCard } from './service-category/OAuthServiceCard';
import { SpotifyCard } from './service-category/SpotifyCard';
import {
  servicePluginsForCategory,
  type ServiceCategoryId,
  type ServicePlugin,
} from './serviceCatalog';
import { InstalledAvailableTabs } from './shared';

export { DspUrlPasteCard } from './service-category/DspUrlPasteCard';

const SOURCE_ICON_IDS = new Set<IntegrationId>([
  'bandcamp',
  'soundcloud',
  'google-drive',
  'mixcloud',
  'spotify',
  'hearthis',
  'musicbrainz',
]);

function serviceIcon(id: string) {
  if (SOURCE_ICON_IDS.has(id as IntegrationId)) {
    return <SourceServiceIcon id={id as IntegrationId} />;
  }
  return (
    <ColorfulAddonIcon tone="orange">
      <PackageIcon size={22} />
    </ColorfulAddonIcon>
  );
}

export function ServiceCategory({
  categoryId,
}: {
  categoryId: ServiceCategoryId;
}) {
  const plugins = servicePluginsForCategory(categoryId);
  return (
    <InstalledAvailableTabs
      ids={plugins.map((p) => p.id)}
      renderItem={(id) => {
        const plugin = plugins.find((p) => p.id === id)!;
        return <ServiceCard key={id} plugin={plugin} />;
      }}
    />
  );
}

export function ServiceCard({ plugin }: { plugin: ServicePlugin }) {
  const navigate = useNavigate();
  // hearthis/spotify/oauth each track their own real status and write it
  // to usePluginInstallStore themselves (see those cards) — only the
  // remaining kinds (deep-link, info) are decided here, once, up front so
  // this early-return-heavy component never calls the hook conditionally.
  useEffect(() => {
    if (
      plugin.id === 'hearthis' ||
      plugin.id === 'spotify' ||
      plugin.action.kind === 'oauth'
    ) {
      return;
    }
    usePluginInstallStore
      .getState()
      .setInstalled(plugin.id, plugin.action.kind === 'info');
  }, [plugin.id, plugin.action.kind]);

  if (plugin.id === 'hearthis') {
    return <HearthisCard plugin={plugin} />;
  }
  if (plugin.id === 'spotify') {
    return <SpotifyCard plugin={plugin} />;
  }
  if (plugin.action.kind === 'oauth') {
    return <OAuthServiceCard plugin={plugin} action={plugin.action} />;
  }

  const header = (
    <PluginStoreItem
      icon={serviceIcon(plugin.id)}
      name={plugin.name}
      author={plugin.author}
      description={plugin.description}
      isInstalled={plugin.action.kind === 'info'}
      onInstall={() => {
        if (plugin.action.kind === 'deep-link') {
          useSettingsModalStore.getState().close();
          void navigate({ to: plugin.action.to });
        }
      }}
      labels={{
        install:
          plugin.action.kind === 'deep-link'
            ? (plugin.action.label ?? 'Open')
            : undefined,
        installed: 'Active',
      }}
    />
  );

  return header;
}
