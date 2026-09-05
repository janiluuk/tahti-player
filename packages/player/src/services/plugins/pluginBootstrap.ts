import { normalize } from '@tauri-apps/api/path';

import { usePluginStore } from '../../stores/pluginStore';
import { useStartupStore } from '../../stores/startupStore';
import { errorMessage } from '../../utils/errorMessage';
import { providersHost } from '../providersHost';
import { createPluginAPI } from './createPluginAPI';
import { checkAndUpdatePlugins } from './pluginAutoUpdate';
import { getPluginsDir } from './pluginDir';
import { PluginLoader } from './PluginLoader';
import {
  getRegistryEntry,
  listRegistryEntries,
  setRegistryEntryWarnings,
  upsertRegistryEntry,
} from './pluginRegistry';

const isManagedPath = async (absPath: string): Promise<boolean> => {
  const normalizedPath = await normalize(absPath);
  const normalizedBase = await normalize(await getPluginsDir());
  return normalizedPath.startsWith(normalizedBase);
};

export const hydratePluginsFromRegistry = async (): Promise<void> => {
  useStartupStore.getState().startStartup();
  const now = Date.now();
  const entries = (await listRegistryEntries()).sort(
    (a, b) =>
      new Date(a.installedAt).getTime() - new Date(b.installedAt).getTime(),
  );

  for (const entry of entries) {
    // TODO: Support non-managed paths (dev plugins)
    if (!(await isManagedPath(entry.path))) {
      continue;
    }
    try {
      const loader = new PluginLoader(entry.path);
      const metadata = await loader.loadMetadata();
      const api = createPluginAPI(metadata.id, metadata.displayName);
      const { instance } = await loader.load(api);
      const warnings = entry.warnings ?? loader.getWarnings() ?? [];

      const enabled = entry.enabled ?? false;

      await upsertRegistryEntry({
        id: entry.id,
        version: metadata.version,
        path: entry.path,
        installationMethod: entry.installationMethod,
        originalPath: entry.originalPath,
        enabled,
        installedAt: entry.installedAt,
        lastUpdatedAt: new Date().toISOString(),
        warnings,
      });

      usePluginStore.setState((state) => {
        state.plugins[entry.id] = {
          metadata,
          path: entry.path,
          enabled,
          warning: warnings.length > 0,
          warnings,
          installationMethod: entry.installationMethod,
          originalPath: entry.originalPath,
          instance,
          api,
        };
        return state;
      });
    } catch (error) {
      const message = errorMessage(error);
      const current = await getRegistryEntry(entry.id);
      const merged = Array.from(
        new Set([...(current?.warnings ?? []), message]),
      );
      await setRegistryEntryWarnings(entry.id, merged);
    }
  }

  providersHost.resolveActiveOnBootstrap();

  const startupFinishTime = Date.now();
  useStartupStore.getState().finishStartup(startupFinishTime - now);

  void checkAndUpdatePlugins();
};