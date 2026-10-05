import { Images, Link2, UserCircle2 } from 'lucide-react';

import type { TabGroup } from './tabGroups';

export const ARTIST_TAB_GROUPS: readonly TabGroup[] = [
  {
    id: 'profile',
    label: 'Profile',
    Icon: UserCircle2,
    tabIds: ['identity', 'story', 'people'],
  },
  {
    id: 'links-press',
    label: 'Links & press',
    Icon: Link2,
    tabIds: ['connections', 'press-kit'],
  },
  {
    id: 'visuals',
    label: 'Visuals',
    Icon: Images,
    tabIds: ['branding', 'gallery', 'release-visuals'],
  },
];
