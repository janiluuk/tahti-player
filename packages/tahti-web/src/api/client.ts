import { listenerFingerprint } from '../lib/listenerFingerprint';
import {
  mockGovernanceDocuments,
  mockGovernanceMeetings,
  mockGovernanceMembers,
  mockGovernanceQuarterlyReports,
} from './governanceMocks';
import { listEnabledMockInternetRadioPresets } from './internetRadioPresetsMockStore';
import {
  archiveItemToPlayable,
  channelToPlayable,
  DEMO_MP3,
  mockAnnouncements,
  mockArchiveItems,
  mockChannel,
  mockChatAccess,
  mockChatHistory,
  mockCollection,
  mockDirectory,
  mockFanTiers,
  mockFeed,
  mockProfile,
  mockRadio,
  mockRadioRecentlyPlayed,
  mockSearch,
  mockSmartLink,
  mockTrackComments,
  mockTrackDetail,
  mockTransparencyGrants,
  mockTransparencyLedger,
  mockTransparencyYtd,
  mockVenueProfile,
  mockVenues,
  radioToPlayable,
  TAHTI_RADIO_SLUG,
} from './mock';
import {
  buildMockLoginUser,
  clearMockSessionUser,
  getMockSessionUser,
  listMockFollowing,
  listMockSubscriptions,
  mockActivateSubscription,
  mockFollow,
  mockUnfollow,
  setMockSessionUser,
} from './mock-session';
import { getMockUploadedSound } from './mock-uploads';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
  withMockFallback,
  type FetchMeta,
} from './mode';
import { findMockPurchaseTier } from './purchase-tiers';
import type {
  Announcement,
  ArchiveItem,
  AuthUser,
  ChannelDirectoryResponse,
  ChannelEmbedView,
  ChatAccess,
  ChatMessage,
  ChatTokenResponse,
  CollectionEmbedView,
  FanSubscriptionRow,
  FanTiersResponse,
  FeatureRequest,
  FeedResponse,
  FollowListUser,
  GovernanceDocument,
  GovernanceMeeting,
  GovernanceMember,
  GovernanceMotion,
  GovernanceMotionDraft,
  GovernanceQuarterlyReport,
  MembershipStatus,
  OnAirChannelResponse,
  PlatformStatus,
  PublicChannel,
  PublicCollection,
  PublicGovernanceMotion,
  PublicProfile,
  PublicTrackDetail,
  RadioNowPlaying,
  RadioRecentlyPlayedItem,
  ReleaseEmbedView,
  SearchResponse,
  SmartLinkView,
  TahtiPlayable,
  TrackComment,
  TransparencyGrantReport,
  TransparencyLedgerEntry,
  TransparencyYtd,
  VenueDirectoryItem,
  VenueProfile,
} from './types';

export type { FetchMeta };
export { TAHTI_RADIO_SLUG };

const forceMock = isForceMock;

/** Browser calls go through Vite proxy → Tahti API (avoids CORS). */
export const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

async function getJson<T>(path: string): Promise<T> {
  const { data } = await requestJson<T>(path);
  return data;
}

