import { describe, expect, it } from 'vitest';

import { buildMockLoginUser, isMockListenerEmail } from './mock-session';

describe('mock listener sign-in', () => {
  it('recognises listener addresses only', () => {
    expect(isMockListenerEmail('listener@tahti.live')).toBe(true);
    expect(isMockListenerEmail('Listener+two@example.com')).toBe(true);
    expect(isMockListenerEmail('demo@tahti.live')).toBe(false);
    expect(isMockListenerEmail('listeners-club@example.com')).toBe(false);
  });

  it('builds a registered account with no channel, membership or staff role', () => {
    const user = buildMockLoginUser('listener@tahti.live');
    expect(user).toMatchObject({
      username: 'listener',
      displayName: 'Demo Listener',
      role: 'LISTENER',
      roles: ['LISTENER'],
      isMember: false,
      isBoard: false,
      channel: null,
    });
  });

  it('still builds a studio-ready artist for any other address', () => {
    const user = buildMockLoginUser('demo@tahti.live');
    expect(user.role === 'ARTIST' || user.role === 'BOARD').toBe(true);
    expect(user.channel?.slug).toBe('demo');
    expect(user.isMember).toBe(true);
  });
});
