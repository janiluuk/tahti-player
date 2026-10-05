import type { LucideIcon } from 'lucide-react';
import { Bell, Lock, Shield, Wallet } from 'lucide-react';

export type AccountTabGroup = {
  id: string;
  label: string;
  Icon: LucideIcon;
  /** Ids of the Account tabs shown under this group, in order. */
  tabIds: readonly string[];
};

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
): { group: AccountTabGroup; tabs: T[] }[] {
  return ACCOUNT_TAB_GROUPS.map((group) => ({
    group,
    tabs: group.tabIds.flatMap((id) => tabs.filter((tab) => tab.id === id)),
  })).filter((entry) => entry.tabs.length > 0);
}

/** Where a deep link to one Account tab lands: its group and its place in it. */
export function accountTabLanding(tabId: string | null): {
  group: number;
  tab: number;
} {
  for (const [group, entry] of ACCOUNT_TAB_GROUPS.entries()) {
    const tab = tabId ? entry.tabIds.indexOf(tabId) : -1;
    if (tab >= 0) {
      return { group, tab };
    }
  }
  return { group: 0, tab: 0 };
}
