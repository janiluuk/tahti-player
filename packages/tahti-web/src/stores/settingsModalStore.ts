import { create } from 'zustand';

import type { PluginCategoryId } from '../content/pluginStoreCategories';
import type { SettingsSectionId } from '../views/settings/settingsNav';

export type ArtistSettingsSection =
  | 'identity'
  | 'story'
  | 'people'
  | 'connections'
  | 'branding'
  | 'gallery'
  | 'press-kit'
  | 'channel-designer'
  | 'release-visuals';

type SettingsModalState = {
  isOpen: boolean;
  activeTab: SettingsSectionId;
  /** Sub-tab to land on when activeTab === 'plugin-store' — PluginStorePanel
   * syncs to this on every open. Deliberately a plain field, not a
   * "consume once and clear" value: React 18 StrictMode double-invokes
   * effects/initializers in dev, and a destructive read there is a race
   * (first invocation clears it before the second can see it). */
  pluginCategory: PluginCategoryId | null;
  /** Sub-tab when activeTab === 'artist' (branding / gallery / …). */
  artistSection: ArtistSettingsSection | null;
  open: (
    tab?: SettingsSectionId,
    pluginCategory?: PluginCategoryId,
    artistSection?: ArtistSettingsSection,
  ) => void;
  close: () => void;
  setActiveTab: (tab: SettingsSectionId) => void;
};

export const useSettingsModalStore = create<SettingsModalState>((set) => ({
  isOpen: false,
  activeTab: 'account',
  pluginCategory: null,
  artistSection: null,
  open: (tab, pluginCategory, artistSection) =>
    set((state) => ({
      isOpen: true,
      activeTab: tab ?? state.activeTab,
      pluginCategory: pluginCategory ?? null,
      artistSection: artistSection ?? null,
    })),
  close: () => set({ isOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab, artistSection: null }),
}));
