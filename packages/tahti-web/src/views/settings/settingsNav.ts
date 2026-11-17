import type { LucideIcon } from 'lucide-react';
import {
  BlocksIcon,
  Palette,
  PlayCircle,
  Sparkles,
  User,
  UserCircle2,
} from 'lucide-react';

import type { ParseKeys, TFunction } from '@tahti-player/i18n';

import { webT } from '../../lib/webT';

type WebKey = ParseKeys<'web'>;

/** Account-only. An artist's profile, channel and broadcast forms live in
 * Studio → Profile and Studio → Broadcast; `artist` is the listener's
 * profile for an account without a channel. */
export type SettingsSectionId =
  'account' | 'artist' | 'playback' | 'themes' | 'plugin-store' | 'whats-new';

export type SettingsNavGroup = 'Settings' | 'App';

export const SETTINGS_GROUP_LABEL_KEYS = {
  Settings: 'settings.groupSettings',
  App: 'settings.groupApp',
} as const satisfies Record<SettingsNavGroup, WebKey>;

export type SettingsNavItem = {
  id: SettingsSectionId;
  /** English source; screens render `labelKey` through i18n. */
  label: string;
  labelKey: WebKey;
  /** One line under the title. Left out where the section's own tabs
   * already say what is in it. */
  description?: string;
  descriptionKey?: WebKey;
  Icon: LucideIcon;
  group: SettingsNavGroup;
};

export function settingsNav(t: TFunction<'web'>): SettingsNavItem[] {
  return [
    {
      id: 'account',
      label: t('settingsNav.account'),
      labelKey: 'settings.account',
      Icon: User,
      group: 'Settings',
    },
    {
      id: 'artist',
      label: t('settingsNav.profile'),
      labelKey: 'settings.profile',
      Icon: UserCircle2,
      group: 'Settings',
    },
    {
      id: 'playback',
      label: t('settings.playbackLanguage'),
      labelKey: 'settings.playbackLanguage',
      description: t('settings.playbackLanguageDescription'),
      descriptionKey: 'settings.playbackLanguageDescription',
      Icon: PlayCircle,
      group: 'Settings',
    },
    {
      id: 'themes',
      label: t('settingsNav.themes'),
      labelKey: 'settings.themes',
      description: t('settingsNav.appAppearance'),
      descriptionKey: 'settings.themesDescription',
      Icon: Palette,
      group: 'App',
    },
    {
      id: 'plugin-store',
      label: t('settingsNav.addOns'),
      labelKey: 'settings.pluginStore',
      description: t('settingsNav.listenerArtistAndAdminTools'),
      descriptionKey: 'settings.addOnsDescription',
      Icon: BlocksIcon,
      group: 'App',
    },
    {
      id: 'whats-new',
      label: t('settings.whatsNew'),
      labelKey: 'settings.whatsNew',
      description: t('settingsNav.whatChangedInEachRelease'),
      descriptionKey: 'settings.whatsNewDescription',
      Icon: Sparkles,
      group: 'App',
    },
  ];
}

/** Sections visible without signing in (prefs + announcements + browsing
 * add-ons). Individual add-on actions that deep-link into Studio/Sources/
 * Settings flows still prompt for sign-in themselves when clicked. */
export const PUBLIC_SETTINGS_SECTION_IDS: readonly SettingsSectionId[] = [
  'playback',
  'themes',
  'plugin-store',
  'whats-new',
];

export const DEFAULT_PUBLIC_SETTINGS_SECTION: SettingsSectionId = 'themes';

export function isPublicSettingsSection(id: SettingsSectionId): boolean {
  return PUBLIC_SETTINGS_SECTION_IDS.includes(id);
}

export type SettingsNavAudience = {
  signedIn: boolean;
  /** True once the account is known to have a channel. Its profile forms are
   * then in Studio → Profile, not here. */
  hasChannel: boolean;
};

export function isSettingsSectionAvailable(
  id: SettingsSectionId,
  audience: SettingsNavAudience,
): boolean {
  if (!audience.signedIn) {
    return isPublicSettingsSection(id);
  }
  return id !== 'artist' || !audience.hasChannel;
}

export function settingsNavFor(
  audience: SettingsNavAudience,
): SettingsNavItem[] {
  return settingsNav(webT()).filter((item) =>
    isSettingsSectionAvailable(item.id, audience),
  );
}

export function fallbackSettingsSection(
  audience: SettingsNavAudience,
): SettingsSectionId {
  return audience.signedIn ? 'account' : DEFAULT_PUBLIC_SETTINGS_SECTION;
}

export function isSettingsSectionId(
  value: string | undefined,
): value is SettingsSectionId {
  return Boolean(value && settingsNav(webT()).some((n) => n.id === value));
}
