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

import type { ParseKeys, TFunction } from '@tahti-player/i18n';

import { webT } from '../../lib/webT';

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
      label: t('settingsNav.artist'),
      labelKey: 'settings.artist',
      Icon: UserCircle2,
      group: 'Settings',
    },
    {
      id: 'channel',
      label: t('settingsNav.channelChat'),
      labelKey: 'settings.channelChat',
      Icon: Paintbrush,
      group: 'Settings',
    },
    {
      id: 'broadcast',
      label: t('settingsNav.broadcast'),
      labelKey: 'settings.broadcast',
      Icon: Radio,
      group: 'Settings',
    },
    {
      id: 'playback',
      label: t('settingsNav.playback'),
      labelKey: 'settings.playback',
      description: t('settingsNav.volumeShuffleRepeatAndSkip'),
      descriptionKey: 'settings.playbackDescription',
      Icon: PlayCircle,
      group: 'Settings',
    },
    {
      id: 'integrations',
      label: t('settingsNav.integrations'),
      labelKey: 'settings.integrations',
      description: t('settingsNav.scrobblingAndDesktopAppIntegrations'),
      descriptionKey: 'settings.integrationsDescription',
      Icon: Plug,
      group: 'Settings',
    },
    {
      id: 'language',
      label: t('settingsNav.language'),
      labelKey: 'settings.language',
      description: t('settingsNav.theLanguageOfMenusButtons'),
      descriptionKey: 'settings.languageDescription',
      Icon: Languages,
      group: 'App',
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
      id: 'logs',
      label: t('settingsNav.logs'),
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

function profileNavOverride(t: TFunction<'web'>) {
  return {
    label: t('settingsNav.profile'),
    labelKey: 'settings.profile',
  } as const;
}

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
  return settingsNav(webT())
    .filter((item) => isSettingsSectionAvailable(item.id, audience))
    .map((item) =>
      item.id === 'artist' && audience.signedIn && !audience.hasChannel
        ? { ...item, ...profileNavOverride(webT()) }
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
  return Boolean(value && settingsNav(webT()).some((n) => n.id === value));
}