export async function fetchDirectory(): Promise<{
  data: ChannelDirectoryResponse;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockDirectory(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<ChannelDirectoryResponse>(
      '/api/v1/channels/directory',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(err, mockDirectory, () => ({ items: [] }));
  }
}

/** Global search — top nav search bar. type narrows to one result kind;
 * omit for all three at once. */
export async function fetchSearch(
  q: string,
  type: 'all' | 'tracks' | 'artists' | 'collections' = 'all',
): Promise<{
  data: SearchResponse;
  meta: FetchMeta;
}> {
  const empty: SearchResponse = { tracks: [], artists: [], collections: [] };
  if (!q.trim()) {
    return { data: empty, meta: { source: 'api' } };
  }
  if (forceMock()) {
    return {
      data: mockSearch(q, type),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<SearchResponse>(
      `/api/v1/search?q=${encodeURIComponent(q)}&type=${type}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      () => mockSearch(q, type),
      () => empty,
    );
  }
}

export async function fetchOnAirChannels(): Promise<{
  data: OnAirChannelResponse;
  meta: FetchMeta;
}> {
  const empty = (): OnAirChannelResponse => ({
    live: [],
    replaying: [],
    recent: [],
  });
  const mock = (): OnAirChannelResponse => ({
    live: mockDirectory()
      .items.filter(
        (item) =>
          item.slug === TAHTI_RADIO_SLUG || item.slug === 'northern-lights',
      )
      .map((item) => ({
        slug: item.slug,
        state: 'LIVE',
        fallbackEnabled: false,
        user: {
          username: item.username,
          displayName: item.displayName,
          avatarUrl: item.avatarUrl,
        },
      })),
    replaying: [],
    recent: [],
  });
  if (forceMock()) {
    return {
      data: mock(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    return {
      data: await getJson<OnAirChannelResponse>('/api/v1/channels'),
      meta: { source: 'api' },
    };
  } catch (err) {
    return withMockFallback(err, mock, empty);
  }
}

export async function fetchChannel(slug: string): Promise<{
  data: PublicChannel;
  meta: FetchMeta;
  playable: TahtiPlayable | null;
}> {
  if (forceMock()) {
    const data = mockChannel(slug);
    return {
      data,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      playable: channelToPlayable(data),
    };
  }
  try {
    const data = await getJson<PublicChannel>(
      `/api/channels/${encodeURIComponent(slug)}`,
    );
    return { data, meta: { source: 'api' }, playable: channelToPlayable(data) };
  } catch (err) {
    if (allowMockFallback()) {
      const data = mockChannel(slug);
      return { data, meta: failMeta(err), playable: channelToPlayable(data) };
    }
    throw err instanceof Error ? err : new Error('Channel fetch failed');
  }
}

export async function fetchChannelArchive(slug: string): Promise<{
  data: ArchiveItem[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockArchiveItems(slug),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<ArchiveItem[]>(
      `/api/channels/${encodeURIComponent(slug)}/items`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      () => mockArchiveItems(slug),
      () => [],
    );
  }
}

/** Appends a private-share key as `?key=` (or `&key=` if the path already
 * has a query string) — the one thing every call below needs to pass
 * through to let the backend recognize "this request is using a share
 * link for a PRIVATE/STASH sound, not normal public access" and (per the
 * share-link contract) serve it without a public visibility check, and
 * log the access/interaction to the audit log instead of fanning it out
 * as a normal public activity/notification event. */
function withShareKey(path: string, shareKey: string | undefined): string {
  if (!shareKey) {
    return path;
  }
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}key=${encodeURIComponent(shareKey)}`;
}

function mockTrackDetailFromUpload(id: string): PublicTrackDetail | null {
  const uploaded = getMockUploadedSound(id);
  if (!uploaded || uploaded.visibility === 'PRIVATE') {
    return null;
  }
  const channel = mockChannel(uploaded.channelSlug);
  const purchaseTierId = uploaded.purchaseTierId ?? null;
  const tier = purchaseTierId
    ? findMockPurchaseTier(uploaded.channelSlug, purchaseTierId)
    : null;
  return {
    id: uploaded.id,
    title: uploaded.title,
    artistName: channel.user.displayName,
    channelSlug: uploaded.channelSlug,
    channel: {
      username: uploaded.channelSlug,
      displayName: channel.user.displayName,
      avatarUrl: channel.user.avatarUrl,
      bio: channel.user.bio,
    },
    durationSec: null,
    audioUrl: uploaded.objectUrl,
    embedProvider: null,
    embedUri: null,
    bannerUrl: null,
    backgroundUrl: null,
    slideshowUrls: [],
    galleryMode: 'NONE',
    genre: null,
    subGenres: [],
    contentType: 'TRACK',
    mixVersion: null,
    description: null,
    commentary: null,
    license: 'ALL_RIGHTS_RESERVED',
    releasedAt: new Date().toISOString(),
    effectiveBpm: null,
    effectiveKey: null,
    peaks: null,
    commentCount: 0,
    downloadCount: 0,
    accessMode: uploaded.accessMode ?? 'FREE',
    purchaseTierId,
    purchaseTierName: tier?.name ?? null,
    purchaseTierPriceCents: tier?.priceCents ?? null,
    downloadsEnabled: uploaded.downloadsEnabled,
  };
}

/** Full detail for a standalone track page — reached only by track id, so
 * (unlike fetchChannelArchive) it can't rely on already knowing the channel.
 * `shareKey` is the token from a PRIVATE/STASH sound's share link
 * (`/t/$id?key=...`) — see withShareKey. */
export async function fetchTrackDetail(
  id: string,
  shareKey?: string,
): Promise<{
  data: PublicTrackDetail | null;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockTrackDetail(id) ?? mockTrackDetailFromUpload(id),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<PublicTrackDetail>(
      withShareKey(`/api/tracks/${encodeURIComponent(id)}`, shareKey),
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      () => mockTrackDetail(id) ?? mockTrackDetailFromUpload(id),
      () => null,
    );
  }
}

export async function fetchTrackComments(
  id: string,
  shareKey?: string,
): Promise<{
  data: { comments: TrackComment[]; commentsEnabled: boolean };
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: {
        comments: mockTrackComments(id),
        commentsEnabled: true,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{
      comments: TrackComment[];
      commentsEnabled: boolean;
    }>(withShareKey(`/api/comments/track/${encodeURIComponent(id)}`, shareKey));
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      () => ({ comments: mockTrackComments(id), commentsEnabled: true }),
      () => ({ comments: mockTrackComments(id), commentsEnabled: true }),
    );
  }
}

export async function postTrackComment(
  id: string,
  body: string,
  shareKey?: string,
): Promise<{ ok: true; data: TrackComment } | { ok: false; error: string }> {
  if (forceMock()) {
    return {
      ok: true,
      data: {
        id: `mock-comment-${Date.now()}`,
        body,
        authorUsername: 'you',
        authorDisplayName: 'You',
        authorAvatarUrl: null,
        createdAt: new Date().toISOString(),
      },
    };
  }
  try {
    const { data } = await requestJson<TrackComment>(
      withShareKey(`/api/comments/track/${encodeURIComponent(id)}`, shareKey),
      { method: 'POST', body: JSON.stringify({ body }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not post comment',
    };
  }
}

const ARCHIVE_DOWNLOAD_SOURCE_FORMAT = 'source';

export async function fetchPublicArchiveDownload(
  channelSlug: string,
  itemId: string,
): Promise<
  { ok: true; url: string; filename?: string } | { ok: false; error: string }
> {
  if (forceMock()) {
    const uploaded = getMockUploadedSound(itemId);
    if (uploaded) {
      return {
        ok: true,
        url: uploaded.objectUrl,
        filename: uploaded.filename,
      };
    }
    return { ok: true, url: DEMO_MP3, filename: 'tahti-sound.mp3' };
  }
  try {
    const fp = encodeURIComponent(listenerFingerprint());
    const path = `/api/v1/c/${encodeURIComponent(channelSlug)}/archive/${encodeURIComponent(itemId)}/download`;
    const tryFormats = [ARCHIVE_DOWNLOAD_SOURCE_FORMAT, undefined] as const;
    for (const format of tryFormats) {
      try {
        const query = format ? `?fp=${fp}&format=${format}` : `?fp=${fp}`;
        const { data } = await requestJson<{ url?: string; filename?: string }>(
          `${path}${query}`,
        );
        if (data.url) {
          return { ok: true, url: data.url, filename: data.filename };
        }
      } catch (err) {
        if (format === undefined) {
          throw err;
        }
      }
    }
    return { ok: false, error: 'Download unavailable' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Download unavailable',
    };
  }
}

export async function fetchRadio(): Promise<{
  data: RadioNowPlaying;
  meta: FetchMeta;
  playable: TahtiPlayable | null;
}> {
  if (forceMock()) {
    const data = mockRadio();
    return {
      data,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      playable: radioToPlayable(data),
    };
  }
  try {
    const data = await getJson<RadioNowPlaying>('/api/v1/radio');
    if (data.live && data.channel?.slug && !data.channel.hlsUrl) {
      const ch = await fetchChannel(data.channel.slug);
      if (ch.playable) {
        return {
          data: {
            ...data,
            channel: {
              ...data.channel,
              hlsUrl: ch.playable.streamUrl,
              displayName: ch.data.user.displayName,
            },
          },
          meta: ch.meta,
          playable: {
            ...ch.playable,
            kind: 'radio',
            id: `radio:${ch.data.slug}`,
            title: data.channel.title ?? ch.playable.title,
          },
        };
      }
    }
    return { data, meta: { source: 'api' }, playable: radioToPlayable(data) };
  } catch (err) {
    if (allowMockFallback()) {
      const data = mockRadio();
      return { data, meta: failMeta(err), playable: radioToPlayable(data) };
    }
    return {
      data: { live: false, channel: null },
      meta: apiErrorMeta(err),
      playable: null,
    };
  }
}

/** Board-curated internet radio station, shown in the Listen page radio feed
 * for every visitor (no auth) once an admin marks it enabled. */
export type EnabledInternetRadioPreset = {
  id: string;
  name: string;
  genre: string | null;
  description: string | null;
  iconUrl: string | null;
  streamUrl: string | null;
};

function mockEnabledInternetRadioPresets(): EnabledInternetRadioPreset[] {
  return listEnabledMockInternetRadioPresets();
}

export async function fetchEnabledInternetRadioPresets(): Promise<{
  data: EnabledInternetRadioPreset[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockEnabledInternetRadioPresets(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ presets: EnabledInternetRadioPreset[] }>(
      '/api/v1/internet-radio/presets/enabled',
    );
    return { data: data.presets, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(err, mockEnabledInternetRadioPresets, () => []);
  }
}

/** Always-on Tahti Radio station (`/api/channels/tahti-radio`) — primary `/radio` feed. */
export async function fetchRadioStation(): Promise<{
  data: PublicChannel;
  meta: FetchMeta;
  playable: TahtiPlayable | null;
}> {
  return fetchChannel(TAHTI_RADIO_SLUG);
}

export async function fetchRadioRecentlyPlayed(): Promise<{
  data: RadioRecentlyPlayedItem[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockRadioRecentlyPlayed(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<RadioRecentlyPlayedItem[]>(
      '/api/v1/radio/recently-played',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(err, mockRadioRecentlyPlayed, () => []);
  }
}

export async function fetchProfile(username: string): Promise<{
  data: PublicProfile;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockProfile(username),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<PublicProfile>(
      `/api/v1/u/${encodeURIComponent(username)}/profile`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockProfile(username), meta: failMeta(err) };
    }
    throw err instanceof Error ? err : new Error('Profile fetch failed');
  }
}

export async function fetchArtistPlayables(username: string): Promise<{
  data: TahtiPlayable[];
  meta: FetchMeta;
}> {
  const profile = await fetchProfile(username);
  const data = profile.data.tracks.flatMap((track) => {
    if (!track.playUrl) {
      return [];
    }
    return [
      {
        id: `archive:${track.id}`,
        kind: 'archive' as const,
        title: track.title,
        artist: track.artistName ?? profile.data.artist.displayName,
        coverUrl: track.bannerUrl ?? undefined,
        streamUrl: track.playUrl,
        protocol: track.playUrl.includes('.m3u8')
          ? ('hls' as const)
          : ('https' as const),
        channelSlug: profile.data.channel?.slug,
      },
    ];
  });
  return { data, meta: profile.meta };
}

export async function fetchCollection(slug: string): Promise<{
  data: PublicCollection;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockCollection(slug),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<PublicCollection>(
      `/api/v1/collections/${encodeURIComponent(slug)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockCollection(slug), meta: failMeta(err) };
    }
    throw err instanceof Error ? err : new Error('Collection fetch failed');
  }
}

export async function fetchCollectionSubscription(slug: string): Promise<{
  subscribed: boolean;
  subscriberCount: number;
}> {
  if (forceMock()) {
    return { subscribed: false, subscriberCount: 0 };
  }
  try {
    return await getJson<{ subscribed: boolean; subscriberCount: number }>(
      `/api/v1/collections/${encodeURIComponent(slug)}/subscribe`,
    );
  } catch (err) {
    if (allowMockFallback()) {
      return { subscribed: false, subscriberCount: 0 };
    }
    throw err instanceof Error
      ? err
      : new Error('Collection subscription failed');
  }
}

export async function setCollectionSubscription(
  slug: string,
  subscribed: boolean,
): Promise<{ subscribed: boolean; subscriberCount: number }> {
  if (forceMock()) {
    return { subscribed, subscriberCount: subscribed ? 1 : 0 };
  }
  const { data } = await requestJson<{
    subscribed: boolean;
    subscriberCount: number;
  }>(`/api/v1/collections/${encodeURIComponent(slug)}/subscribe`, {
    method: subscribed ? 'POST' : 'DELETE',
  });
  return data;
}

export async function fetchSmartLink(smartLinkSlug: string): Promise<{
  data: SmartLinkView;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockSmartLink(smartLinkSlug),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<SmartLinkView>(
      `/api/v1/r/${encodeURIComponent(smartLinkSlug)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockSmartLink(smartLinkSlug), meta: failMeta(err) };
    }
    throw err instanceof Error ? err : new Error('Smart link fetch failed');
  }
}

export async function fetchVenues(): Promise<{
  data: VenueDirectoryItem[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockVenues(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<VenueDirectoryItem[]>('/api/v1/venues');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(err, mockVenues, () => []);
  }
}

export async function fetchVenueProfile(slug: string): Promise<{
  data: VenueProfile | null;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockVenueProfile(slug),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<VenueProfile>(
      `/api/v1/venues/${encodeURIComponent(slug)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      () => mockVenueProfile(slug),
      () => null,
    );
  }
}

export type RegisterVenueInput = {
  slug: string;
  name: string;
  address: string;
  city: string;
  countryCode?: string;
  capacity?: number;
  description?: string;
  imageUrl?: string;
  coverUrl?: string;
  pageUrl?: string;
};

export async function registerVenue(
  input: RegisterVenueInput,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  if (forceMock()) {
    if (!getMockSessionUser()) {
      return { ok: false, error: 'Log in first to register a venue.' };
    }
    if (input.slug.length < 2) {
      return { ok: false, error: 'Slug too short' };
    }
    if (input.slug === 'taken') {
      return { ok: false, error: 'Slug already taken' };
    }
    return { ok: true, slug: input.slug };
  }
  try {
    const { data } = await requestJson<{ slug: string }>('/api/v1/venues', {
      method: 'POST',
      body: JSON.stringify({
        slug: input.slug,
        name: input.name,
        address: input.address,
        city: input.city,
        countryCode: input.countryCode || 'FI',
        ...(input.capacity != null && Number.isFinite(input.capacity)
          ? { capacity: input.capacity }
          : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.imageUrl || input.coverUrl
          ? { photos: [input.imageUrl ?? '', input.coverUrl ?? ''] }
          : {}),
        ...(input.pageUrl ? { externalLinks: { website: input.pageUrl } } : {}),
      }),
    });
    return { ok: true, slug: data.slug ?? input.slug };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Registration failed',
    };
  }
}

export async function fetchChatAccess(slug: string): Promise<{
  data: ChatAccess;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockChatAccess(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<ChatAccess>(
      `/api/chat/${encodeURIComponent(slug)}/access`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(err, mockChatAccess, () => ({
      fanChatEnabled: false,
      isSupporter: false,
      canJoinFanChat: false,
      subscribersOnly: false,
      canPostInChat: false,
    }));
  }
}

export async function fetchChatHistory(slug: string): Promise<{
  data: ChatMessage[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockChatHistory(slug),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const raw = await getJson<{ messages: Array<Omit<ChatMessage, 'id'>> }>(
      `/api/chat/${encodeURIComponent(slug)}/history`,
    );
    const data = (raw.messages ?? []).map((m, i) => ({
      ...m,
      id: `history-${m.ts}-${i}`,
    }));
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      () => mockChatHistory(slug),
      () => [],
    );
  }
}

export async function requestChatToken(
  slug: string,
  handle: string,
  hcaptchaToken?: string,
): Promise<{ data: ChatTokenResponse; meta: FetchMeta }> {
  if (forceMock()) {
    return {
      data: {
        token: 'mock-token',
        handle,
        supporter: false,
        channelRole: null,
        countryCode: null,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ChatTokenResponse>(
      `/api/chat/${encodeURIComponent(slug)}/token`,
      {
        method: 'POST',
        body: JSON.stringify({ handle, hcaptchaToken }),
      },
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    throw err instanceof Error ? err : new Error('Could not join chat');
  }
}

export async function requestChatViewerToken(
  slug: string,
): Promise<string | null> {
  if (forceMock()) {
    return null;
  }
  try {
    const { data } = await requestJson<{ token: string }>(
      `/api/chat/${encodeURIComponent(slug)}/viewer-token`,
      { method: 'POST' },
    );
    return data.token;
  } catch {
    return null;
  }
}

export async function fetchAuthMe(): Promise<{
  data: AuthUser | null;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: getMockSessionUser(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AuthUser>('/api/auth/me');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('401') || message.includes('Unauthorized')) {
      return { data: null, meta: { source: 'api' } };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<
  | { ok: true; user: AuthUser; requiresTotp?: false }
  | { ok: true; requiresTotp: true; challengeId: string }
  | { ok: false; error: string; mock?: boolean }
> {
  if (forceMock()) {
    // Demo 2FA: email contains "+totp" or password is "totp-demo"
    if (email.includes('+totp') || password === 'totp-demo') {
      return {
        ok: true,
        requiresTotp: true,
        challengeId: 'mock-totp-challenge',
      };
    }
    const user = buildMockLoginUser(email);
    setMockSessionUser(user);
    return { ok: true, user };
  }
  try {
    const { data } = await requestJson<{
      user?: AuthUser;
      requiresTotp?: boolean;
      challengeId?: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.requiresTotp && data.challengeId) {
      return { ok: true, requiresTotp: true, challengeId: data.challengeId };
    }
    if (!data.user) {
      return { ok: false, error: 'Login failed' };
    }
    return { ok: true, user: data.user };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Login failed',
    };
  }
}

export async function loginTotpRequest(
  challengeId: string,
  code: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  if (forceMock()) {
    if (
      challengeId === 'mock-totp-challenge' &&
      (code === '000000' || code === '123456')
    ) {
      const user = buildMockLoginUser('demo+totp@tahti.live', {
        username: 'demo-totp',
        id: 'mock-totp-user',
        displayName: 'Demo TOTP',
        channel: {
          slug: 'demo-totp',
          state: 'OFFLINE',
          goneLiveAt: null,
          customDomain: null,
          customDomainVerified: false,
        },
      });
      setMockSessionUser(user);
      return { ok: true, user };
    }
    return { ok: false, error: 'Invalid code.' };
  }
  try {
    const { data } = await requestJson<{ user: AuthUser }>(
      '/api/auth/login/totp',
      {
        method: 'POST',
        body: JSON.stringify({ challengeId, code }),
      },
    );
    if (!data.user) {
      return { ok: false, error: 'Login failed' };
    }
    return { ok: true, user: data.user };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid code',
    };
  }
}

export async function registerRequest(input: {
  email: string;
  password: string;
  username: string;
  displayName: string;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  if (forceMock()) {
    return {
      ok: true,
      message:
        'Mock registration OK — verify is skipped offline. You can log in with any password.',
    };
  }
  try {
    const { data } = await requestJson<{ message: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
    return { ok: true, message: data.message };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Registration failed',
    };
  }
}

export async function verifyEmailRequest(
  token: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true, message: 'Mock verify OK' };
  }
  try {
    const { data } = await requestJson<{ message: string }>(
      `/api/auth/verify?token=${encodeURIComponent(token)}`,
    );
    return { ok: true, message: data.message };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Verification failed',
    };
  }
}

/** GET /api/auth/setup-password?token= — one-time invite link that lets a
 * passwordless account (board-invited, imported) set an initial password. */
export async function fetchSetupPasswordInfo(
  token: string,
): Promise<
  | { ok: true; email: string; username: string; displayName: string }
  | { ok: false; error: string }
> {
  if (forceMock()) {
    return {
      ok: true,
      email: 'newartist@tahti.live',
      username: 'newartist',
      displayName: 'New Artist',
    };
  }
  try {
    const { data } = await requestJson<{
      email: string;
      username: string;
      displayName: string;
    }>(`/api/auth/setup-password?token=${encodeURIComponent(token)}`);
    return { ok: true, ...data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid or expired link',
    };
  }
}

export async function submitSetupPassword(
  token: string,
  password: string,
  email?: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  if (forceMock()) {
    const user = buildMockLoginUser(email || 'newartist@tahti.live');
    setMockSessionUser(user);
    return { ok: true, user };
  }
  try {
    await requestJson<{ ok: true; user: Partial<AuthUser> }>(
      '/api/auth/setup-password',
      { method: 'POST', body: JSON.stringify({ token, password }) },
    );
    // POST sets the session cookie but returns a partial user shape —
    // fetch the full session user the same way login/register do.
    const me = await fetchAuthMe();
    if (!me.data) {
      return { ok: false, error: 'Password set, but session did not start' };
    }
    return { ok: true, user: me.data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not set password',
    };
  }
}

/** POST /api/auth/forgot-password — always returns a generic message, even
 * for unknown emails, so the endpoint can't be used to enumerate accounts. */
export async function submitForgotPassword(email: string): Promise<string> {
  const fallback =
    'If an account exists for that email, we sent a link to reset your password.';
  if (forceMock()) {
    return fallback;
  }
  try {
    const { data } = await requestJson<{ message?: string }>(
      '/api/auth/forgot-password',
      { method: 'POST', body: JSON.stringify({ email }) },
    );
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

/** GET /api/auth/reset-password?token= — resolves the account behind a
 * password-reset link before the user commits to a new password. */
export async function fetchResetPasswordInfo(
  token: string,
): Promise<
  | { ok: true; email: string; username: string; displayName: string }
  | { ok: false; error: string }
> {
  if (forceMock()) {
    return {
      ok: true,
      email: 'newartist@tahti.live',
      username: 'newartist',
      displayName: 'New Artist',
    };
  }
  try {
    const { data } = await requestJson<{
      email: string;
      username: string;
      displayName: string;
    }>(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
    return { ok: true, ...data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid or expired link',
    };
  }
}

export async function submitResetPassword(
  token: string,
  password: string,
  email?: string,
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  if (forceMock()) {
    const user = buildMockLoginUser(email || 'newartist@tahti.live');
    setMockSessionUser(user);
    return { ok: true, user };
  }
  try {
    await requestJson<{ ok: true; user: Partial<AuthUser> }>(
      '/api/auth/reset-password',
      { method: 'POST', body: JSON.stringify({ token, password }) },
    );
    const me = await fetchAuthMe();
    if (!me.data) {
      return { ok: false, error: 'Password reset, but session did not start' };
    }
    return { ok: true, user: me.data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not reset password',
    };
  }
}

export async function logoutRequest(): Promise<void> {
  if (forceMock()) {
    clearMockSessionUser();
    return;
  }
  try {
    await requestJson('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
}

export async function fetchFanTiers(username: string): Promise<{
  data: FanTiersResponse;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockFanTiers(username),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<FanTiersResponse>(
      `/api/v1/u/${encodeURIComponent(username)}/tiers`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      () => mockFanTiers(username),
      () => ({
        artist: {
          id: '',
          displayName: username,
          username,
          bio: null,
          avatarUrl: null,
        },
        tiers: [],
        paymentsReady: false,
      }),
    );
  }
}

export async function startFanSubscribe(
  username: string,
  tierId: string,
): Promise<
  | { ok: true; checkoutUrl: string }
  | { ok: true; activated: true; message: string }
  | { ok: false; error: string }
> {
  if (forceMock()) {
    if (!getMockSessionUser()) {
      return { ok: false, error: 'Log in first to activate a fan sub.' };
    }
    const row = mockActivateSubscription(username, tierId);
    return {
      ok: true,
      activated: true,
      message: `Mock subscribed to ${row.tierName} — ${row.artist.displayName}`,
    };
  }
  try {
    const { data, status } = await requestJson<{
      checkoutUrl?: string | null;
      sessionId?: string;
      activated?: boolean;
      tierName?: string;
    }>(`/api/v1/u/${encodeURIComponent(username)}/subscribe`, {
      method: 'POST',
      body: JSON.stringify({ tierId }),
    });
    if (status === 201 || data.activated) {
      return {
        ok: true,
        activated: true,
        message: `Subscribed to ${data.tierName ?? 'tier'} (dev activate)`,
      };
    }
    if (data.checkoutUrl) {
      return { ok: true, checkoutUrl: data.checkoutUrl };
    }
    return { ok: false, error: 'Unexpected subscribe response' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Subscribe failed',
    };
  }
}

export async function fetchTransparencyYtd(): Promise<{
  data: TransparencyYtd;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockTransparencyYtd(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<TransparencyYtd>('/api/v1/transparency/ytd');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockTransparencyYtd(), meta: failMeta(err) };
    }
    throw err instanceof Error ? err : new Error('Transparency YTD failed');
  }
}

export async function fetchTransparencyGrants(year?: number): Promise<{
  data: TransparencyGrantReport;
  meta: FetchMeta;
}> {
  const y = year ?? new Date().getFullYear();
  if (forceMock()) {
    return {
      data: mockTransparencyGrants(y),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<TransparencyGrantReport>(
      `/api/v1/transparency/grants/${y}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockTransparencyGrants(y), meta: failMeta(err) };
    }
    throw err instanceof Error ? err : new Error('Transparency grants failed');
  }
}

export async function fetchTransparencyLedger(): Promise<{
  data: TransparencyLedgerEntry[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockTransparencyLedger(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<TransparencyLedgerEntry[]>(
      '/api/v1/transparency/ledger/latest',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(err, mockTransparencyLedger, () => []);
  }
}

/** Artists the user follows — closest server analogue to “favorite channels”. */
export async function fetchFollowing(username: string): Promise<{
  data: FollowListUser[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    void username;
    return {
      data: listMockFollowing(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ users: FollowListUser[] }>(
      `/api/v1/artists/${encodeURIComponent(username)}/following`,
    );
    return { data: data.users ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function followArtist(
  username: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    mockFollow(username);
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/v1/artists/${encodeURIComponent(username)}/follow`,
      {
        method: 'POST',
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Follow failed',
    };
  }
}

export async function unfollowArtist(
  username: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    mockUnfollow(username);
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/v1/artists/${encodeURIComponent(username)}/follow`,
      {
        method: 'DELETE',
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unfollow failed',
    };
  }
}

export async function fetchEmbedChannel(slug: string): Promise<{
  data: ChannelEmbedView;
  meta: FetchMeta;
  playable: TahtiPlayable | null;
}> {
  if (forceMock()) {
    const ch = mockChannel(slug);
    const data: ChannelEmbedView = {
      slug: ch.slug,
      state: ch.state,
      artist: {
        username: ch.user.username,
        displayName: ch.user.displayName,
        avatarUrl: ch.user.avatarUrl,
      },
      hlsUrl: ch.hlsUrl,
    };
    return {
      data,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      playable: channelToPlayable(ch),
    };
  }
  try {
    const data = await getJson<ChannelEmbedView>(
      `/api/v1/embed/c/${encodeURIComponent(slug)}`,
    );
    const playable: TahtiPlayable | null = data.hlsUrl
      ? {
          id: `live:${data.slug}`,
          kind: 'live',
          title: data.artist.displayName,
          artist: data.artist.displayName,
          coverUrl: data.artist.avatarUrl ?? undefined,
          streamUrl: data.hlsUrl,
          protocol: 'hls',
          channelSlug: data.slug,
        }
      : null;
    return { data, meta: { source: 'api' }, playable };
  } catch (err) {
    if (!allowMockFallback()) {
      throw err instanceof Error ? err : new Error('Embed channel failed');
    }
    const ch = mockChannel(slug);
    return {
      data: {
        slug: ch.slug,
        state: ch.state,
        artist: {
          username: ch.user.username,
          displayName: ch.user.displayName,
          avatarUrl: ch.user.avatarUrl,
        },
        hlsUrl: ch.hlsUrl,
      },
      meta: failMeta(err),
      playable: channelToPlayable(ch),
    };
  }
}

export async function fetchEmbedRelease(id: string): Promise<{
  data: ReleaseEmbedView;
  meta: FetchMeta;
  playables: TahtiPlayable[];
}> {
  if (forceMock()) {
    const data: ReleaseEmbedView = {
      id,
      title: 'Mock release',
      artworkUrl: null,
      smartLinkSlug: id,
      artist: { username: 'northern-lights', displayName: 'Northern Lights' },
      tracks: [
        {
          id: `${id}-t1`,
          position: 1,
          title: 'Track one',
          hasStream: true,
        },
        {
          id: `${id}-t2`,
          position: 2,
          title: 'Track two',
          hasStream: true,
        },
      ],
    };
    const playables = data.tracks.map(
      (t): TahtiPlayable => ({
        id: `archive:${t.id}`,
        kind: 'archive',
        title: t.title,
        artist: data.artist.displayName,
        streamUrl: DEMO_MP3,
        protocol: 'https',
      }),
    );
    return {
      data,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      playables,
    };
  }
  try {
    const data = await getJson<ReleaseEmbedView>(
      `/api/v1/embed/r/${encodeURIComponent(id)}`,
    );
    const playables: TahtiPlayable[] = [];
    for (const t of data.tracks) {
      if (!t.hasStream) {
        continue;
      }
      try {
        const play = await getJson<{ url: string }>(
          `/api/v1/embed/r/${encodeURIComponent(id)}/tracks/${encodeURIComponent(t.id)}/play`,
        );
        if (play.url) {
          playables.push({
            id: `archive:${t.id}`,
            kind: 'archive',
            title: t.title,
            artist: data.artist.displayName,
            coverUrl: data.artworkUrl ?? undefined,
            streamUrl: play.url,
            protocol: play.url.includes('.m3u8') ? 'hls' : 'https',
          });
        }
      } catch {
        // skip unplayable track
      }
    }
    return { data, meta: { source: 'api' }, playables };
  } catch (err) {
    if (!allowMockFallback()) {
      throw err instanceof Error ? err : new Error('Embed release failed');
    }
    const data: ReleaseEmbedView = {
      id,
      title: 'Mock release',
      artworkUrl: null,
      artist: { username: 'northern-lights', displayName: 'Northern Lights' },
      tracks: [
        {
          id: `${id}-t1`,
          position: 1,
          title: 'Track one',
          hasStream: true,
        },
      ],
    };
    return {
      data,
      meta: failMeta(err),
      playables: [
        {
          id: `archive:${id}-t1`,
          kind: 'archive',
          title: 'Track one',
          artist: data.artist.displayName,
          streamUrl: DEMO_MP3,
          protocol: 'https',
        },
      ],
    };
  }
}

export async function fetchEmbedCollection(slug: string): Promise<{
  data: CollectionEmbedView;
  meta: FetchMeta;
  playables: TahtiPlayable[];
}> {
  if (forceMock()) {
    const col = mockCollection(slug);
    const data: CollectionEmbedView = {
      slug: col.slug,
      name: col.name,
      coverUrl: col.coverUrl,
      artist: col.user,
      tracks: col.items
        .filter((i) => i.sound)
        .map((i) => ({
          id: i.sound!.id,
          title: i.sound!.title,
          durationSec: i.sound!.durationSec,
          hasStream: Boolean(i.sound!.audioUrl),
        })),
    };
    const playables = col.items
      .filter((i) => i.sound?.audioUrl)
      .map(
        (i): TahtiPlayable => ({
          id: `archive:${i.sound!.id}`,
          kind: 'archive',
          title: i.sound!.title,
          artist: col.user.displayName,
          coverUrl: col.coverUrl ?? undefined,
          streamUrl: i.sound!.audioUrl!,
          protocol: i.sound!.audioUrl!.includes('.m3u8') ? 'hls' : 'https',
        }),
      );
    return {
      data,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      playables,
    };
  }
  try {
    const data = await getJson<CollectionEmbedView>(
      `/api/v1/embed/col/${encodeURIComponent(slug)}`,
    );
    const playables: TahtiPlayable[] = [];
    for (const t of data.tracks) {
      if (!t.hasStream) {
        continue;
      }
      try {
        const play = await getJson<{ url: string }>(
          `/api/v1/embed/col/${encodeURIComponent(slug)}/tracks/${encodeURIComponent(t.id)}/play`,
        );
        if (play.url) {
          playables.push({
            id: `archive:${t.id}`,
            kind: 'archive',
            title: t.title,
            artist: data.artist.displayName,
            coverUrl: data.coverUrl ?? undefined,
            streamUrl: play.url,
            protocol: play.url.includes('.m3u8') ? 'hls' : 'https',
          });
        }
      } catch {
        // skip
      }
    }
    return { data, meta: { source: 'api' }, playables };
  } catch (err) {
    if (!allowMockFallback()) {
      throw err instanceof Error ? err : new Error('Embed collection failed');
    }
    const col = mockCollection(slug);
    return {
      data: {
        slug: col.slug,
        name: col.name,
        coverUrl: col.coverUrl,
        artist: col.user,
        tracks: col.items
          .filter((i) => i.sound)
          .map((i) => ({
            id: i.sound!.id,
            title: i.sound!.title,
            hasStream: true,
          })),
      },
      meta: failMeta(err),
      playables: col.items
        .filter((i) => i.sound?.audioUrl)
        .map(
          (i): TahtiPlayable => ({
            id: `archive:${i.sound!.id}`,
            kind: 'archive',
            title: i.sound!.title,
            artist: col.user.displayName,
            streamUrl: i.sound!.audioUrl!,
            protocol: 'https',
          }),
        ),
    };
  }
}

export async function postListenEvent(
  soundId: string,
): Promise<{ recorded: boolean; meta: FetchMeta }> {
  if (forceMock()) {
    return {
      recorded: true,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ recorded: boolean }>(
      '/api/listen-events',
      {
        method: 'POST',
        body: JSON.stringify({ soundId }),
      },
    );
    return { recorded: Boolean(data.recorded), meta: { source: 'api' } };
  } catch (err) {
    return { recorded: false, meta: apiErrorMeta(err) };
  }
}

export async function fetchPlatformStatus(): Promise<{
  data: PlatformStatus;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: {
        status: 'ok',
        version: 'mock',
        uptimeSec: 3600,
        checks: {
          postgres: { state: 'ok', critical: true, latencyMs: 2 },
          redis: { state: 'ok', critical: true, latencyMs: 1 },
          minio: { state: 'ok', critical: false, latencyMs: 5 },
        },
        ts: new Date().toISOString(),
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<PlatformStatus>('/api/v1/status');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    // 503 still returns a body — try to parse via raw fetch if getJson threw
    try {
      const res = await fetch(`${apiBase()}/api/v1/status`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const data = (await res.json()) as PlatformStatus;
      return {
        data,
        meta: {
          source: 'api',
          reason: res.ok ? undefined : `HTTP ${res.status}`,
        },
      };
    } catch {
      return {
        data: {
          status: 'down',
          checks: {},
          ts: new Date().toISOString(),
        },
        meta: apiErrorMeta(err),
      };
    }
  }
}

export async function fetchMembership(): Promise<{
  data: MembershipStatus | null;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: {
        status: 'ACTIVE',
        isMember: true,
        memberNumber: 42,
        memberSince: '2025-01-01T00:00:00.000Z',
        tier: 'ARTIST',
        priceCents: 4000,
        emailVerified: true,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<MembershipStatus>('/api/me/membership');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: apiErrorMeta(err) };
  }
}

/** GET /api/me/feed — listener home: recent activity from followed artists. */
export async function fetchFeed(): Promise<{
  data: FeedResponse;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockFeed(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<FeedResponse>('/api/me/feed');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { items: [], followingCount: 0 },
      meta: apiErrorMeta(err),
    };
  }
}

export async function startMembershipCheckout(opts?: {
  successPath?: string;
  cancelPath?: string;
}): Promise<
  | { ok: true; checkoutUrl: string }
  | { ok: true; activated: true; memberNumber?: number }
  | { ok: false; error: string }
> {
  if (forceMock()) {
    return {
      ok: true,
      activated: true,
      memberNumber: 99,
    };
  }
  try {
    const { data } = await requestJson<{
      checkoutUrl?: string | null;
      activated?: boolean;
      memberNumber?: number;
      error?: string;
    }>('/api/me/membership/checkout', {
      method: 'POST',
      body: JSON.stringify({
        successPath:
          opts?.successPath ?? '/settings/account?membership=success',
        cancelPath: opts?.cancelPath ?? '/signup/payment?membership=canceled',
      }),
    });
    if (data.checkoutUrl) {
      return { ok: true, checkoutUrl: data.checkoutUrl };
    }
    if (data.activated) {
      return {
        ok: true,
        activated: true,
        memberNumber: data.memberNumber,
      };
    }
    return { ok: false, error: data.error ?? 'Checkout did not return a URL' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Checkout failed',
    };
  }
}

/** POST /api/me/membership/portal — Stripe Customer Portal (receipts, payment method, cancel). */
export async function startMembershipPortal(): Promise<
  { ok: true; portalUrl: string } | { ok: false; error: string }
> {
  if (forceMock()) {
    return { ok: true, portalUrl: 'https://billing.stripe.com/mock-session' };
  }
  try {
    const { data } = await requestJson<{ portalUrl?: string; error?: string }>(
      '/api/me/membership/portal',
      { method: 'POST' },
    );
    if (data.portalUrl) {
      return { ok: true, portalUrl: data.portalUrl };
    }
    return {
      ok: false,
      error: data.error ?? 'Billing portal did not return a URL',
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not open billing portal',
    };
  }
}

/** POST /api/auth/resend-verification — re-sends the email confirmation link.
 * Requires an hCaptcha token when the API has hCaptcha enforced (production);
 * tahti-web has no hCaptcha widget yet, so this surfaces that as a normal
 * error rather than pretending to succeed. */
export async function resendVerificationEmail(
  email: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true, message: 'Mock verification email sent.' };
  }
  try {
    const { data } = await requestJson<{ message?: string; error?: string }>(
      '/api/auth/resend-verification',
      { method: 'POST', body: JSON.stringify({ email }) },
    );
    return { ok: true, message: data.message ?? 'Verification email sent.' };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Could not resend verification email',
    };
  }
}

export async function requestAccountDeletion(
  reason: string,
): Promise<{ ok: true; ticketId: string } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true, ticketId: 'mock-deletion-001' };
  }
  try {
    const { data } = await requestJson<{ ticketId: string }>(
      '/api/me/account/deletion-request',
      { method: 'POST', body: JSON.stringify({ reason }) },
    );
    return { ok: true, ticketId: data.ticketId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Deletion request failed',
    };
  }
}

export async function fetchMySubscriptions(): Promise<{
  data: FanSubscriptionRow[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: listMockSubscriptions(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<FanSubscriptionRow[]>('/api/me/subscriptions');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export type MotionComment = {
  id: string;
  body: string;
  authorId?: string;
  authorDisplayName?: string | null;
  createdAt: string;
};

let mockMotions: GovernanceMotion[] = [
  {
    id: 'motion-1',
    title: 'Approve 2026 grant formula',
    state: 'OPEN',
    proposer: 'Board',
    totalVotes: 3,
    youVoted: false,
    commentCount: 2,
    tally: { YES: 1, NO: 1, ABSTAIN: 1 },
  },
  {
    id: 'motion-3',
    title: 'Keep overnight radio hours uncapped',
    state: 'OPEN',
    proposer: 'Demo Member',
    totalVotes: 4,
    youVoted: false,
    commentCount: 1,
    tally: { YES: 1, NO: 2, ABSTAIN: 1 },
  },
  {
    id: 'motion-2',
    title: 'Confirm annual report',
    state: 'CLOSED',
    proposer: 'Board',
    totalVotes: 12,
    youVoted: true,
    yourChoice: 'YES',
    tally: { YES: 10, NO: 1, ABSTAIN: 1 },
    commentCount: 0,
  },
  {
    id: 'motion-4',
    title: 'Require overnight radio blackout',
    state: 'CLOSED',
    proposer: 'Board',
    totalVotes: 13,
    youVoted: true,
    yourChoice: 'YES',
    tally: { YES: 3, NO: 9, ABSTAIN: 1 },
    commentCount: 2,
  },
];

const mockMotionComments: Record<string, MotionComment[]> = {
  'motion-1': [
    {
      id: 'c1',
      body: 'Mock comment — looks good.',
      authorDisplayName: 'Demo Member',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'c1-against',
      body: 'This formula underweights overnight shows and should be voted down.',
      authorDisplayName: 'Northern Lights',
      createdAt: new Date().toISOString(),
    },
  ],
  'motion-2': [],
  'motion-3': [
    {
      id: 'c3',
      body: 'Uncapped overnight hours keep small stations off the grid.',
      authorDisplayName: 'Kaiku Collective',
      createdAt: new Date().toISOString(),
    },
  ],
  'motion-4': [
    {
      id: 'c4-for',
      body: 'A blackout would protect overnight presenters.',
      authorDisplayName: 'Demo Member',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'c4-against',
      body: 'Members rejected this — keep the overnight window open.',
      authorDisplayName: 'Board',
      createdAt: new Date().toISOString(),
    },
  ],
};

export async function fetchGovernanceMotions(): Promise<{
  data: GovernanceMotion[];
  meta: FetchMeta;
  forbidden?: boolean;
}> {
  if (forceMock()) {
    return {
      data: mockMotions.map((m) => ({ ...m })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<GovernanceMotion[]>(
      '/api/v1/governance/motions',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const forbidden =
      message.includes('401') ||
      message.includes('403') ||
      /member/i.test(message);
    return { data: [], meta: apiErrorMeta(err), forbidden };
  }
}

export async function createGovernanceMotion(input: {
  title: string;
  description: string;
  openAt: string;
  closeAt: string;
  advisory?: boolean;
}): Promise<
  { ok: true; data: GovernanceMotionDraft } | { ok: false; error: string }
> {
  if (forceMock()) {
    const row: GovernanceMotionDraft = {
      id: `motion-${Date.now()}`,
      state: 'DRAFT',
    };
    mockMotions = [
      {
        id: row.id,
        title: input.title,
        state: row.state,
        advisory: true,
        openAt: input.openAt,
        closeAt: input.closeAt,
        proposer: 'You',
        totalVotes: 0,
        youVoted: false,
        commentCount: 0,
      },
      ...mockMotions,
    ];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<GovernanceMotionDraft>(
      '/api/v1/governance/motions',
      { method: 'POST', body: JSON.stringify(input) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not submit motion',
    };
  }
}

export async function fetchPublicGovernanceMotions(year?: number): Promise<{
  data: PublicGovernanceMotion[];
  meta: FetchMeta;
}> {
  const query = year ? `?year=${encodeURIComponent(year)}` : '';
  if (forceMock()) {
    return {
      data: [
        {
          id: 'motion-2',
          title: 'Confirm annual report',
          description:
            'Public mock decision history. Members favored YES — the report stands.',
          closedAt: '2026-02-15T00:00:00.000Z',
          proposer: 'Board',
          voteFor: 10,
          voteAgainst: 1,
          voteAbstain: 1,
        },
        {
          id: 'motion-4',
          title: 'Require overnight radio blackout',
          description:
            'Public mock decision history. Members favored NO — the blackout did not pass.',
          closedAt: '2026-03-01T00:00:00.000Z',
          proposer: 'Board',
          voteFor: 3,
          voteAgainst: 9,
          voteAbstain: 1,
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<PublicGovernanceMotion[]>(
      `/api/v1/transparency/motions${query}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchGovernanceMeetings(): Promise<{
  data: GovernanceMeeting[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockGovernanceMeetings(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<GovernanceMeeting[]>(
      '/api/v1/governance/meetings',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchGovernanceDocuments(): Promise<{
  data: GovernanceDocument[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockGovernanceDocuments(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<GovernanceDocument[]>(
      '/api/v1/governance/documents',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchGovernanceMembers(): Promise<{
  data: GovernanceMember[];
  meta: FetchMeta;
  forbidden?: boolean;
}> {
  if (forceMock()) {
    return {
      data: mockGovernanceMembers(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<GovernanceMember[]>(
      '/api/v1/governance/members',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const forbidden =
      message.includes('401') ||
      message.includes('403') ||
      /member/i.test(message);
    return { data: [], meta: apiErrorMeta(err), forbidden };
  }
}

export async function fetchGovernanceQuarterlyReports(): Promise<{
  data: GovernanceQuarterlyReport[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockGovernanceQuarterlyReports(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<GovernanceQuarterlyReport[]>(
      '/api/v1/governance/quarterly-reports',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function voteOnMotion(
  id: string,
  choice: 'YES' | 'NO' | 'ABSTAIN',
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    mockMotions = mockMotions.map((m) => {
      if (m.id !== id || m.youVoted) {
        return m;
      }
      const tally = { ...(m.tally ?? { YES: 0, NO: 0, ABSTAIN: 0 }) };
      tally[choice] = (tally[choice] ?? 0) + 1;
      return {
        ...m,
        youVoted: true,
        yourChoice: choice,
        totalVotes: (m.totalVotes ?? 0) + 1,
        tally,
      };
    });
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/v1/governance/motions/${encodeURIComponent(id)}/vote`,
      {
        method: 'POST',
        body: JSON.stringify({ choice }),
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Vote failed',
    };
  }
}

export async function fetchMotionComments(id: string): Promise<{
  data: MotionComment[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [...(mockMotionComments[id] ?? [])],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<MotionComment[]>(
      `/api/v1/governance/motions/${encodeURIComponent(id)}/comments`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function postMotionComment(
  id: string,
  body: string,
): Promise<{ ok: true; data: MotionComment } | { ok: false; error: string }> {
  if (forceMock()) {
    const row: MotionComment = {
      id: `c-${Date.now()}`,
      body,
      authorDisplayName: 'You',
      createdAt: new Date().toISOString(),
    };
    mockMotionComments[id] = [...(mockMotionComments[id] ?? []), row];
    mockMotions = mockMotions.map((m) =>
      m.id === id ? { ...m, commentCount: (m.commentCount ?? 0) + 1 } : m,
    );
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<MotionComment>(
      `/api/v1/governance/motions/${encodeURIComponent(id)}/comments`,
      { method: 'POST', body: JSON.stringify({ body }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Comment failed',
    };
  }
}

export type SupportTicketCategory =
  | 'ENGAGEMENT_DISPUTE'
  | 'TECHNICAL'
  | 'FINANCIAL'
  | 'OTHER';

export type SupportTicketInput = {
  subject: string;
  message: string;
  category: SupportTicketCategory;
  /** Required when not signed in. */
  contactEmail?: string;
};

export async function submitSupportTicket(
  input: SupportTicketInput,
): Promise<{ ok: true; ticketId: string } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true, ticketId: `mock-ticket-${Date.now()}` };
  }
  try {
    const { data } = await requestJson<{ ok: true; ticketId: string }>(
      '/api/support/contact',
      { method: 'POST', body: JSON.stringify(input) },
    );
    return data;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not send your message',
    };
  }
}

let mockFeatureRequests: FeatureRequest[] = [
  {
    id: 'fr-1',
    title: 'Crossfade between archive tracks',
    description:
      'Would love a short crossfade option on the archive player, same as the 24/7 rotation already has.',
    status: 'PLANNED',
    proposer: 'Demo Member',
    voteCount: 6,
    youVoted: false,
    commentCount: 1,
    reviewNote: null,
    reviewedAt: null,
    mergedIntoId: null,
    mergedIntoTitle: null,
    createdAt: new Date(Date.now() - 86_400_000 * 5).toISOString(),
  },
  {
    id: 'fr-2',
    title: 'Bulk-tag tracks in the archive',
    description:
      'Selecting multiple archive items and applying a genre or visibility change at once would save a lot of clicking.',
    status: 'OPEN',
    proposer: 'Northern Lights',
    voteCount: 2,
    youVoted: false,
    commentCount: 1,
    reviewNote: null,
    reviewedAt: null,
    mergedIntoId: null,
    mergedIntoTitle: null,
    createdAt: new Date(Date.now() - 86_400_000 * 1).toISOString(),
  },
  {
    id: 'fr-3',
    title: 'Show listening history on Listen',
    description:
      'Members asked for a History tab. The board closed this after it shipped.',
    status: 'DONE',
    proposer: 'Kaiku Collective',
    voteCount: 12,
    youVoted: true,
    commentCount: 2,
    reviewNote: 'Resolved: Listen now has a History tab.',
    reviewedAt: new Date(Date.now() - 86_400_000 * 20).toISOString(),
    mergedIntoId: null,
    mergedIntoTitle: null,
    createdAt: new Date(Date.now() - 86_400_000 * 40).toISOString(),
  },
];

const mockFeatureRequestComments: Record<string, MotionComment[]> = {
  'fr-1': [
    {
      id: 'frc-1',
      body: 'Mock comment — agreed, this would help a lot during transitions.',
      authorDisplayName: 'Demo Member',
      createdAt: new Date().toISOString(),
    },
  ],
  'fr-2': [
    {
      id: 'frc-2-need',
      body: 'This is still unresolved — tagging one track at a time does not scale.',
      authorDisplayName: 'Northern Lights',
      createdAt: new Date().toISOString(),
    },
  ],
  'fr-3': [
    {
      id: 'frc-3-ask',
      body: 'We needed a place to find what we already played.',
      authorDisplayName: 'Kaiku Collective',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'frc-3-done',
      body: 'Resolved — History is on the Listen tab row.',
      authorDisplayName: 'Board',
      createdAt: new Date().toISOString(),
    },
  ],
};

export async function fetchFeatureRequests(): Promise<{
  data: FeatureRequest[];
  meta: FetchMeta;
  forbidden?: boolean;
}> {
  if (forceMock()) {
    return {
      data: mockFeatureRequests.map((r) => ({ ...r })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<FeatureRequest[]>(
      '/api/v1/governance/feature-requests',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    const forbidden =
      message.includes('401') ||
      message.includes('403') ||
      /member/i.test(message);
    return { data: [], meta: apiErrorMeta(err), forbidden };
  }
}

export async function createFeatureRequest(input: {
  title: string;
  description: string;
}): Promise<{ ok: true; data: FeatureRequest } | { ok: false; error: string }> {
  if (forceMock()) {
    const row: FeatureRequest = {
      id: `fr-${Date.now()}`,
      title: input.title,
      description: input.description,
      status: 'OPEN',
      proposer: 'You',
      voteCount: 0,
      youVoted: false,
      commentCount: 0,
      reviewNote: null,
      reviewedAt: null,
      mergedIntoId: null,
      mergedIntoTitle: null,
      createdAt: new Date().toISOString(),
    };
    mockFeatureRequests = [row, ...mockFeatureRequests];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<FeatureRequest>(
      '/api/v1/governance/feature-requests',
      { method: 'POST', body: JSON.stringify(input) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not submit your idea',
    };
  }
}

export async function voteFeatureRequest(
  id: string,
  vote: boolean,
): Promise<{ ok: true; voteCount: number } | { ok: false; error: string }> {
  if (forceMock()) {
    let voteCount = 0;
    mockFeatureRequests = mockFeatureRequests.map((r) => {
      if (r.id !== id) {
        return r;
      }
      voteCount = Math.max(0, r.voteCount + (vote ? 1 : -1));
      return { ...r, youVoted: vote, voteCount };
    });
    return { ok: true, voteCount };
  }
  try {
    const { data } = await requestJson<{ ok: true; voteCount: number }>(
      `/api/v1/governance/feature-requests/${encodeURIComponent(id)}/vote`,
      { method: vote ? 'POST' : 'DELETE' },
    );
    return data;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Vote failed',
    };
  }
}

export async function fetchFeatureRequestComments(id: string): Promise<{
  data: MotionComment[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [...(mockFeatureRequestComments[id] ?? [])],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<MotionComment[]>(
      `/api/v1/governance/feature-requests/${encodeURIComponent(id)}/comments`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function postFeatureRequestComment(
  id: string,
  body: string,
): Promise<{ ok: true; data: MotionComment } | { ok: false; error: string }> {
  if (forceMock()) {
    const row: MotionComment = {
      id: `frc-${Date.now()}`,
      body,
      authorDisplayName: 'You',
      createdAt: new Date().toISOString(),
    };
    mockFeatureRequestComments[id] = [
      ...(mockFeatureRequestComments[id] ?? []),
      row,
    ];
    mockFeatureRequests = mockFeatureRequests.map((r) =>
      r.id === id ? { ...r, commentCount: r.commentCount + 1 } : r,
    );
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<MotionComment>(
      `/api/v1/governance/feature-requests/${encodeURIComponent(id)}/comments`,
      { method: 'POST', body: JSON.stringify({ body }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Comment failed',
    };
  }
}

export async function fetchAnnouncements(): Promise<{
  data: Announcement[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const { listMockPublishedNews } = await import('./admin');
    return {
      data: listMockPublishedNews().map((post) => ({
        id: post.id,
        headline: post.headline,
        summary: post.summary,
        imageUrl: post.imageUrl ?? null,
        linkUrl: post.linkUrl ?? null,
        linkLabel: post.linkLabel ?? null,
        authorName: post.authorName,
        publishedAt: post.publishedAt!,
      })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<Announcement[]>('/api/v1/news');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(err, mockAnnouncements, () => []);
  }
}

// Signed-in listener's own newsletter subscription toggle per artist —
// notifications (+ optional email) for that artist's newsletters, events,
// and other activity. Anonymous visitors use a separate email-capture form
// (double opt-in) instead, since there's no account to toggle.
const mockNewsletterSubs = new Set<string>();

export async function fetchNewsletterSubscription(
  artistUsername: string,
): Promise<{ subscribed: boolean }> {
  if (forceMock()) {
    return { subscribed: mockNewsletterSubs.has(artistUsername) };
  }
  try {
    return await getJson<{ subscribed: boolean }>(
      `/api/me/newsletter/subscription/${encodeURIComponent(artistUsername)}`,
    );
  } catch {
    return { subscribed: false };
  }
}

export async function setNewsletterSubscription(
  artistUsername: string,
  subscribed: boolean,
): Promise<{ ok: true; subscribed: boolean } | { ok: false; error: string }> {
  if (forceMock()) {
    if (subscribed) {
      mockNewsletterSubs.add(artistUsername);
    } else {
      mockNewsletterSubs.delete(artistUsername);
    }
    return { ok: true, subscribed };
  }
  try {
    const { data } = await requestJson<{ subscribed: boolean }>(
      `/api/me/newsletter/subscription/${encodeURIComponent(artistUsername)}`,
      { method: subscribed ? 'POST' : 'DELETE' },
    );
    return { ok: true, subscribed: data.subscribed };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not update subscription',
    };
  }
}

/** Anonymous visitor path — double opt-in, no account needed. */
export async function subscribeNewsletterByEmail(
  email: string,
  artistUsername: string,
): Promise<
  { ok: true; alreadySubscribed: boolean } | { ok: false; error: string }
> {
  if (forceMock()) {
    return { ok: true, alreadySubscribed: false };
  }
  try {
    const { data } = await requestJson<{ status?: string }>(
      '/api/newsletter/subscribe',
      { method: 'POST', body: JSON.stringify({ email, artistUsername }) },
    );
    return {
      ok: true,
      alreadySubscribed: data.status === 'already_subscribed',
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Subscription failed',
    };
  }
}

export { archiveItemToPlayable };
