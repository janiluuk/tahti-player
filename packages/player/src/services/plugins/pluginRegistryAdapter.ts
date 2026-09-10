import {
  getRegistryEntry,
  listRegistryEntries,
  removeRegistryEntry,
  setRegistryEntryEnabled,
  setRegistryEntryWarnings,
  upsertRegistryEntry,
} from './pluginRegistry';
import type { PluginRegistryStore } from './pluginRegistryContract';

/** Default runtime adapter — wraps today's pluginRegistry.ts without changing
 * storage (same LazyStore file, key prefix, and managed path layout). This
 * is the only supported import path for new code; pluginRegistry.ts stays
 * the LazyStore owner underneath it. See ../tahti-org's
 * docs/todo/plugin-registry-extraction.md §5.2. */
export const createLazyStorePluginRegistry = (): PluginRegistryStore => ({
  list: () => listRegistryEntries(),
  get: (id) => getRegistryEntry(id),
  upsert: (entry) => upsertRegistryEntry(entry),
  setEnabled: (id, enabled) => setRegistryEntryEnabled(id, enabled),
  setWarnings: (id, warnings) => setRegistryEntryWarnings(id, warnings),
  remove: (id) => removeRegistryEntry(id),
});

/** Process-wide singleton for player core (same LazyStore instance as today,
 * since pluginRegistry.ts's own `store` is itself a module-level singleton). */
export const pluginRegistryStore: PluginRegistryStore =
  createLazyStorePluginRegistry();
