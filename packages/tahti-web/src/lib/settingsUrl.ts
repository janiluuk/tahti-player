import type { PluginCategoryTarget } from '../content/pluginStoreCategories';
import type {
  AccountSettingsSection,
  ArtistSettingsSection,
  NotificationsSettingsSection,
  PlaybackSettingsSection,
  SecuritySettingsSection,
} from '../stores/settingsModalStore';
import type { SettingsSectionId } from '../views/settings/settingsNav';

export type BuildSettingsPathInput = {
  section: SettingsSectionId;
  artistSection?: ArtistSettingsSection | null;
  accountSection?: AccountSettingsSection | null;
  securitySection?: SecuritySettingsSection | null;
  notificationsSection?: NotificationsSettingsSection | null;
  playbackSection?: PlaybackSettingsSection | null;
  pluginCategory?: PluginCategoryTarget | null;
};

/** Bookmarkable path for the Settings modal surface. */
export function buildSettingsPath({
  section,
  artistSection,
  accountSection,
  securitySection,
  notificationsSection,
  playbackSection,
  pluginCategory,
}: BuildSettingsPathInput): string {
  const params = new URLSearchParams();
  if (section === 'artist' && artistSection) {
    params.set('tab', artistSection);
  } else if (
    section === 'account' &&
    accountSection &&
    accountSection !== 'session'
  ) {
    params.set('tab', accountSection);
  } else if (
    section === 'security' &&
    securitySection &&
    securitySection !== 'password-email'
  ) {
    params.set('tab', securitySection);
  } else if (
    section === 'notifications' &&
    notificationsSection &&
    notificationsSection !== 'notifications'
  ) {
    params.set('tab', notificationsSection);
  } else if (
    section === 'playback' &&
    (playbackSection === 'language' || playbackSection === 'integrations')
  ) {
    params.set('tab', playbackSection);
  } else if (section === 'plugin-store' && pluginCategory) {
    params.set('category', pluginCategory);
  }
  const query = params.toString();
  return query ? `/settings/${section}?${query}` : `/settings/${section}`;
}
