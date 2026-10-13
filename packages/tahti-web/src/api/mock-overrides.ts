/**
 * Per-render overrides for the offline mock fixtures (`VITE_FORCE_MOCK=1`).
 *
 * Storybook seeds this registry per story (see
 * packages/storybook/src/tahti-web/_lib/README.md) so one story can show a
 * member profile, another a channel with no releases, without forking the
 * shared fixtures in mock.ts. The app itself never sets overrides, so with
 * an empty registry every fixture passes through unchanged.
 */
import type { PublicPressKitImage } from './artist-settings/press-kit-images';
import type { ChannelVisual, ChannelVisualPreset } from './channel-design';
import type { PublicChannelSchedule } from './channel-schedule';
import type { ArtistEvent } from './events';
import type { LikedTrack } from './likes';
import type { LiveTracklistEntry } from './live-tracklist';
import type { MessageContact } from './message-contacts';
import type { ConversationDetail, ConversationSummary } from './messages';
import type { TahtiNotification } from './notifications';
import type {
  PublicRadioShow,
  PublicRadioSlot,
  RadioShowNowPlayingTrack,
  RadioShowUpcomingTrack,
  StudioShowBooking,
} from './shows';
import type { StudioShowSeries } from './shows/types';
import type {
  StudioCollection,
  StudioReleaseList,
  StudioSound,
} from './studio-types';
import type {
  Announcement,
  ChannelDirectoryResponse,
  ChannelSoundItem,
  ChatAccess,
  ChatMessage,
  ChatTokenResponse,
  DiscoverTrackItem,
  FanTiersResponse,
  FeedResponse,
  MembershipStatus,
  PublicChannel,
  PublicCollection,
  PublicProfile,
  PublicTrackDetail,
  RadioNowPlaying,
  SearchResponse,
  SearchTrackResult,
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
  channelEvents: { data: ArtistEvent[]; args: [slug: string] };
  channelVisual: { data: ChannelVisual; args: [] };
  channelVisualPresets: { data: ChannelVisualPreset[]; args: [] };
  channelSchedule: { data: PublicChannelSchedule; args: [slug: string] };
  chatAccess: { data: ChatAccess; args: [slug: string] };
  chatHistory: { data: ChatMessage[]; args: [slug: string] };
  /** A function override that throws makes the join fail with that error. */
  chatToken: {
    data: ChatTokenResponse;
    args: [slug: string, handle: string];
  };
  collection: {
    data: PublicCollection;
    args: [slug: string, username: string];
  };
  conversation: { data: ConversationDetail | null; args: [id: string] };
  conversations: { data: ConversationSummary[]; args: [] };
  directory: { data: ChannelDirectoryResponse; args: [] };
  fanTiers: { data: FanTiersResponse; args: [username: string] };
  feed: { data: FeedResponse; args: [] };
  latestTracks: { data: DiscoverTrackItem[]; args: [] };
  liveTracklist: { data: LiveTracklistEntry[]; args: [slug: string] };
  membership: { data: MembershipStatus | null; args: [] };
  messageContacts: { data: MessageContact[]; args: [] };
  myEvents: { data: ArtistEvent[]; args: [] };
  notifications: {
    data: TahtiNotification[];
    args: [includeInboxExtras: boolean];
  };
  profile: { data: PublicProfile; args: [username: string] };
  publicGallery: { data: PublicPressKitImage[]; args: [username: string] };
  radio: { data: RadioNowPlaying; args: [] };
  radioShow: { data: PublicRadioShow | null; args: [channelSlug: string] };
  radioShowNowPlaying: {
    data: RadioShowNowPlayingTrack | null;
    args: [channelSlug: string];
  };
  radioShowUpcoming: {
    data: RadioShowUpcomingTrack[];
    args: [channelSlug: string];
  };
  radioSlots: { data: PublicRadioSlot[]; args: [from: string, to: string] };
  resetPasswordInfo: { data: PasswordLinkInfo; args: [token: string] };
  setupPasswordInfo: { data: PasswordLinkInfo; args: [token: string] };
  search: { data: SearchResponse; args: [q: string, type: string] };
  showBookings: { data: StudioShowBooking[]; args: [from: string, to: string] };
  showSeries: { data: StudioShowSeries[]; args: [] };
  smartLink: { data: SmartLinkView; args: [smartLinkSlug: string] };
  soundItems: { data: ChannelSoundItem[]; args: [slug: string] };
  studioCollections: { data: StudioCollection[]; args: [] };
  studioReleases: { data: StudioReleaseList; args: [] };
  studioSounds: { data: StudioSound[]; args: [] };
  tagTracks: { data: SearchTrackResult[]; args: [tag: string] };
  topTracks: { data: DiscoverTrackItem[]; args: [sort: 'asc' | 'desc'] };
  trackComments: { data: TrackComment[]; args: [id: string] };
  trackDetail: { data: PublicTrackDetail | null; args: [id: string] };
  userLikes: {
    data: { showLikes: boolean; items: LikedTrack[] };
    args: [username: string];
  };
  venueProfile: { data: VenueProfile | null; args: [slug: string] };
}

/** What the setup-password and reset-password link lookups resolve to. */
export type PasswordLinkInfo =
  | { ok: true; email: string; username: string; displayName: string }
  | { ok: false; error: string };

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
