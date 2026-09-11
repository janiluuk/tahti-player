import type { FetchMeta } from './client';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';

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

export type NotificationPrefs = {
  notifyMoneyMovesEmail: boolean;
  notifyMoneyMovesInApp: boolean;
  notifyListenerActivityEmail: boolean;
  notifyWeeklyRecapEmail: boolean;
};

export type DiscoveryPrefs = {
  listedInDirectory: boolean;
  allowRadioPickup: boolean;
  showOnListenHome: boolean;
  genreTags: string;
  /** Favorited tracks/channels visible on the public profile. */
  showFavorites: boolean;
  /** Notify followers (feed + optional email) when a release goes public. */
  announceReleases: boolean;
};

/** Who can join the green room once it's open: any signed-in listener, or
 * only the artist's active fan subscribers. Backed by the channel's real
 * green-room invite pool in tahti-org (`GreenRoomInvitePool` — see
 * apps/api/src/routes/me/green-room-defaults.ts); this simplified two-value
 * surface collapses the backend's finer MODERATORS_AND_SUBS/SUBS_ONLY/
 * MANUAL_ONLY split into "subscribers" and only distinguishes EVERYONE. */
export type GreenRoomAccessLevel = 'everyone' | 'subscribers';

export type GreenRoomPrefs = {
  defaultTitle: string;
  defaultNote: string;
  autoAnnounce: boolean;
  holdMusicEnabled: boolean;
  access: GreenRoomAccessLevel;
};

type WireGreenRoomInvitePool =
  | 'EVERYONE'
  | 'SUBS_ONLY'
  | 'MODERATORS_AND_SUBS'
  | 'MANUAL_ONLY';

function accessFromPool(pool: WireGreenRoomInvitePool): GreenRoomAccessLevel {
  return pool === 'EVERYONE' ? 'everyone' : 'subscribers';
}

function poolFromAccess(access: GreenRoomAccessLevel): WireGreenRoomInvitePool {
  return access === 'everyone' ? 'EVERYONE' : 'SUBS_ONLY';
}

export type SocialConnections = {
  website: string;
  instagram: string;
  bandcamp: string;
  soundcloud: string;
  youtube: string;
  discord: string;
  mixcloud: string;
  hearthisAt: string;
  twitch: string;
  kick: string;
  spotify: string;
  tiktok: string;
  twitter: string;
  facebook: string;
  showConnections: boolean;
};

export type ChannelMember = {
  id: string;
  username: string;
  displayName: string;
  role: 'OWNER' | 'MEMBER' | 'MODERATOR';
};

export type ModeratorRow = {
  id: string;
  username: string;
  displayName: string;
  canTimeout: boolean;
  canDelete: boolean;
};

export type PressKitMeta = {
  hasZip: boolean;
  bioShort: string;
  downloadPath: string | null;
  photoCount: number;
};

let mockNotifications: NotificationPrefs = {
  notifyMoneyMovesEmail: true,
  notifyMoneyMovesInApp: true,
  notifyListenerActivityEmail: true,
  notifyWeeklyRecapEmail: true,
};

let mockDiscovery: DiscoveryPrefs = {
  listedInDirectory: true,
  allowRadioPickup: true,
  showOnListenHome: true,
  genreTags: 'ambient, live',
  showFavorites: true,
  announceReleases: true,
};

let mockGreenRoom: GreenRoomPrefs = {
  defaultTitle: 'Live session',
  defaultNote: '',
  autoAnnounce: true,
  holdMusicEnabled: false,
  // Subscribers-only is the safer default — matches the invite-only framing
  // guests see in GreenRoomView before an artist opts into "everyone".
  access: 'subscribers',
};

let mockSocial: SocialConnections = {
  website: '',
  instagram: '',
  bandcamp: '',
  soundcloud: '',
  youtube: '',
  discord: '',
  mixcloud: '',
  hearthisAt: '',
  twitch: '',
  kick: '',
  spotify: '',
  tiktok: '',
  twitter: '',
  facebook: '',
  showConnections: true,
};

const mockMembers: ChannelMember[] = [
  {
    id: 'm1',
    username: 'demo',
    displayName: 'Demo Artist',
    role: 'OWNER',
  },
  {
    id: 'm2',
    username: 'co-host',
    displayName: 'Co Host',
    role: 'MEMBER',
  },
];

