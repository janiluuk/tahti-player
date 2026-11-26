/** Account is one tab row. Governance left it for Co-op; an old
 * `?tab=governance` link opens Membership, which links there. */
export const ACCOUNT_TAB_IDS = [
  'session',
  'membership',
  'subscriptions',
  'storage',
  'privacy',
] as const;

/** The tab a deep link to Account opens. Purchases share the
 * subscriptions tab. */
export function accountTabIndex(tabId: string | null | undefined): number {
  const target =
    tabId === 'governance'
      ? 'membership'
      : tabId === 'purchases'
        ? 'subscriptions'
        : tabId;
  return Math.max(0, (ACCOUNT_TAB_IDS as readonly unknown[]).indexOf(target));
}

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
