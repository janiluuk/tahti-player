import './pluginRegistry';

/** Re-export shim — the implementation lives in `@tahti-player/plugin-registry`.
 * Importing ./pluginRegistry first wires the player Logger into it. */
export {
  createLazyStorePluginRegistry,
  pluginRegistryStore,
} from '@tahti-player/plugin-registry';
