import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_TAB_IDS,
  accountTabIndex,
  isNotificationsTabId,
  isSecurityTabId,
} from './accountTabGroups';

describe('account tabs', () => {
  it('is one row of five tabs, subscriptions and purchases together', () => {
    expect(ACCOUNT_TAB_IDS).toEqual([
      'session',
      'membership',
      'subscriptions',
      'storage',
      'privacy',
    ]);
  });

  it('lands a deep link on its tab', () => {
    expect(accountTabIndex('subscriptions')).toBe(2);
    expect(accountTabIndex('purchases')).toBe(2);
    expect(accountTabIndex('privacy')).toBe(4);
  });

  it('opens Membership for an old Governance link', () => {
    expect(accountTabIndex('governance')).toBe(1);
  });

  it('lands on the first tab without a deep link or for an unknown one', () => {
    expect(accountTabIndex(null)).toBe(0);
    expect(accountTabIndex('nope')).toBe(0);
  });

  it('recognises tabs that moved to Security and Notifications', () => {
    expect(isSecurityTabId('api-tokens')).toBe(true);
    expect(isSecurityTabId('session')).toBe(false);
    expect(isNotificationsTabId('mentions')).toBe(true);
    expect(isNotificationsTabId('privacy')).toBe(false);
  });
});
