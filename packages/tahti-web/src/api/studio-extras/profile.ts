import type { FetchMeta } from '.././client';
import { setMockFreeSubscriptionsEnabled } from '.././mock-profile-preferences';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '.././mode';
import { requestJson } from '.././request-json';

export type LogoPlacement = 'AVATAR' | 'COVER' | 'BOTH';

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
  /** Lists the tracks this user liked on their public profile. */
  showLikes?: boolean;
  showDailyListeners?: boolean;
  /** Handles for cross-posting/import sources — e.g. { hearthisAt: 'myhandle' }. */
  socialLinks?: Record<string, string> | null;
  /** Wide banner behind the artist page header. */
  backdropUrl?: string | null;
  logoUrl?: string | null;
  logoPlacement?: LogoPlacement | null;
  newsFeedUrl?: string | null;
  nameplateText?: string | null;
  nameplateColor?: string | null;
  /** Shows the header card (avatar, name, stats) on the channel page. */
  showPageHero?: boolean;
  /** Names this user in the annual grant report; off publishes them as
   * "Channel #<member number>" instead. Defaults to true on the API. */
  publicAttribution?: boolean;
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
  showLikes: true,
  showDailyListeners: true,
  socialLinks: {},
  publicAttribution: true,
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
        showLikes: false,
        showDailyListeners: false,
        socialLinks: {},
      },
      meta: apiErrorMeta(err),
    };
  }
}

/** Only fields with a nullable API schema accept `null`; send '' to clear the others. */
type NonNullableProfileField = 'bio' | 'tipJarUrl' | 'newsFeedUrl';

export type ProfilePatch = Partial<
  Pick<
    ProfileFields,
    | 'displayName'
    | 'fullBio'
    | 'pronouns'
    | 'chatEnabled'
    | 'freeSubscriptionsEnabled'
    | 'artistKind'
    | 'countryCode'
    | 'defaultLocation'
    | 'showJoinDate'
    | 'showFollowers'
    | 'showFollowing'
    | 'showLikes'
    | 'showDailyListeners'
    | 'socialLinks'
    | 'nameplateText'
    | 'nameplateColor'
    | 'showPageHero'
    | 'publicAttribution'
  > &
    Record<NonNullableProfileField, string>
>;

export async function patchMeProfile(
  patch: ProfilePatch,
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
