import { create } from 'zustand';

import type { PluginCategoryTarget } from '../content/pluginStoreCategories';
import type { SettingsSectionId } from '../views/settings/settingsNav';

export type ArtistSettingsSection =
  | 'identity'
  | 'story'
  | 'people'
  | 'connections'
  | 'branding'
  | 'gallery'
  | 'press-kit'
  | 'release-visuals';

export type AccountSettingsSection =
  | 'session'
  | 'membership'
  | 'governance'
  | 'storage'
  | 'subscriptions'
  | 'purchases'
  | 'privacy';

export type SecuritySettingsSection =
  'password-email' | 'devices' | 'two-factor' | 'api-tokens';

export type NotificationsSettingsSection = 'notifications' | 'mentions';

export type PlaybackSettingsSection = 'playback' | 'language' | 'integrations';

type SettingsModalState = {
  isOpen: boolean;
  activeTab: SettingsSectionId;
  /** Sub-tab to land on when activeTab === 'plugin-store' — PluginStorePanel
   * syncs to this on every open. Deliberately a plain field, not a
   * "consume once and clear" value: React 18 StrictMode double-invokes
   * effects/initializers in dev, and a destructive read there is a race
   * (first invocation clears it before the second can see it). */
  pluginCategory: PluginCategoryTarget | null;
  /** Sub-tab when activeTab === 'artist' (branding / gallery / …). */
  artistSection: ArtistSettingsSection | null;
  /** Sub-tab when activeTab === 'account'. */
  accountSection: AccountSettingsSection | null;
  securitySection: SecuritySettingsSection | null;
  notificationsSection: NotificationsSettingsSection | null;
  playbackSection: PlaybackSettingsSection | null;
  openedToSection: boolean;
  /**
   * After Close while the URL is still `/settings…`, SettingsView must not
   * call `open()` again (Firefox especially: Esc/X closes, then the route
   * effect races and re-opens). Cleared when leaving `/settings` or on the
   * next intentional `open()`.
   */
  dismissRouteOpen: boolean;
  open: (
    tab?: SettingsSectionId,
    pluginCategory?: PluginCategoryTarget,
    artistSection?: ArtistSettingsSection,
    accountSection?: AccountSettingsSection,
    playbackSection?: PlaybackSettingsSection,
    securitySection?: SecuritySettingsSection,
    notificationsSection?: NotificationsSettingsSection,
  ) => void;
  close: () => void;
  setActiveTab: (tab: SettingsSectionId) => void;
  clearDismissRouteOpen: () => void;
};

export const useSettingsModalStore = create<SettingsModalState>((set) => ({
  isOpen: false,
  activeTab: 'account',
  pluginCategory: null,
  artistSection: null,
  accountSection: null,
  securitySection: null,
  notificationsSection: null,
  playbackSection: null,
  openedToSection: false,
  dismissRouteOpen: false,
  open: (
    tab,
    pluginCategory,
    artistSection,
    accountSection,
    playbackSection,
    securitySection,
    notificationsSection,
  ) =>
    set((state) => ({
      isOpen: true,
      dismissRouteOpen: false,
      // Keep list/detail mode when already open (URL sync from tab clicks);
      // only jump to content when opening into a specific section fresh.
      openedToSection: state.isOpen ? state.openedToSection : tab !== undefined,
      activeTab: tab ?? state.activeTab,
      pluginCategory: pluginCategory ?? null,
      artistSection: artistSection ?? null,
      accountSection: accountSection ?? null,
      securitySection: securitySection ?? null,
      notificationsSection: notificationsSection ?? null,
      playbackSection: playbackSection ?? null,
    })),
  close: () => set({ isOpen: false, dismissRouteOpen: true }),
  setActiveTab: (tab) =>
    set({
      activeTab: tab,
      artistSection: null,
      accountSection: null,
      securitySection: null,
      notificationsSection: null,
      playbackSection: null,
    }),
  clearDismissRouteOpen: () => set({ dismissRouteOpen: false }),
}));
