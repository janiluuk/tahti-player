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
  /** One line under the title. Left out where the section's own tabs
   * already say what is in it. */
  description?: string;
  Icon: LucideIcon;
  group: SettingsNavGroup;
};

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    id: 'account',
    label: 'Account',
    Icon: User,
    group: 'Settings',
  },
  {
    id: 'artist',
    label: 'Artist',
    Icon: UserCircle2,
    group: 'Settings',
  },
  {
    id: 'channel',
    label: 'Channel & chat',
    Icon: Paintbrush,
    group: 'Settings',
  },
  {
    id: 'broadcast',
    label: 'Broadcast',
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

/** Sections that configure a channel; an account without one has nothing
 * for them to act on. */
export const CHANNEL_SETTINGS_SECTION_IDS: readonly SettingsSectionId[] = [
  'channel',
  'broadcast',
];

const PROFILE_NAV_OVERRIDE = { label: 'Profile' };

export type SettingsNavAudience = {
  signedIn: boolean;
  /** False for a listener account that has not created a channel. */
  hasChannel: boolean;
};

export function isSettingsSectionAvailable(
  id: SettingsSectionId,
  audience: SettingsNavAudience,
): boolean {
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
