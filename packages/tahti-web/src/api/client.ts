import { listenerFingerprint } from '../lib/listenerFingerprint';
import { requestJson } from './client-request';
import type { MotionComment } from './governance-member';
import { apiBase } from './http';
import {
  channelToPlayable,
  DEMO_MP3,
  mockAnnouncements,
  mockChannel,
  mockChatAccess,
  mockChatHistory,
  mockCollection,
  mockFanTiers,
  mockProfile,
  mockSmartLink,
  mockSoundItems,
  mockTrackComments,
  mockTrackDetail,
  mockTransparencyGrants,
  mockTransparencyLedger,
  mockTransparencyResolutions,
  mockTransparencyYtd,
  mockVenueProfile,
  mockVenues,
  soundItemToPlayable,
  TAHTI_RADIO_SLUG,
} from './mock';
import {
  getMockSessionUser,
  listMockFollowing,
  mockActivateSubscription,
  mockFollow,
  mockUnfollow,
} from './mock-session';
import { ensureMockUploadedSound, getMockUploadedSound } from './mock-uploads';
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
  BoardResolution,
  ChannelSoundItem,
  ChatAccess,
  ChatMessage,
  ChatTokenResponse,
  FanTiersResponse,
  FeatureRequest,
  FollowListUser,
  PlatformStatus,
  PublicChannel,
  PublicCollection,
  PublicProfile,
  PublicTrackDetail,
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

/** Browser calls go through Vite proxy → Tahti API (avoids CORS). */
export { apiBase };
export { requestJson };

async function getJson<T>(path: string): Promise<T> {
  const { data } = await requestJson<T>(path);
  return data;
}

export * from './listen';

/** Live API returns `textLayer*` / `channelLinksJson`; designer/UI use
 * `textOverlay*` / `channelLinks`. Accept either shape so mock and live
 * paths share one PublicChannel. */
export function normalizePublicChannel(
  raw: PublicChannel & {
    textLayerMode?: string | null;
    textLayerText?: string | null;
    textLayerAlign?: string | null;
    channelLinksJson?: string | null;
  },
): PublicChannel {
  const textOverlayMode = raw.textOverlayMode ?? raw.textLayerMode ?? null;
  const textOverlayText = raw.textOverlayText ?? raw.textLayerText ?? null;
  const textOverlayAlign = raw.textOverlayAlign ?? raw.textLayerAlign ?? null;
  let channelLinks = raw.channelLinks ?? null;
  if (channelLinks == null && raw.channelLinksJson) {
    try {
      const parsed = JSON.parse(raw.channelLinksJson) as unknown;
      if (Array.isArray(parsed)) {
        channelLinks = parsed.filter(
          (entry): entry is { label: string; url: string } =>
            Boolean(
              entry &&
              typeof entry === 'object' &&
              typeof (entry as { label?: unknown }).label === 'string' &&
              typeof (entry as { url?: unknown }).url === 'string',
            ),
        );
      }
    } catch {
      channelLinks = null;
    }
  }
  return {
    ...raw,
    textOverlayMode,
    textOverlayText,
    textOverlayAlign,
    channelLinks,
  };
}

export async function fetchChannel(slug: string): Promise<{
  data: PublicChannel;
  meta: FetchMeta;
  playable: TahtiPlayable | null;
}> {
  if (isForceMock()) {
    const data = normalizePublicChannel(mockChannel(slug));
    return {
      data,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      playable: channelToPlayable(data),
    };
  }
  try {
    const data = await getJson<
      PublicChannel & {
        textLayerMode?: string | null;
        textLayerText?: string | null;
        textLayerAlign?: string | null;
        channelLinksJson?: string | null;
      }
    >(`/api/channels/${encodeURIComponent(slug)}`);
    const normalized = normalizePublicChannel(data);
    return {
      data: normalized,
      meta: { source: 'api' },
      playable: channelToPlayable(normalized),
    };
  } catch (err) {
    if (allowMockFallback()) {
      const data = normalizePublicChannel(mockChannel(slug));
      return { data, meta: failMeta(err), playable: channelToPlayable(data) };
    }
    throw err instanceof Error ? err : new Error('Channel fetch failed');
  }
}

export async function fetchChannelSound(slug: string): Promise<{
  data: ChannelSoundItem[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockSoundItems(slug),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<ChannelSoundItem[]>(
      `/api/channels/${encodeURIComponent(slug)}/items`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      () => mockSoundItems(slug),
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
    purchaseTierPriceOptional: tier?.priceOptional ?? false,
    downloadsEnabled: uploaded.downloadsEnabled,
  };
}

/** Full detail for a standalone track page — reached only by track id, so
 * (unlike fetchChannelSound) it can't rely on already knowing the channel.
 * `shareKey` is the token from a PRIVATE/STASH sound's share link
 * (`/t/$id?key=...`) — see withShareKey. */
export async function fetchTrackDetail(
  id: string,
  shareKey?: string,
): Promise<{
  data: PublicTrackDetail | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    await ensureMockUploadedSound(id);
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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

const SOUND_DOWNLOAD_SOURCE_FORMAT = 'source';

export async function fetchPublicSoundDownload(
  channelSlug: string,
  itemId: string,
): Promise<
  { ok: true; url: string; filename?: string } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const uploaded = await ensureMockUploadedSound(itemId);
    if (uploaded?.objectUrl) {
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
    const tryFormats = [SOUND_DOWNLOAD_SOURCE_FORMAT, undefined] as const;
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

export * from './radio-public';

export async function fetchProfile(username: string): Promise<{
  data: PublicProfile;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
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
        id: `sound:${track.id}`,
        kind: 'sound' as const,
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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

export * from './client-auth';

export async function fetchFanTiers(username: string): Promise<{
  data: FanTiersResponse;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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

export async function fetchTransparencyResolutions(year?: number): Promise<{
  data: BoardResolution[];
  meta: FetchMeta;
}> {
  const y = year ?? new Date().getFullYear();
  if (isForceMock()) {
    return {
      data: mockTransparencyResolutions(y),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<BoardResolution[]>(
      `/api/v1/transparency/resolutions?year=${y}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      () => mockTransparencyResolutions(y),
      () => [],
    );
  }
}

/** Artists the user follows — closest server analogue to “favorite channels”. */
export async function fetchFollowing(username: string): Promise<{
  data: FollowListUser[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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

export * from './embeds';

export async function postListenEvent(
  soundId: string,
): Promise<{ recorded: boolean; meta: FetchMeta }> {
  if (isForceMock()) {
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
  if (isForceMock()) {
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

export * from './membership';

export * from './governance-member';

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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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

export { soundItemToPlayable };
