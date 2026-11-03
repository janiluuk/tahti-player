import type { LucideIcon } from 'lucide-react';
import {
  BlocksIcon,
  Languages,
  Paintbrush,
  Palette,
  PlayCircle,
  Plug,
  Radio,
  ScrollText,
  Sparkles,
  User,
  UserCircle2,
} from 'lucide-react';

import type { ParseKeys } from '@tahti-player/i18n';

type WebKey = ParseKeys<'web'>;

export type SettingsSectionId =
  | 'account'
  | 'artist'
  | 'channel'
  | 'broadcast'
  | 'playback'
  | 'integrations'
  | 'language'
  | 'themes'
  | 'plugin-store'
  | 'logs'
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
  group: SettingsNavGroup;
};

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    id: 'account',
    label: 'Account',
    labelKey: 'settings.account',
    Icon: User,
    group: 'Settings',
  },
  {
    id: 'artist',
    label: 'Artist',
    labelKey: 'settings.artist',
    Icon: UserCircle2,
    group: 'Settings',
  },
  {
    id: 'channel',
    label: 'Channel & chat',
    labelKey: 'settings.channelChat',
    Icon: Paintbrush,
    group: 'Settings',
  },
  {
    id: 'broadcast',
    label: 'Broadcast',
    labelKey: 'settings.broadcast',
    Icon: Radio,
    group: 'Settings',
  },
  {
    id: 'playback',
    label: 'Playback',
    labelKey: 'settings.playback',
    description: 'Volume, shuffle, repeat and skip duration',
    descriptionKey: 'settings.playbackDescription',
    Icon: PlayCircle,
    group: 'Settings',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    labelKey: 'settings.integrations',
    description: 'Scrobbling and desktop-app integrations',
    descriptionKey: 'settings.integrationsDescription',
    Icon: Plug,
    group: 'Settings',
  },
  {
    id: 'language',
    label: 'Language',
    labelKey: 'settings.language',
    description: 'The language of menus, buttons and dates',
    descriptionKey: 'settings.languageDescription',
    Icon: Languages,
    group: 'App',
  },
  {
    id: 'themes',
    label: 'Themes',
    labelKey: 'settings.themes',
    description: 'App appearance',
    descriptionKey: 'settings.themesDescription',
    Icon: Palette,
    group: 'App',
  },
  {
    id: 'plugin-store',
    label: 'Add-ons',
    labelKey: 'settings.pluginStore',
    description: 'Listener, artist and admin tools in role-based lists',
    descriptionKey: 'settings.addOnsDescription',
    Icon: BlocksIcon,
    group: 'App',
  },
  {
    id: 'logs',
    label: 'Logs',
    labelKey: 'settings.logs',
    description:
      'Client warnings and errors from this tab, plus links to server container logs',
    descriptionKey: 'settings.logsDescription',
    Icon: ScrollText,
    group: 'App',
  },
  {
    id: 'whats-new',
    label: "What's new",
    labelKey: 'settings.whatsNew',
    description: 'What changed in each release',
    descriptionKey: 'settings.whatsNewDescription',
    Icon: Sparkles,
    group: 'App',
  },
];

/** Sections visible without signing in (prefs + announcements + browsing
 * add-ons). Individual add-on actions that deep-link into Studio/Sources/
 * Settings flows still prompt for sign-in themselves when clicked. */
export const PUBLIC_SETTINGS_SECTION_IDS: readonly SettingsSectionId[] = [
  'playback',
  'language',
  'themes',
  'plugin-store',
  'whats-new',
];

/** Board-only diagnostics (client log buffer). Not shown to listeners/artists. */
export const BOARD_SETTINGS_SECTION_IDS: readonly SettingsSectionId[] = [
  'logs',
];

export const DEFAULT_PUBLIC_SETTINGS_SECTION: SettingsSectionId = 'themes';

export function isPublicSettingsSection(id: SettingsSectionId): boolean {
  return PUBLIC_SETTINGS_SECTION_IDS.includes(id);
}

/** Sections that configure a channel; an account without one has nothing
 * for them to act on. */
export const CHANNEL_SETTINGS_SECTION_IDS: readonly SettingsSectionId[] = [
  'channel',
  'broadcast',
];

const PROFILE_NAV_OVERRIDE = {
  label: 'Profile',
  labelKey: 'settings.profile',
} as const;

export type SettingsNavAudience = {
  signedIn: boolean;
  /** False for a listener account that has not created a channel. */
  hasChannel: boolean;
  /** Board members see diagnostics sections (client Logs). */
  isBoard?: boolean;
};

export function isSettingsSectionAvailable(
  id: SettingsSectionId,
  audience: SettingsNavAudience,
): boolean {
  if (BOARD_SETTINGS_SECTION_IDS.includes(id)) {
    return Boolean(audience.signedIn && audience.isBoard);
  }
  if (!audience.signedIn) {
    return isPublicSettingsSection(id);
  }
  return audience.hasChannel || !CHANNEL_SETTINGS_SECTION_IDS.includes(id);
}

export function settingsNavFor(
  audience: SettingsNavAudience,
): SettingsNavItem[] {
  return SETTINGS_NAV.filter((item) =>
    isSettingsSectionAvailable(item.id, audience),
  ).map((item) =>
    item.id === 'artist' && audience.signedIn && !audience.hasChannel
      ? { ...item, ...PROFILE_NAV_OVERRIDE }
      : item,
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
  return Boolean(value && SETTINGS_NAV.some((n) => n.id === value));
}
