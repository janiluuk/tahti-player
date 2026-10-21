import type { AccountRole } from '../api/types';

type AccountRoleSource = {
  role?: AccountRole;
  roles?: AccountRole[];
  tier?: string;
  isBoard?: boolean;
  channel?: unknown;
};

const ACCOUNT_ROLES: AccountRole[] = ['BOARD', 'ARTIST', 'LISTENER'];

export const getAccountRole = (user: AccountRoleSource): AccountRole => {
  if (user.role && ACCOUNT_ROLES.includes(user.role)) {
    return user.role;
  }
  if (user.roles?.includes('BOARD') || user.isBoard) {
    return 'BOARD';
  }
  if (
    user.roles?.includes('ARTIST') ||
    user.tier === 'ARTIST' ||
    user.tier === 'STUDIO' ||
    Boolean(user.channel)
  ) {
    return 'ARTIST';
  }
  return 'LISTENER';
};

export const hasAccountRole = (
  user: AccountRoleSource | null | undefined,
  role: AccountRole,
): boolean => Boolean(user && getAccountRole(user) === role);

/** Studio is for accounts that publish: artists and the board. */
export const hasStudioAccess = (
  user: AccountRoleSource | null | undefined,
): boolean => hasAccountRole(user, 'ARTIST') || hasAccountRole(user, 'BOARD');

export const accountRoleLabel = (role: AccountRole): string =>
  role.charAt(0) + role.slice(1).toLowerCase();
