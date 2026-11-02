import { describe, expect, it } from 'vitest';

import { persistedAuthUser } from './authStore';

describe('persistedAuthUser', () => {
  it('keeps what the chrome needs and drops the email and channel extras', () => {
    const stored = persistedAuthUser({
      id: 'u1',
      email: 'liina@example.com',
      username: 'liina',
      displayName: 'Liina',
      role: 'ARTIST',
      avatarUrl: 'https://cdn/a.png',
      isMember: true,
      isBoard: false,
      channel: {
        slug: 'liina',
        state: 'OFFLINE',
        customDomain: 'liina.fi',
        customDomainVerified: true,
        goneLiveAt: '2026-11-01T00:00:00Z',
      },
    });
    expect(stored.email).toBe('');
    expect(JSON.stringify(stored)).not.toContain('example.com');
    expect(stored).toMatchObject({
      id: 'u1',
      username: 'liina',
      displayName: 'Liina',
      role: 'ARTIST',
      isMember: true,
      channel: { slug: 'liina', state: 'OFFLINE' },
    });
    expect(stored.channel).not.toHaveProperty('customDomain');
  });

  it('keeps a missing channel as it was', () => {
    const base = { id: 'u2', email: 'x@y.z', username: 'x', displayName: 'X' };
    expect(persistedAuthUser({ ...base, channel: null }).channel).toBeNull();
    expect(persistedAuthUser(base).channel).toBeUndefined();
  });
});
