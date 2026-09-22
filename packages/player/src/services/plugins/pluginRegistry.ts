import {
  configurePluginRegistryLogger,
  getRegistryEntry,
  listRegistryEntries,
  removeRegistryEntry,
  setRegistryEntryEnabled,
  setRegistryEntryWarnings,
  upsertRegistryEntry,
} from '@tahti-player/plugin-registry';

import { Logger } from '../logger';

/** Re-export shim — the implementation lives in `@tahti-player/plugin-registry`. */
export type {
  PluginInstallationMethod,
  PluginRegistryEntry,
} from '@tahti-player/plugin-registry';

configurePluginRegistryLogger(Logger.plugins);

export {
  getRegistryEntry,
  listRegistryEntries,
  removeRegistryEntry,
  setRegistryEntryEnabled,
  setRegistryEntryWarnings,
  upsertRegistryEntry,
};
