/**
 * Per-render overrides for the offline mock fixtures (`VITE_FORCE_MOCK=1`).
 *
 * Storybook seeds this registry per story (see
 * packages/storybook/src/tahti-web/_lib/README.md) so one story can show a
 * member profile, another a channel with no releases, without forking the
 * shared fixtures in mock.ts. The app itself never sets overrides, so with
 * an empty registry every fixture passes through unchanged.
 */
import type { StudioCollection, StudioSound } from './studio-types';
import type {
  Announcement,
  ChannelDirectoryResponse,
  ChannelSoundItem,
  ChatMessage,
  DiscoverTrackItem,
  FanTiersResponse,
  FeedResponse,
  PublicChannel,
  PublicCollection,
  PublicProfile,
  PublicTrackDetail,
  RadioNowPlaying,
  SearchResponse,
  SmartLinkView,
  TrackComment,
  VenueProfile,
} from './types';

/**
 * Overridable fixtures: `data` is what the fixture returns, `args` what the
 * fixture function was called with (handed to function-form overrides).
 * To make another fixture overridable, add a row here and wrap its return
 * value in {@link mockFixture}.
 */
export interface MockFixtures {
  announcements: { data: Announcement[]; args: [] };
  channel: { data: PublicChannel; args: [slug: string] };
  chatHistory: { data: ChatMessage[]; args: [slug: string] };
  collection: {
    data: PublicCollection;
    args: [slug: string, username: string];
  };
  directory: { data: ChannelDirectoryResponse; args: [] };
  fanTiers: { data: FanTiersResponse; args: [username: string] };
  feed: { data: FeedResponse; args: [] };
  latestTracks: { data: DiscoverTrackItem[]; args: [] };
  profile: { data: PublicProfile; args: [username: string] };
  radio: { data: RadioNowPlaying; args: [] };
  search: { data: SearchResponse; args: [q: string, type: string] };
  smartLink: { data: SmartLinkView; args: [smartLinkSlug: string] };
  soundItems: { data: ChannelSoundItem[]; args: [slug: string] };
  studioCollections: { data: StudioCollection[]; args: [] };
  studioSounds: { data: StudioSound[]; args: [] };
  topTracks: { data: DiscoverTrackItem[]; args: [sort: 'asc' | 'desc'] };
  trackComments: { data: TrackComment[]; args: [id: string] };
  trackDetail: { data: PublicTrackDetail | null; args: [id: string] };
  venueProfile: { data: VenueProfile | null; args: [slug: string] };
}

export type MockFixtureKey = keyof MockFixtures;

/** Objects merge key by key; arrays and primitives replace wholesale. */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/**
 * Either a deep-partial patch merged onto the base fixture, or a function
 * that receives the base fixture plus the fixture's call arguments and
 * returns the full replacement.
 */
export type MockFixtureOverride<K extends MockFixtureKey> =
  | DeepPartial<NonNullable<MockFixtures[K]['data']>>
  | ((
      base: MockFixtures[K]['data'],
      ...args: MockFixtures[K]['args']
    ) => MockFixtures[K]['data']);

export type MockOverrides = {
  [K in MockFixtureKey]?: MockFixtureOverride<K>;
};

let active: MockOverrides = {};

/** Replaces the whole registry; pass `{}` to clear it. */
export function setMockOverrides(overrides: MockOverrides): void {
  active = overrides;
}

export function resetMockOverrides(): void {
  active = {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(patch) || !isPlainObject(base)) {
    return (patch === undefined ? base : patch) as T;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    out[key] = deepMerge(out[key], value);
  }
  return out as T;
}

/**
 * Returns `base` with the active override for `key` applied. A patch on a
 * `null` base (e.g. an unknown track id) returns the patch itself.
 */
export function mockFixture<K extends MockFixtureKey>(
  key: K,
  base: MockFixtures[K]['data'],
  ...args: MockFixtures[K]['args']
): MockFixtures[K]['data'] {
  // Widened on purpose: narrowing the per-key union here exceeds tsc's
  // union complexity limit; setMockOverrides() already type-checks callers.
  const override: unknown = active[key];
  if (override === undefined) {
    return base;
  }
  if (typeof override === 'function') {
    return (override as (base: unknown, ...rest: unknown[]) => unknown)(
      base,
      ...args,
    ) as MockFixtures[K]['data'];
  }
  return deepMerge(base, override);
}
