import type { FetchMeta } from '.././client';
import { setMockFreeSubscriptionsEnabled } from '.././mock-profile-preferences';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '.././mode';
import { requestJson } from '.././request-json';

export type ProfileFields = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  /** Optional longer-form history, shown expanded below the short bio. */
  fullBio?: string | null;
  avatarUrl?: string | null;
  tipJarUrl: string | null;
  pronouns: string | null;
  chatEnabled: boolean;
  freeSubscriptionsEnabled: boolean;
  artistKind?: 'SINGLE' | 'COLLECTIVE';
  /** ISO 3166-1 alpha-2, e.g. 'FI'. */
  countryCode?: string | null;
  defaultLocation?: string | null;
  showJoinDate?: boolean;
  showFollowers?: boolean;
  showFollowing?: boolean;
  showDailyListeners?: boolean;
  /** Handles for cross-posting/import sources — e.g. { hearthisAt: 'myhandle' }. */
  socialLinks?: Record<string, string> | null;
};

export let mockProfile: ProfileFields = {
  id: 'user-mock',
  username: 'demo',
  displayName: 'Demo Artist',
  bio: 'Mock bio for Nuclear studio channel settings.',
  fullBio: null,
  avatarUrl: null,
  tipJarUrl: null,
  pronouns: null,
  chatEnabled: true,
  freeSubscriptionsEnabled: true,
  artistKind: 'SINGLE',
  countryCode: null,
  defaultLocation: null,
  showJoinDate: true,
  showFollowers: true,
  showFollowing: true,
  showDailyListeners: true,
  socialLinks: {},
};

export async function fetchMeProfile(): Promise<{
  data: ProfileFields;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockProfile },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ProfileFields>('/api/me/profile');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: { ...mockProfile, username: 'unknown' },
        meta: failMeta(err),
      };
    }
    return {
      data: {
        id: '',
        username: 'unknown',
        displayName: '',
        bio: '',
        fullBio: null,
        avatarUrl: null,
        tipJarUrl: null,
        pronouns: null,
        chatEnabled: false,
        freeSubscriptionsEnabled: false,
        artistKind: 'SINGLE',
        countryCode: null,
        defaultLocation: null,
        showJoinDate: false,
        showFollowers: false,
        showFollowing: false,
        showDailyListeners: false,
        socialLinks: {},
      },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchMeProfile(
  patch: Partial<
    Pick<
      ProfileFields,
      | 'displayName'
      | 'bio'
      | 'fullBio'
      | 'tipJarUrl'
      | 'pronouns'
      | 'chatEnabled'
      | 'freeSubscriptionsEnabled'
      | 'artistKind'
      | 'countryCode'
      | 'defaultLocation'
      | 'showJoinDate'
      | 'showFollowers'
      | 'showFollowing'
      | 'showDailyListeners'
      | 'socialLinks'
    >
  >,
): Promise<{ ok: true; data: ProfileFields } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockProfile = { ...mockProfile, ...patch };
    if (patch.freeSubscriptionsEnabled !== undefined) {
      setMockFreeSubscriptionsEnabled(
        mockProfile.username,
        patch.freeSubscriptionsEnabled,
      );
    }
    return { ok: true, data: { ...mockProfile } };
  }
  try {
    const { data } = await requestJson<ProfileFields>('/api/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

// ── Posts + newsletter ──────────────────────────────────────────────────────
