import type { PluginCategoryTarget } from '../content/pluginStoreCategories';
import type {
  AccountSettingsSection,
  ArtistSettingsSection,
  ChannelSettingsSection,
} from '../stores/settingsModalStore';
import type { SettingsSectionId } from '../views/settings/settingsNav';

export type BuildSettingsPathInput = {
  section: SettingsSectionId;
  artistSection?: ArtistSettingsSection | null;
  accountSection?: AccountSettingsSection | null;
  channelSection?: ChannelSettingsSection | null;
  pluginCategory?: PluginCategoryTarget | null;
};

/** Bookmarkable path for the Settings modal surface. */
export function buildSettingsPath({
  section,
  artistSection,
  accountSection,
  channelSection,
  pluginCategory,
}: BuildSettingsPathInput): string {
  const params = new URLSearchParams();
  if (section === 'artist' && artistSection) {
    params.set('tab', artistSection);
  } else if (section === 'account' && accountSection) {
    params.set('tab', accountSection);
  } else if (section === 'channel' && channelSection) {
    params.set('tab', channelSection);
  } else if (section === 'plugin-store' && pluginCategory) {
    params.set('category', pluginCategory);
  }
  const query = params.toString();
  return query ? `/settings/${section}?${query}` : `/settings/${section}`;
}
