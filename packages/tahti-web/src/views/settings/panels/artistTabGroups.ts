import { Images, Link2, UserCircle2 } from 'lucide-react';

import type { TFunction } from '@tahti-player/i18n';

import type { TabGroup } from './tabGroups';

export function artistTabGroups(t: TFunction<'web'>): readonly TabGroup[] {
  return [
    {
      id: 'profile',
      label: t('artistTabGroups.profile'),
      Icon: UserCircle2,
      tabIds: ['identity', 'story', 'people'],
    },
    {
      id: 'links-press',
      label: t('artistTabGroups.linksPress'),
      Icon: Link2,
      tabIds: ['connections', 'press-kit'],
    },
    {
      id: 'visuals',
      label: t('artistTabGroups.artistBranding'),
      Icon: Images,
      tabIds: ['branding', 'gallery', 'release-visuals'],
    },
  ];
}
