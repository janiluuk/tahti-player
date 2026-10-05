import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_TAB_GROUPS,
  accountTabLanding,
  groupAccountTabs,
} from './accountTabGroups';

const ALL_TABS = [
  'session',
  'two-factor',
  'api-tokens',
  'membership',
  'governance',
  'storage',
  'notifications',
  'mentions',
  'subscriptions',
  'purchases',
  'privacy',
].map((id) => ({ id }));

describe('account tab groups', () => {
  it('puts every tab in exactly one of four groups', () => {
    const grouped = groupAccountTabs(ALL_TABS);
    expect(grouped.map((entry) => entry.group.label)).toEqual([
      'Sign-in & security',
      'Membership & billing',
      'Notifications',
      'Privacy & data',
    ]);
    const placed = grouped.flatMap((entry) => entry.tabs.map((tab) => tab.id));
    expect([...placed].sort()).toEqual(ALL_TABS.map((tab) => tab.id).sort());
    expect(new Set(placed).size).toBe(placed.length);
  });

  it('drops a group whose tabs are all missing', () => {
    const grouped = groupAccountTabs([{ id: 'session' }]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].group.id).toBe('sign-in');
  });

  it('lands a deep link on its group and tab', () => {
    expect(accountTabLanding('subscriptions')).toEqual({ group: 1, tab: 2 });
    expect(ACCOUNT_TAB_GROUPS[1].tabIds[2]).toBe('subscriptions');
  });

  it('lands on the first tab without a deep link or for an unknown one', () => {
    expect(accountTabLanding(null)).toEqual({ group: 0, tab: 0 });
    expect(accountTabLanding('nope')).toEqual({ group: 0, tab: 0 });
  });
});
