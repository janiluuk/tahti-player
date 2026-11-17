import { User, Wallet } from 'lucide-react';

import {
  groupTabs,
  tabLanding,
  type GroupedTabs,
  type TabGroup,
} from './tabGroups';

export type AccountTabGroup = TabGroup;

export const ACCOUNT_TAB_GROUPS: readonly AccountTabGroup[] = [
  {
    id: 'profile',
    labelKey: 'settings.accountTabGroupProfile',
    Icon: User,
    tabIds: ['session', 'privacy', 'storage'],
  },
  {
    id: 'membership-billing',
    labelKey: 'settings.accountTabGroupMembershipBilling',
    Icon: Wallet,
    tabIds: ['membership', 'governance', 'subscriptions', 'purchases'],
  },
];

export const SECURITY_TAB_IDS = [
  'password-email',
  'devices',
  'two-factor',
  'api-tokens',
] as const;

export const NOTIFICATIONS_TAB_IDS = ['notifications', 'mentions'] as const;

export function isSecurityTabId(
  value: string | null | undefined,
): value is (typeof SECURITY_TAB_IDS)[number] {
  return Boolean(
    value && (SECURITY_TAB_IDS as readonly string[]).includes(value),
  );
}

export function isNotificationsTabId(
  value: string | null | undefined,
): value is (typeof NOTIFICATIONS_TAB_IDS)[number] {
  return Boolean(
    value && (NOTIFICATIONS_TAB_IDS as readonly string[]).includes(value),
  );
}

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