const mockMods: ModeratorRow[] = [
  {
    id: 'mod1',
    username: 'mod-ada',
    displayName: 'Ada Mod',
    canTimeout: true,
    canDelete: true,
  },
];

export type ChatBan = {
  fingerprintHash: string;
  bannedAt: string;
};

const mockChatBans: ChatBan[] = [
  {
    fingerprintHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    bannedAt: '2026-07-20T18:00:00.000Z',
  },
];

let mockPress: PressKitMeta = {
  hasZip: false,
  bioShort: 'Demo Artist — live electronic sets from the north.',
  downloadPath: null,
  photoCount: 0,
};

export async function fetchNotificationPrefs(): Promise<{
  data: NotificationPrefs;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockNotifications },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<NotificationPrefs>(
      '/api/me/notification-preferences',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: { ...mockNotifications }, meta: failMeta(err) };
    }
    return {
      data: {
        notifyMoneyMovesEmail: false,
        notifyMoneyMovesInApp: false,
        notifyListenerActivityEmail: false,
        notifyWeeklyRecapEmail: false,
      },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchNotificationPrefs(
  patch: Partial<NotificationPrefs>,
): Promise<
  { ok: true; data: NotificationPrefs } | { ok: false; error: string }
> {
  if (isForceMock()) {
    mockNotifications = { ...mockNotifications, ...patch };
    return { ok: true, data: { ...mockNotifications } };
  }
  try {
    const { data } = await requestJson<NotificationPrefs>(
      '/api/me/notification-preferences',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function fetchDiscoveryPrefs(): Promise<{
  data: DiscoveryPrefs;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockDiscovery },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<DiscoveryPrefs>('/api/me/discovery');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: { ...mockDiscovery }, meta: failMeta(err) };
    }
    return {
      data: {
        listedInDirectory: false,
        allowRadioPickup: false,
        showOnListenHome: false,
        genreTags: '',
        showFavorites: false,
        announceReleases: false,
      },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchDiscoveryPrefs(
  patch: Partial<DiscoveryPrefs>,
): Promise<{ ok: true; data: DiscoveryPrefs } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockDiscovery = { ...mockDiscovery, ...patch };
    return { ok: true, data: { ...mockDiscovery } };
  }
  try {
    const { data } = await requestJson<DiscoveryPrefs>('/api/me/discovery', {
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

/** Guest-side view of an artist's green room — the invite-only preview
 * stream that runs before a broadcast goes public. */
export type GreenRoomAccess = {
  hasAccess: boolean;
  channelState: 'OFFLINE' | 'PREVIEW' | 'LIVE';
  greenRoomEnabled: boolean;
  joinedAt: string | null;
  hlsUrl: string | null;
  artistUsername: string;
  artistDisplayName: string;
};

export async function fetchGreenRoomAccess(
  channelSlug: string,
): Promise<
  | { ok: true; data: GreenRoomAccess }
  | { ok: false; needsLogin: boolean; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      data: {
        hasAccess: true,
        channelState: 'PREVIEW',
        greenRoomEnabled: true,
        joinedAt: new Date().toISOString(),
        // Non-null so the actual "you're in, here's the preview" state is
        // reachable offline — with null the mock could only ever render
        // the "waiting for preview" branch.
        hlsUrl: 'https://stream.tahti.live/mock/green-room.m3u8',
        artistUsername: channelSlug,
        artistDisplayName: 'Northern Lights',
      },
    };
  }
  try {
    const { data } = await requestJson<GreenRoomAccess>(
      `/api/me/green-room/${encodeURIComponent(channelSlug)}`,
    );
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    return {
      ok: false,
      needsLogin: /401|unauthor/i.test(message),
      error: message || 'Could not load green room access',
    };
  }
}

export async function joinGreenRoom(
  channelSlug: string,
): Promise<GreenRoomAccess | null> {
  if (isForceMock()) {
    return null;
  }
  try {
    const { data } = await requestJson<GreenRoomAccess>(
      `/api/me/green-room/${encodeURIComponent(channelSlug)}/join`,
      { method: 'POST' },
    );
    return data;
  } catch {
    return null;
  }
}

export async function fetchGreenRoomPrefs(): Promise<{
  data: GreenRoomPrefs;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockGreenRoom },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  // `access` is backed by the channel's real green-room invite pool
  // (tahti-org's /api/me/channel/green-room-defaults) — fetched alongside
  // the title/note/announce/hold-music prefs so either endpoint can degrade
  // to its mock value independently of the other.
  const [base, defaults] = await Promise.all([
    requestJson<Omit<GreenRoomPrefs, 'access'>>('/api/me/green-room')
      .then((r) => ({ ok: true as const, data: r.data }))
      .catch((err: unknown) => ({ ok: false as const, err })),
    requestJson<{ defaultInvitePool: WireGreenRoomInvitePool }>(
      '/api/me/channel/green-room-defaults',
    )
      .then((r) => ({ ok: true as const, data: r.data }))
      .catch((err: unknown) => ({ ok: false as const, err })),
  ]);

  if (!base.ok && !defaults.ok) {
    return { data: { ...mockGreenRoom }, meta: failMeta(base.err) };
  }
  return {
    data: {
      ...(base.ok ? base.data : mockGreenRoom),
      access: defaults.ok
        ? accessFromPool(defaults.data.defaultInvitePool)
        : mockGreenRoom.access,
    },
    meta:
      base.ok && defaults.ok
        ? { source: 'api' }
        : failMeta(
            !base.ok ? base.err : !defaults.ok ? defaults.err : undefined,
          ),
  };
}

export async function patchGreenRoomPrefs(
  patch: Partial<GreenRoomPrefs>,
): Promise<{ ok: true; data: GreenRoomPrefs } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockGreenRoom = { ...mockGreenRoom, ...patch };
    return { ok: true, data: { ...mockGreenRoom } };
  }
  const { access, ...rest } = patch;
  try {
    let merged: GreenRoomPrefs = { ...mockGreenRoom };
    if (Object.keys(rest).length > 0) {
      const { data } = await requestJson<Omit<GreenRoomPrefs, 'access'>>(
        '/api/me/green-room',
        { method: 'PATCH', body: JSON.stringify(rest) },
      );
      merged = { ...merged, ...data };
    }
    if (access !== undefined) {
      const { data } = await requestJson<{
        defaultInvitePool: WireGreenRoomInvitePool;
      }>('/api/me/channel/green-room-defaults', {
        method: 'PATCH',
        body: JSON.stringify({ defaultInvitePool: poolFromAccess(access) }),
      });
      merged = { ...merged, access: accessFromPool(data.defaultInvitePool) };
    }
    return { ok: true, data: merged };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function fetchSocialConnections(): Promise<{
  data: SocialConnections;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockSocial },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<SocialConnections>(
      '/api/me/connections',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: { ...mockSocial }, meta: failMeta(err) };
    }
    return {
      data: {
        website: '',
        instagram: '',
        bandcamp: '',
        soundcloud: '',
        youtube: '',
        discord: '',
        mixcloud: '',
        hearthisAt: '',
        twitch: '',
        kick: '',
        spotify: '',
        tiktok: '',
        twitter: '',
        facebook: '',
        showConnections: true,
      },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchSocialConnections(
  patch: Partial<SocialConnections>,
): Promise<
  { ok: true; data: SocialConnections } | { ok: false; error: string }
> {
  if (isForceMock()) {
    mockSocial = { ...mockSocial, ...patch };
    return { ok: true, data: { ...mockSocial } };
  }
  try {
    const { data } = await requestJson<SocialConnections>(
      '/api/me/connections',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function fetchChannelMembers(): Promise<{
  data: ChannelMember[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...mockMembers],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<
      ChannelMember[] | { members: ChannelMember[] }
    >('/api/me/channel/members');
    const list = Array.isArray(data) ? data : (data.members ?? []);
    return { data: list, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

/** Real shape of GET /api/me/channel/moderators — delegated chat moderators. */
type ChannelModeratorApiRow = {
  userId: string;
  username: string;
  displayName: string;
  grantedAt: string;
};

function toModeratorRow(row: ChannelModeratorApiRow): ModeratorRow {
  return {
    id: row.userId,
    username: row.username,
    displayName: row.displayName,
    // Delegated moderators can ban/unban chat; prod has no finer-grained split.
    canTimeout: true,
    canDelete: true,
  };
}

export async function fetchModerators(): Promise<{
  data: ModeratorRow[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...mockMods],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ChannelModeratorApiRow[]>(
      '/api/me/channel/moderators',
    );
    return { data: data.map(toModeratorRow), meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function addModerator(
  username: string,
): Promise<{ ok: true; data: ModeratorRow } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row: ModeratorRow = {
      id: `mod-mock-${Date.now()}`,
      username,
      displayName: username,
      canTimeout: true,
      canDelete: true,
    };
    mockMods.push(row);
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<ChannelModeratorApiRow>(
      '/api/me/channel/moderators',
      { method: 'POST', body: JSON.stringify({ username }) },
    );
    return { ok: true, data: toModeratorRow(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not add moderator',
    };
  }
}

export async function removeModerator(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const idx = mockMods.findIndex((m) => m.id === userId);
    if (idx >= 0) {
      mockMods.splice(idx, 1);
    }
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/channel/moderators/${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not remove moderator',
    };
  }
}

export async function fetchChatBans(slug: string): Promise<{
  data: ChatBan[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...mockChatBans],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ChatBan[]>(
      `/api/me/moderate/${encodeURIComponent(slug)}/chat/bans`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function banChatFingerprint(
  slug: string,
  fingerprintHash: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    if (!mockChatBans.some((b) => b.fingerprintHash === fingerprintHash)) {
      mockChatBans.unshift({
        fingerprintHash,
        bannedAt: new Date().toISOString(),
      });
    }
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/moderate/${encodeURIComponent(slug)}/chat/ban`, {
      method: 'POST',
      body: JSON.stringify({ fingerprintHash }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not ban',
    };
  }
}

export async function unbanChatFingerprint(
  slug: string,
  fingerprintHash: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const idx = mockChatBans.findIndex(
      (b) => b.fingerprintHash === fingerprintHash,
    );
    if (idx >= 0) {
      mockChatBans.splice(idx, 1);
    }
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/moderate/${encodeURIComponent(slug)}/chat/ban/${encodeURIComponent(fingerprintHash)}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not unban',
    };
  }
}

export async function fetchPressKitMeta(): Promise<{
  data: PressKitMeta;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { ...mockPress },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PressKitMeta>('/api/me/press-kit');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: { ...mockPress, hasZip: false, downloadPath: null },
        meta: failMeta(err),
      };
    }
    return {
      data: { hasZip: false, bioShort: '', downloadPath: null, photoCount: 0 },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchPressKitBio(
  bioShort: string,
): Promise<{ ok: true; data: PressKitMeta } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockPress = { ...mockPress, bioShort };
    return { ok: true, data: { ...mockPress } };
  }
  try {
    const { data } = await requestJson<PressKitMeta>('/api/me/press-kit', {
      method: 'PATCH',
      body: JSON.stringify({ bioShort }),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export type PublicPressKitImage = {
  id: string;
  imageUrl: string;
  title: string | null;
};

export type PressKitImageItem = PublicPressKitImage & {
  position: number;
  includeInZip: boolean;
};

export const MAX_PRESS_KIT_SELECTED_IMAGES = 10;

const ACCEPTED_PRESS_KIT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PRESS_KIT_IMAGES = 30;

/** Starts empty so the artist-page “add images” affordance is exercisable offline. */
let mockGalleryImages: PressKitImageItem[] = [];

let mockGalleryPublic = false;
let mockGalleryImageCounter = 0;

/** Public gallery on `/u/:username` — empty unless the artist opted in. */
export async function fetchPublicPressKitImages(
  username: string,
): Promise<{ data: PublicPressKitImage[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockGalleryPublic
        ? mockGalleryImages.map(({ id, imageUrl, title }) => ({
            id,
            imageUrl,
            title,
          }))
        : [],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PublicPressKitImage[]>(
      `/api/v1/u/${encodeURIComponent(username)}/press-kit-images.json`,
    );
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

/** Owner list — includes images even when the public gallery is off. */
export async function fetchMyPressKitImages(): Promise<{
  data: PressKitImageItem[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockGalleryImages.map((i) => ({ ...i })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PressKitImageItem[]>(
      '/api/me/press-kit/images',
    );
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function setPressKitGalleryPublic(
  pressKitGalleryPublic: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockGalleryPublic = pressKitGalleryPublic;
    return { ok: true };
  }
  try {
    await requestJson('/api/me/press-kit/gallery-settings', {
      method: 'PATCH',
      body: JSON.stringify({ pressKitGalleryPublic }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Gallery setting failed',
    };
  }
}

export async function uploadPressKitImage(
  file: File,
): Promise<
  { ok: true; image: PressKitImageItem } | { ok: false; error: string }
> {
  const type = file.type || 'image/jpeg';
  if (!ACCEPTED_PRESS_KIT_TYPES.includes(type)) {
    return { ok: false, error: 'Use JPEG, PNG, or WebP' };
  }
  if (isForceMock()) {
    if (mockGalleryImages.length >= MAX_PRESS_KIT_IMAGES) {
      return {
        ok: false,
        error: `Press kit is limited to ${MAX_PRESS_KIT_IMAGES} images`,
      };
    }
    const image: PressKitImageItem = {
      id: `pk-mock-${Date.now()}-${mockGalleryImageCounter++}`,
      imageUrl: URL.createObjectURL(file),
      title: null,
      position: mockGalleryImages.length,
      includeInZip: true,
    };
    mockGalleryImages = [...mockGalleryImages, image];
    mockPress = { ...mockPress, photoCount: mockGalleryImages.length };
    return { ok: true, image };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>('/api/me/press-kit/images/prepare', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType: type }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': type },
    });
    if (!put.ok) {
      throw new Error(`Upload PUT failed (${put.status})`);
    }
    const { data: image } = await requestJson<PressKitImageItem>(
      '/api/me/press-kit/images/complete',
      {
        method: 'POST',
        body: JSON.stringify({ uploadKey: prep.uploadKey }),
      },
    );
    return { ok: true, image };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

/** Sequential multi-file upload (matches dashboard press-kit builder). */
export async function uploadPressKitImages(files: FileList | File[]): Promise<{
  ok: true;
  images: PressKitImageItem[];
  errors: string[];
}> {
  const list = Array.from(files).slice(0, MAX_PRESS_KIT_IMAGES);
  const images: PressKitImageItem[] = [];
  const errors: string[] = [];
  for (const file of list) {
    const result = await uploadPressKitImage(file);
    if (result.ok) {
      images.push(result.image);
    } else {
      errors.push(`${file.name}: ${result.error}`);
    }
  }
  return { ok: true, images, errors };
}

export async function updatePressKitImage(
  id: string,
  patch: Partial<
    Pick<PressKitImageItem, 'title' | 'includeInZip' | 'position'>
  >,
): Promise<
  { ok: true; data: PressKitImageItem } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const current = mockGalleryImages.find((image) => image.id === id);
    if (!current) {
      return { ok: false, error: 'Image not found' };
    }
    Object.assign(current, patch);
    return { ok: true, data: { ...current } };
  }
  try {
    const { data } = await requestJson<PressKitImageItem>(
      `/api/me/press-kit/images/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Image update failed',
    };
  }
}

export async function uploadProfileAvatar(
  file: File,
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  const contentType = file.type || 'image/jpeg';
  if (!ACCEPTED_PRESS_KIT_TYPES.includes(contentType)) {
    return { ok: false, error: 'Use JPEG, PNG, or WebP' };
  }
  if (isForceMock()) {
    const avatarUrl = URL.createObjectURL(file);
    return { ok: true, avatarUrl };
  }
  try {
    const { data: prepare } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>('/api/me/profile/avatar/prepare', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType }),
    });
    const upload = await fetch(prepare.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
    if (!upload.ok) {
      throw new Error(`Upload PUT failed (${upload.status})`);
    }
    const { data } = await requestJson<{ avatarUrl: string }>(
      '/api/me/profile/avatar/complete',
      {
        method: 'POST',
        body: JSON.stringify({ uploadKey: prepare.uploadKey }),
      },
    );
    return { ok: true, avatarUrl: data.avatarUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Avatar upload failed',
    };
  }
}

export async function removeProfileAvatar(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    // avatarUrl.trim() || null on the server -- an empty string clears it.
    await requestJson('/api/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl: '' }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Avatar removal failed',
    };
  }
}

export async function deletePressKitImage(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockGalleryImages = mockGalleryImages.filter((i) => i.id !== id);
    mockPress = { ...mockPress, photoCount: mockGalleryImages.length };
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/press-kit/images/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}
