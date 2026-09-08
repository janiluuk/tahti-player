import { usePluginStore } from '../../stores/pluginStore';
import { checkAndUpdatePlugins } from './pluginAutoUpdate';
import { hydratePluginsFromRegistry } from './pluginBootstrap';
import { cleanupDownload, downloadAndExtractPlugin } from './pluginDownloader';
import { pluginRegistryStore } from './pluginRegistryAdapter';
import type {
  MarketplacePluginRelease,
  PluginRegistryHost,
} from './pluginRegistryContract';

/** Default runtime host — composes today's bootstrap/store/auto-update
 * functions behind the PluginRegistryHost interface without changing their
 * behavior (additive only; existing call sites in pluginBootstrap.ts,
 * useInstallPlugin.ts, pluginAutoUpdate.ts, and the UI views still import
 * those functions directly — migrating them is §5.4, separate scope). See
 * ../tahti-org's docs/todo/plugin-registry-extraction.md §5.3 for the exact
 * mapping this wraps.
 *
 * installFromMarketplace mirrors useInstallPlugin.ts's mutation body
 * (download → upsert → load → enable → cleanup) rather than delegating to
 * it directly, since that logic lives inline in a React Query hook with no
 * standalone function to call. Deliberately reuses today's exact sequence,
 * including the double-upsert noted in §"Inventory notes / open risks" #3
 * (loadPluginFromPath re-upserts after the managed copy exists) — the
 * contract test for this method locks that final entry shape. */
export const createPluginRegistryHost = (): PluginRegistryHost => ({
  hydrateFromRegistry: () => hydratePluginsFromRegistry(),

  installFromPath: (path) => usePluginStore.getState().loadPluginFromPath(path),

  installFromMarketplace: async (plugin: MarketplacePluginRelease) => {
    const extractedPath = await downloadAndExtractPlugin({
      pluginId: plugin.id,
      downloadUrl: plugin.downloadUrl,
    });
    try {
      const now = new Date().toISOString();
      await pluginRegistryStore.upsert({
        id: plugin.id,
        version: plugin.version,
        path: extractedPath,
        installationMethod: 'store',
        enabled: false,
        installedAt: now,
        lastUpdatedAt: now,
      });
      await usePluginStore.getState().loadPluginFromPath(extractedPath);
      await usePluginStore.getState().enablePlugin(plugin.id);
    } finally {
      await cleanupDownload(plugin.id);
    }
  },

  enable: (id) => usePluginStore.getState().enablePlugin(id),
  disable: (id) => usePluginStore.getState().disablePlugin(id),
  reloadDev: (id) => usePluginStore.getState().reloadPlugin(id),
  remove: (id) => usePluginStore.getState().removePlugin(id),

  checkAndUpdateStorePlugins: () => checkAndUpdatePlugins(),
});

/** Process-wide singleton, matching pluginRegistryStore's convention. */
export const pluginRegistryHost: PluginRegistryHost =
  createPluginRegistryHost();
