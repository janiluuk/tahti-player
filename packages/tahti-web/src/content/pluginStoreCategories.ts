import {
  HeadphonesIcon,
  SlidersHorizontalIcon,
  WrenchIcon,
  type LucideIcon,
} from 'lucide-react';

import type { TFunction } from '@tahti-player/i18n';

import type { AccountRole } from '../api/types';
import { webT } from '../lib/webT';

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

export function pluginCategories(t: TFunction<'web'>): PluginCategory[] {
  return [
    {
      id: 'listener',
      label: t('pluginStoreCategories.listener'),
      description: t(
        'pluginStoreCategories.radioListeningServicesPersonalWidgets',
      ),
      icon: HeadphonesIcon,
      minimumRole: 'LISTENER',
    },
    {
      id: 'artist',
      label: t('pluginStoreCategories.artist'),
      description:
        'Import, releases, distribution, broadcast, channel and production tools.',
      icon: SlidersHorizontalIcon,
      minimumRole: 'ARTIST',
    },
    {
      id: 'admin',
      label: t('pluginStoreCategories.admin'),
      description: t('pluginStoreCategories.boardOnlyPlatformOperationsAnd'),
      icon: WrenchIcon,
      minimumRole: 'BOARD',
    },
  ];
}

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

export function isPluginCategoryTarget(
  value: string | null | undefined,
): value is PluginCategoryTarget {
  return Boolean(
    value &&
    (LISTENER_TARGETS.has(value as PluginCategoryTarget) ||
      ARTIST_TARGETS.has(value as PluginCategoryTarget) ||
      value === 'admin' ||
      value === 'tools'),
  );
}

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
    return pluginCategories(webT());
  }
  if (role === 'ARTIST') {
    return pluginCategories(webT()).filter(
      (category) => category.id !== 'admin',
    );
  }
  return pluginCategories(webT()).filter(
    (category) => category.id === 'listener',
  );
}

export function pluginCategory(id: string): PluginCategory | undefined {
  const audience = pluginAudienceForTarget(id);
  return pluginCategories(webT()).find((category) => category.id === audience);
}
