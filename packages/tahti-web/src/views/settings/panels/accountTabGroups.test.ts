import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_TAB_GROUPS,
  accountTabLanding,
  groupAccountTabs,
  isNotificationsTabId,
  isSecurityTabId,
} from './accountTabGroups';

const ALL_TABS = [
  'session',
  'membership',
  'governance',
  'storage',
  'subscriptions',
  'purchases',
  'privacy',
].map((id) => ({ id }));

describe('account tab groups', () => {
  it('puts every remaining Account tab in profile or membership', () => {
    const grouped = groupAccountTabs(ALL_TABS);
    expect(grouped.map((entry) => entry.group.labelKey)).toEqual([
      'settings.accountTabGroupProfile',
      'settings.accountTabGroupMembershipBilling',
    ]);
    const placed = grouped.flatMap((entry) => entry.tabs.map((tab) => tab.id));
    expect([...placed].sort()).toEqual(ALL_TABS.map((tab) => tab.id).sort());
    expect(new Set(placed).size).toBe(placed.length);
  });

  it('drops a group whose tabs are all missing', () => {
    const grouped = groupAccountTabs([{ id: 'session' }]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].group.id).toBe('profile');
  });

  it('lands a deep link on its group and tab', () => {
    expect(accountTabLanding('subscriptions')).toEqual({ group: 1, tab: 2 });
    expect(ACCOUNT_TAB_GROUPS[1].tabIds[2]).toBe('subscriptions');
    expect(accountTabLanding('privacy')).toEqual({ group: 0, tab: 1 });
    expect(ACCOUNT_TAB_GROUPS[0].tabIds[1]).toBe('privacy');
  });

  it('lands on the first tab without a deep link or for an unknown one', () => {
    expect(accountTabLanding(null)).toEqual({ group: 0, tab: 0 });
    expect(accountTabLanding('nope')).toEqual({ group: 0, tab: 0 });
  });

  it('recognises tabs that moved to Security and Notifications', () => {
    expect(isSecurityTabId('api-tokens')).toBe(true);
    expect(isSecurityTabId('session')).toBe(false);
    expect(isNotificationsTabId('mentions')).toBe(true);
    expect(isNotificationsTabId('privacy')).toBe(false);
  });
});
