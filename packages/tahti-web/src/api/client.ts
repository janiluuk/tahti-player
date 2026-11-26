import { i18n } from '@tahti-player/i18n';

import { profileTrackToPlayable } from '../lib/artistProfile';
import { errorOr, getJson, requestJson } from './client-request';
import { apiBase } from './http';
import {
  channelToPlayable,
  mockAnnouncements,
  mockChannel,
  mockCollection,
  mockProfile,
  mockSmartLink,
  mockSoundItems,
  mockTrackComments,
  mockTrackDetail,
  soundItemToPlayable,
  TAHTI_RADIO_SLUG,
} from './mock';
import { ensureMockUploadedSound, getMockUploadedSound } from './mock-uploads';
import {
  allowMockFallback,
  apiErrorMeta,
  isForceMock,
  mockFallbackMeta,
  withMockFallback,
  type FetchMeta,
} from './mode';
import { findMockPurchaseTier } from './purchase-tiers';
import { withShareKey } from './share-key';
import type {
  Announcement,
  ChannelSoundItem,
  PlatformStatus,
  PublicChannel,
  PublicCollection,
  PublicProfile,
  PublicTrackDetail,
  SmartLinkView,
  TahtiPlayable,
  TrackComment,
} from './types';

export type { FetchMeta };
export { TAHTI_RADIO_SLUG };

/** Browser calls go through Vite proxy → Tahti API (avoids CORS). */
export { apiBase };
export { requestJson };

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
      return {
        data,
        meta: mockFallbackMeta(err),
        playable: channelToPlayable(data),
      };
    }
    throw errorOr(err, i18n.t('web:batch56.channelFetchFailed'));
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
      allowMockFallback() ? () => mockSoundItems(slug) : null,
      () => [],
    );
  }
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
      allowMockFallback()
        ? () => mockTrackDetail(id) ?? mockTrackDetailFromUpload(id)
        : null,
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
      allowMockFallback()
        ? () => ({ comments: mockTrackComments(id), commentsEnabled: true })
        : null,
      () => ({ comments: [], commentsEnabled: true }),
    );
  }
}

function messageOr(err: unknown, message: string): string {
  return err instanceof Error ? err.message : message;
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
      error: messageOr(err, i18n.t('web:batch55.couldNotPostComment')),
    };
  }
}

export { fetchPublicSoundDownload } from './public-sound-download';

export * from './radio-public';

export * from './venues-public';

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
      return { data: mockProfile(username), meta: mockFallbackMeta(err) };
    }
    throw errorOr(err, i18n.t('web:batch56.profileFetchFailed'));
  }
}

export async function fetchArtistPlayables(username: string): Promise<{
  data: TahtiPlayable[];
  meta: FetchMeta;
}> {
  const { data: profile, meta } = await fetchProfile(username);
  const data = profile.tracks.flatMap((track) => {
    const item = track.playUrl
      ? profileTrackToPlayable(
          track,
          profile.artist.displayName,
          profile.channel?.slug,
        )
      : null;
    return item ? [item] : [];
  });
  return { data, meta };
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
      return { data: mockCollection(slug), meta: mockFallbackMeta(err) };
    }
    throw errorOr(err, i18n.t('web:batch56.collectionFetchFailed'));
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
    throw errorOr(err, i18n.t('web:batch56.collectionSubscriptionFailed'));
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
      return {
        data: mockSmartLink(smartLinkSlug),
        meta: mockFallbackMeta(err),
      };
    }
    throw errorOr(err, i18n.t('web:batch56.smartLinkFetchFailed'));
  }
}

export * from './chat-access';
export * from './client-auth';
export * from './fan-subscribe';

export * from './transparency';
export * from './follows';
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

export * from './support';

export * from './feature-requests';

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
    return withMockFallback(
      err,
      allowMockFallback() ? mockAnnouncements : null,
      () => [],
    );
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
      error: messageOr(err, i18n.t('web:batch55.couldNotUpdateSubscription')),
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
