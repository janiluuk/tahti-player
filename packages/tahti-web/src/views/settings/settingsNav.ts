import type { LucideIcon } from 'lucide-react';
import {
  BlocksIcon,
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

export type SettingsSectionId =
  | 'account'
  | 'artist'
  | 'channel'
  | 'broadcast'
  | 'playback'
  | 'integrations'
  | 'themes'
  | 'plugin-store'
  | 'logs'
  | 'whats-new';

export type SettingsNavGroup = 'Settings' | 'App';

export type SettingsNavItem = {
  id: SettingsSectionId;
  label: string;
  description: string;
  Icon: LucideIcon;
  group: SettingsNavGroup;
};

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    id: 'account',
    label: 'Account',
    description: 'Session, security, membership, notifications',
    Icon: User,
    group: 'Settings',
  },
  {
    id: 'artist',
    label: 'Artist',
    description: 'Profile, branding, social links, members, press kit',
    Icon: UserCircle2,
    group: 'Settings',
  },
  {
    id: 'channel',
    label: 'Channel & design',
    description: 'Channel Designer, discovery, username, moderation',
    Icon: Paintbrush,
    group: 'Settings',
  },
  {
    id: 'broadcast',
    label: 'Broadcast',
    description: 'Radio, green room, moderators, multistream',
    Icon: Radio,
    group: 'Settings',
  },
  {
    id: 'playback',
    label: 'Playback',
    description: 'Volume, shuffle, repeat and skip duration',
    Icon: PlayCircle,
    group: 'Settings',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Scrobbling and desktop-app integrations',
    Icon: Plug,
    group: 'Settings',
  },
  {
    id: 'themes',
    label: 'Themes',
    description: 'App appearance',
    Icon: Palette,
    group: 'App',
  },
  {
    id: 'plugin-store',
    label: 'Add-ons',
    description: 'Listener, artist and admin tools in role-based lists',
    Icon: BlocksIcon,
    group: 'App',
  },
  {
    id: 'logs',
    label: 'Logs',
    description: 'Warnings, errors and player events from this tab',
    Icon: ScrollText,
    group: 'App',
  },
  {
    id: 'whats-new',
    label: "What's new",
    description: 'What changed in each release',
    Icon: Sparkles,
    group: 'App',
  },
];

/** Sections visible without signing in (prefs + announcements + browsing
 * add-ons). Individual add-on actions that deep-link into Studio/Sources/
 * Settings flows still prompt for sign-in themselves when clicked. */
export const PUBLIC_SETTINGS_SECTION_IDS: readonly SettingsSectionId[] = [
  'playback',
  'themes',
  'plugin-store',
  'logs',
  'whats-new',
];

export const DEFAULT_PUBLIC_SETTINGS_SECTION: SettingsSectionId = 'themes';

export function isPublicSettingsSection(id: SettingsSectionId): boolean {
  return PUBLIC_SETTINGS_SECTION_IDS.includes(id);
}

export function settingsNavForAuth(signedIn: boolean): SettingsNavItem[] {
  if (signedIn) {
    return SETTINGS_NAV;
  }
  return SETTINGS_NAV.filter((item) => isPublicSettingsSection(item.id));
}

export function isSettingsSectionId(
  value: string | undefined,
): value is SettingsSectionId {
  return Boolean(value && SETTINGS_NAV.some((n) => n.id === value));
}
