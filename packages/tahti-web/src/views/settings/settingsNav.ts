import type { LucideIcon } from 'lucide-react';
import {
  BlocksIcon,
  Paintbrush,
  Palette,
  Radio,
  Sparkles,
  User,
  UserCircle2,
} from 'lucide-react';

export type SettingsSectionId =
  | 'account'
  | 'artist'
  | 'channel'
  | 'broadcast'
  | 'themes'
  | 'plugin-store'
  | 'whats-new';

export type SettingsNavItem = {
  id: SettingsSectionId;
  label: string;
  description: string;
  Icon: LucideIcon;
};

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    id: 'account',
    label: 'Account',
    description: 'Session, security, membership, notifications',
    Icon: User,
  },
  {
    id: 'artist',
    label: 'Artist',
    description: 'Profile, branding, social links, members, press kit',
    Icon: UserCircle2,
  },
  {
    id: 'channel',
    label: 'Channel & design',
    description: 'Discovery, username, moderation',
    Icon: Paintbrush,
  },
  {
    id: 'broadcast',
    label: 'Broadcast',
    description: 'Radio, green room, moderators, multistream',
    Icon: Radio,
  },
  {
    id: 'themes',
    label: 'Themes',
    description: 'App appearance',
    Icon: Palette,
  },
  {
    id: 'plugin-store',
    label: 'Add-ons',
    description:
      'Themes, visualizers, radio, tools, embeds, discovery, channel widgets, export, import, multicast, fingerprinting, audio add-ons — one browser',
    Icon: BlocksIcon,
  },
  {
    id: 'whats-new',
    label: "What's new",
    description: 'What changed in each release',
    Icon: Sparkles,
  },
];

/** Sections visible without signing in (prefs + announcements + browsing
 * add-ons). Individual add-on actions that deep-link into Studio/Sources/
 * Settings flows still prompt for sign-in themselves when clicked. */
export const PUBLIC_SETTINGS_SECTION_IDS: readonly SettingsSectionId[] = [
  'themes',
  'plugin-store',
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
