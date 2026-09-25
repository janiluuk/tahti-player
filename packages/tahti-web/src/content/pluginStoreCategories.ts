import {
  HeadphonesIcon,
  SlidersHorizontalIcon,
  WrenchIcon,
  type LucideIcon,
} from 'lucide-react';

import type { AccountRole } from '../api/types';

export type PluginCategoryId = 'listener' | 'artist' | 'admin';

export type LegacyPluginCategoryId =
  | 'themes'
  | 'visualizers'
  | 'export'
  | 'import'
  | 'multicast'
  | 'fingerprinting'
  | 'scrobbling'
  | 'audio-plugins'
  | 'tools'
  | 'radio'
  | 'listen'
  | 'discovery'
  | 'channel';

export type PluginCategoryTarget = PluginCategoryId | LegacyPluginCategoryId;

export type PluginCategory = {
  id: PluginCategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
  minimumRole: AccountRole;
};

export const PLUGIN_CATEGORIES: PluginCategory[] = [
  {
    id: 'listener',
    label: 'Listener',
    description: 'Radio, listening services, personal widgets and scrobbling.',
    icon: HeadphonesIcon,
    minimumRole: 'LISTENER',
  },
  {
    id: 'artist',
    label: 'Artist',
    description:
      'Import, releases, distribution, broadcast, channel and production tools.',
    icon: SlidersHorizontalIcon,
    minimumRole: 'ARTIST',
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Board-only platform operations and administrative add-ons.',
    icon: WrenchIcon,
    minimumRole: 'BOARD',
  },
];

const LISTENER_TARGETS = new Set<PluginCategoryTarget>([
  'listener',
  'themes',
  'radio',
  'listen',
  'discovery',
  'scrobbling',
]);

const ARTIST_TARGETS = new Set<PluginCategoryTarget>([
  'artist',
  'visualizers',
  'export',
  'import',
  'multicast',
  'fingerprinting',
  'audio-plugins',
  'channel',
]);

export function pluginAudienceForTarget(
  target: string | null | undefined,
): PluginCategoryId {
  if (target && LISTENER_TARGETS.has(target as PluginCategoryTarget)) {
    return 'listener';
  }
  if (target && ARTIST_TARGETS.has(target as PluginCategoryTarget)) {
    return 'artist';
  }
  if (target === 'admin' || target === 'tools') {
    return 'admin';
  }
  return 'listener';
}

export function pluginCategoriesForRole(role: AccountRole): PluginCategory[] {
  if (role === 'BOARD') {
    return PLUGIN_CATEGORIES;
  }
  if (role === 'ARTIST') {
    return PLUGIN_CATEGORIES.filter((category) => category.id !== 'admin');
  }
  return PLUGIN_CATEGORIES.filter((category) => category.id === 'listener');
}

export function pluginCategory(id: string): PluginCategory | undefined {
  const audience = pluginAudienceForTarget(id);
  return PLUGIN_CATEGORIES.find((category) => category.id === audience);
}
