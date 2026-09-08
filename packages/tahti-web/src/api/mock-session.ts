/**
 * Mutable in-memory state for VITE_FORCE_MOCK demos.
 * Keeps auth, follows, subscriptions, Connect, and OAuth connections
 * consistent across API modules for one browser session.
 */

import { mockChannel, mockDirectory } from './mock';
import { recordMockFanSub } from './mock-commerce-ledger';
import type { AuthUser, FanSubscriptionRow, FollowListUser } from './types';

export type MockConnectStatus = {
  stripeConfigured: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  paymentsReady: boolean;
};

export type MockOauthId =
  | 'bandcamp'
  | 'soundcloud'
  | 'google-drive'
  | 'mixcloud'
  | 'spotify'
  | 'musicbrainz';

let sessionUser: AuthUser | null = null;

const following = new Map<string, FollowListUser>(
  mockDirectory()
    .items.slice(0, 2)
    .map((c) => [
      c.slug,
      {
        username: c.slug,
        displayName: c.displayName,
        avatarUrl: c.avatarUrl,
      },
    ]),
);

let subscriptions: FanSubscriptionRow[] = [
  {
    id: 'mock-sub-1',
    tierName: 'Supporter',
    amountCents: 500,
    state: 'ACTIVE',
    currentPeriodEnd: new Date(Date.now() + 86400000 * 20).toISOString(),
    artist: {
      username: 'northern-lights',
      displayName: 'Northern Lights',
    },
  },
];

let connectStatus: MockConnectStatus = {
  stripeConfigured: true,
  accountId: null,
  chargesEnabled: false,
  detailsSubmitted: false,
  paymentsReady: false,
};

/** OAuth integrations start disconnected so Connect is exercisable. */
const oauthConnected = new Map<MockOauthId, boolean>([
  ['bandcamp', false],
  ['soundcloud', true],
  ['google-drive', false],
  ['mixcloud', false],
  ['spotify', false],
  ['musicbrainz', false],
]);

export function getMockSessionUser(): AuthUser | null {
  return sessionUser;
}

export function setMockSessionUser(user: AuthUser | null): void {
  sessionUser = user;
}

export function clearMockSessionUser(): void {
  sessionUser = null;
}

export function listMockFollowing(): FollowListUser[] {
  return Array.from(following.values());
}

export function mockFollow(username: string): void {
  const channel = mockChannel(username);
  following.set(username, {
    username: channel.user.username,
    displayName: channel.user.displayName,
    avatarUrl: channel.user.avatarUrl,
  });
}

export function mockUnfollow(username: string): void {
  following.delete(username);
}

export function listMockSubscriptions(): FanSubscriptionRow[] {
  return subscriptions.map((s) => ({ ...s, artist: { ...s.artist } }));
}

/** Matches the real POST /api/me/subscriptions/:id/cancel: marks
 * canceledAt, access lasts until currentPeriodEnd — doesn't remove or
 * flip state immediately. */
export function mockCancelSubscription(id: string): FanSubscriptionRow | null {
  const row = subscriptions.find((s) => s.id === id);
  if (!row) {
    return null;
  }
  row.canceledAt = new Date().toISOString();
  return { ...row, artist: { ...row.artist } };
}

export function mockActivateSubscription(
  username: string,
  tierId: string,
): FanSubscriptionRow {
  const channel = mockChannel(username);
  const tierName =
    tierId === 'tier-2' ? 'Patron' : tierId === 'tier-1' ? 'Supporter' : tierId;
  const amountCents = tierId === 'tier-2' ? 1500 : 500;
  const row: FanSubscriptionRow = {
    id: `mock-sub-${username}-${tierId}`,
    tierName,
    amountCents,
    state: 'ACTIVE',
    currentPeriodEnd: new Date(Date.now() + 86400000 * 30).toISOString(),
    artist: {
      username: channel.user.username,
      displayName: channel.user.displayName,
    },
  };
  subscriptions = [
    ...subscriptions.filter((s) => s.artist.username !== username),
    row,
  ];
  const fan = sessionUser;
  recordMockFanSub({
    fanUsername: fan?.username ?? 'pending',
    fanDisplayName: fan?.displayName ?? fan?.username ?? 'pending',
    artistUsername: channel.user.username,
    tierName,
    amountCents,
  });
  return row;
}

export function getMockConnectStatus(): MockConnectStatus {
  return { ...connectStatus };
}

export function mockCompleteConnectOnboard(): MockConnectStatus {
  connectStatus = {
    stripeConfigured: true,
    accountId: 'acct_mock_demo',
    chargesEnabled: true,
    detailsSubmitted: true,
    paymentsReady: true,
  };
  return getMockConnectStatus();
}

export function isMockOauthConnected(id: MockOauthId): boolean {
  return oauthConnected.get(id) ?? false;
}

export function setMockOauthConnected(
  id: MockOauthId,
  connected: boolean,
): void {
  oauthConnected.set(id, connected);
}

/** Build a studio-ready demo user (channel slug matches username). */
export function buildMockLoginUser(
  email: string,
  overrides?: Partial<AuthUser>,
): AuthUser {
  const mockAdmin = import.meta.env.VITE_MOCK_ADMIN === '1';
  const username =
    email
      .split('@')[0]
      ?.replace(/\+.*$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '') || 'demo';
  const user: AuthUser = {
    id: `mock-${email}`,
    email,
    username,
    displayName: username === 'demo' ? 'Demo Artist' : username,
    role: mockAdmin ? 'BOARD' : 'ARTIST',
    roles: mockAdmin ? ['BOARD', 'ARTIST'] : ['ARTIST'],
    tier: 'ARTIST',
    avatarUrl: null,
    isMember: true,
    isBoard: mockAdmin,
    channel: {
      slug: username,
      state: 'OFFLINE',
      goneLiveAt: null,
      customDomain: null,
      customDomainVerified: false,
    },
    ...overrides,
  };
  // Seeded/demo accounts skip the "Finish your profile?" toast — they are
  // already "set up" for testing (same key OnboardingView uses).
  try {
    localStorage.setItem(`tahti-web-onboarded:${user.id}`, '1');
  } catch {
    // ignore
  }
  return user;
}
