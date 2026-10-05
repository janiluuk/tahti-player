import { Bell, Lock, Shield, Wallet } from 'lucide-react';

import {
  groupTabs,
  tabLanding,
  type GroupedTabs,
  type TabGroup,
} from './tabGroups';

export type AccountTabGroup = TabGroup;

export const ACCOUNT_TAB_GROUPS: readonly AccountTabGroup[] = [
  {
    id: 'sign-in',
    label: 'Sign-in & security',
    Icon: Lock,
    tabIds: ['session', 'two-factor', 'api-tokens'],
  },
  {
    id: 'membership-billing',
    label: 'Membership & billing',
    Icon: Wallet,
    tabIds: ['membership', 'governance', 'subscriptions', 'purchases'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    Icon: Bell,
    tabIds: ['notifications', 'mentions'],
  },
  {
    id: 'privacy-data',
    label: 'Privacy & data',
    Icon: Shield,
    tabIds: ['privacy', 'storage'],
  },
];

export function groupAccountTabs<T extends { id: string }>(
  tabs: readonly T[],
): GroupedTabs<T> {
  return groupTabs(ACCOUNT_TAB_GROUPS, tabs);
}

/** Where a deep link to one Account tab lands: its group and its place in it. */
export function accountTabLanding(tabId: string | null): {
  group: number;
  tab: number;
} {
  return tabLanding(
    groupTabs(
      ACCOUNT_TAB_GROUPS,
      ACCOUNT_TAB_GROUPS.flatMap((group) => group.tabIds.map((id) => ({ id }))),
    ),
    tabId,
  );
}
