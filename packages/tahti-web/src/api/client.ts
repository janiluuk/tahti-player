import {
  archiveItemToPlayable,
  channelToPlayable,
  DEMO_MP3,
  mockArchiveItems,
  mockChannel,
  mockChatAccess,
  mockChatHistory,
  mockCollection,
  mockDirectory,
  mockFanTiers,
  mockProfile,
  mockRadioStation,
  mockSmartLink,
  mockTransparencyGrants,
  mockTransparencyLedger,
  mockTransparencyYtd,
  mockVenues,
  radioStationToPlayable,
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
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
  withMockFallback,
  type FetchMeta,
} from './mode';
import type {
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
  FollowListUser,
  GovernanceMotion,
  MembershipStatus,
  PlatformStatus,
  PublicChannel,
  PublicCollection,
  PublicProfile,
  RadioNowPlaying,
  RadioRecentlyPlayedItem,
  RadioStation,
  ReleaseEmbedView,
  SmartLinkView,
  TahtiPlayable,
  TransparencyGrantReport,
  TransparencyLedgerEntry,
  TransparencyYtd,
  VenueDirectoryItem,
} from './types';
import { TAHTI_RADIO_SLUG } from './types';

export type { FetchMeta };

const forceMock = isForceMock;

/** Browser calls go through Vite proxy → Tahti API (avoids CORS). */
const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function requestJson<T>(
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

/**
 * Tahti Radio listen payload.
 * Playable audio is always GET /api/channels/tahti-radio (24/7 Liquidsoap HLS).
 * GET /api/v1/radio is only the optional member-relay guest badge.
 */
export async function fetchRadio(): Promise<{
  data: RadioStation;
  meta: FetchMeta;
  playable: TahtiPlayable | null;
}> {
  if (forceMock()) {
    const data = mockRadioStation();
    return {
      data,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
      playable: radioStationToPlayable(data),
    };
  }
  try {
    const offlineRelay: RadioNowPlaying = { live: false, channel: null };
    const [channel, memberRelay, recentlyPlayed] = await Promise.all([
      getJson<PublicChannel>(
        `/api/channels/${encodeURIComponent(TAHTI_RADIO_SLUG)}`,
      ),
      getJson<RadioNowPlaying>('/api/v1/radio').catch(() => offlineRelay),
      getJson<RadioRecentlyPlayedItem[]>(
        '/api/v1/radio/recently-played',
      ).catch(() => [] as RadioRecentlyPlayedItem[]),
    ]);

    const data: RadioStation = {
      slug: channel.slug,
      state: channel.state,
      hlsUrl: channel.hlsUrl,
      displayName: channel.user.displayName,
      username: channel.user.username,
      avatarUrl: channel.user.avatarUrl,
      chatEnabled: channel.chatEnabled !== false,
      nowPlaying: channel.nowPlaying,
      memberRelay,
      recentlyPlayed: Array.isArray(recentlyPlayed) ? recentlyPlayed : [],
    };

    return {
      data,
      meta: { source: 'api' },
      playable: radioStationToPlayable(data),
    };
  } catch (err) {
    if (allowMockFallback()) {
      const data = mockRadioStation();
      return {
        data,
        meta: failMeta(err),
        playable: radioStationToPlayable(data),
      };
    }
    return {
      data: {
        slug: TAHTI_RADIO_SLUG,
        state: 'OFFLINE',
        hlsUrl: null,
        displayName: 'Tahti Radio',
        username: TAHTI_RADIO_SLUG,
        avatarUrl: null,
        chatEnabled: false,
        nowPlaying: null,
        memberRelay: { live: false, channel: null },
        recentlyPlayed: [],
      },
      meta: apiErrorMeta(err),
      playable: null,
    };
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
    return { ok: false, error: 'Invalid code (mock accepts 000000 or 123456)' };
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
      return { ok: false, error: 'Log in first (mock) to activate a fan sub.' };
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
    if (data.checkoutUrl) {
      return { ok: true, checkoutUrl: data.checkoutUrl };
    }
    if (status === 201 || data.activated) {
      return {
        ok: true,
        activated: true,
        message: `Subscribed to ${data.tierName ?? 'tier'} (dev activate)`,
      };
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
          title: 'Track one (mock)',
          hasStream: true,
        },
        {
          id: `${id}-t2`,
          position: 2,
          title: 'Track two (mock)',
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
          title: 'Track one (mock)',
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
          title: 'Track one (mock)',
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
        .filter((i) => i.archiveItem)
        .map((i) => ({
          id: i.archiveItem!.id,
          title: i.archiveItem!.title,
          durationSec: i.archiveItem!.durationSec,
          hasStream: Boolean(i.archiveItem!.audioUrl),
        })),
    };
    const playables = col.items
      .filter((i) => i.archiveItem?.audioUrl)
      .map(
        (i): TahtiPlayable => ({
          id: `archive:${i.archiveItem!.id}`,
          kind: 'archive',
          title: i.archiveItem!.title,
          artist: col.user.displayName,
          coverUrl: col.coverUrl ?? undefined,
          streamUrl: i.archiveItem!.audioUrl!,
          protocol: i.archiveItem!.audioUrl!.includes('.m3u8')
            ? 'hls'
            : 'https',
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
          .filter((i) => i.archiveItem)
          .map((i) => ({
            id: i.archiveItem!.id,
            title: i.archiveItem!.title,
            hasStream: true,
          })),
      },
      meta: failMeta(err),
      playables: col.items
        .filter((i) => i.archiveItem?.audioUrl)
        .map(
          (i): TahtiPlayable => ({
            id: `archive:${i.archiveItem!.id}`,
            kind: 'archive',
            title: i.archiveItem!.title,
            artist: col.user.displayName,
            streamUrl: i.archiveItem!.audioUrl!,
            protocol: 'https',
          }),
        ),
    };
  }
}

export async function postListenEvent(
  archiveItemId: string,
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
        body: JSON.stringify({ archiveItemId }),
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
    title: 'Approve 2026 grant formula (mock)',
    state: 'OPEN',
    proposer: 'Board',
    totalVotes: 3,
    youVoted: false,
    commentCount: 2,
    tally: { YES: 1, NO: 1, ABSTAIN: 1 },
  },
  {
    id: 'motion-2',
    title: 'Confirm annual report (mock)',
    state: 'CLOSED',
    proposer: 'Board',
    totalVotes: 12,
    youVoted: true,
    yourChoice: 'YES',
    tally: { YES: 10, NO: 1, ABSTAIN: 1 },
    commentCount: 0,
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
  ],
  'motion-2': [],
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

export { archiveItemToPlayable };
