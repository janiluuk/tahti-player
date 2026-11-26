import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  BlocksIcon,
  Lock,
  Palette,
  PlayCircle,
  Settings2,
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
  | 'account'
  | 'security'
  | 'notifications'
  | 'artist'
  | 'playback'
  | 'general'
  | 'themes'
  | 'plugin-store'
  | 'whats-new';

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
  iconClassName: string;
  group: SettingsNavGroup;
};

export function settingsNav(t: TFunction<'web'>): SettingsNavItem[] {
  return [
    {
      id: 'account',
      label: t('settingsNav.account'),
      labelKey: 'settings.account',
      Icon: User,
      iconClassName: 'text-accent-blue-strong',
      group: 'Settings',
    },
    {
      id: 'security',
      label: t('settings.security'),
      labelKey: 'settings.security',
      description: t('settings.securityDescription'),
      descriptionKey: 'settings.securityDescription',
      Icon: Lock,
      iconClassName: 'text-accent-red-strong',
      group: 'Settings',
    },
    {
      id: 'notifications',
      label: t('settings.notifications'),
      labelKey: 'settings.notifications',
      description: t('settings.notificationsDescription'),
      descriptionKey: 'settings.notificationsDescription',
      Icon: Bell,
      iconClassName: 'text-accent-orange-strong',
      group: 'Settings',
    },
    {
      id: 'artist',
      label: t('settingsNav.profile'),
      labelKey: 'settings.profile',
      Icon: UserCircle2,
      iconClassName: 'text-accent-purple-strong',
      group: 'Settings',
    },
    {
      id: 'playback',
      label: t('settings.playback'),
      labelKey: 'settings.playback',
      description: t('settings.playbackDescription'),
      descriptionKey: 'settings.playbackDescription',
      Icon: PlayCircle,
      iconClassName: 'text-accent-green-strong',
      group: 'Settings',
    },
    {
      id: 'general',
      label: t('settings.general'),
      labelKey: 'settings.general',
      description: t('settings.generalDescription'),
      descriptionKey: 'settings.generalDescription',
      Icon: Settings2,
      iconClassName: 'text-accent-cyan-strong',
      group: 'App',
    },
    {
      id: 'themes',
      label: t('settings.themes'),
      labelKey: 'settings.themes',
      description: t('settings.themesDescription'),
      descriptionKey: 'settings.themesDescription',
      Icon: Palette,
      iconClassName: 'text-accent-purple-strong',
      group: 'App',
    },
    {
      id: 'plugin-store',
      label: t('settingsNav.addOns'),
      labelKey: 'settings.pluginStore',
      description: t('settingsNav.listenerArtistAndAdminTools'),
      descriptionKey: 'settings.addOnsDescription',
      Icon: BlocksIcon,
      iconClassName: 'text-accent-yellow-strong',
      group: 'App',
    },
    {
      id: 'whats-new',
      label: t('settings.about'),
      labelKey: 'settings.about',
      Icon: Sparkles,
      iconClassName: 'text-accent-orange-strong',
      group: 'App',
    },
  ];
}

/** Sections visible without signing in (prefs + announcements + browsing
 * add-ons). Individual add-on actions that deep-link into Studio/Sources/
 * Settings flows still prompt for sign-in themselves when clicked. */
export const PUBLIC_SETTINGS_SECTION_IDS: readonly SettingsSectionId[] = [
  'playback',
  'general',
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
