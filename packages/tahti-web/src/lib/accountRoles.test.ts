import { describe, expect, it } from 'vitest';

import {
  accountRoleLabel,
  getAccountRole,
  hasAccountRole,
} from './accountRoles';

describe('account roles', () => {
  it.each([
    [{ role: 'BOARD' as const }, 'BOARD'],
    [{ role: 'ARTIST' as const }, 'ARTIST'],
    [{ role: 'LISTENER' as const }, 'LISTENER'],
  ])('keeps the explicit %s role', (user, expected) => {
    expect(getAccountRole(user)).toBe(expected);
  });

  it('maps legacy board access to the Board role', () => {
    expect(getAccountRole({ tier: 'ARTIST', isBoard: true })).toBe('BOARD');
    expect(hasAccountRole({ isBoard: true }, 'BOARD')).toBe(true);
  });

  it('maps legacy artist and free tiers to Artist and Listener', () => {
    expect(getAccountRole({ tier: 'ARTIST' })).toBe('ARTIST');
    expect(getAccountRole({ tier: 'STUDIO' })).toBe('ARTIST');
    expect(getAccountRole({ tier: 'FREE' })).toBe('LISTENER');
  });

  it('formats canonical role labels', () => {
    expect(accountRoleLabel('BOARD')).toBe('Board');
    expect(accountRoleLabel('ARTIST')).toBe('Artist');
    expect(accountRoleLabel('LISTENER')).toBe('Listener');
  });
});
