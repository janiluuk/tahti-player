import type { FetchMeta } from '.././client';
import { failMeta, isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import { mockGreenRoom, setMockGreenRoom } from './mock';

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

export type WireGreenRoomInvitePool =
  'EVERYONE' | 'SUBS_ONLY' | 'MODERATORS_AND_SUBS' | 'MANUAL_ONLY';

export function accessFromPool(
  pool: WireGreenRoomInvitePool,
): GreenRoomAccessLevel {
  return pool === 'EVERYONE' ? 'everyone' : 'subscribers';
}

export function poolFromAccess(
  access: GreenRoomAccessLevel,
): WireGreenRoomInvitePool {
  return access === 'everyone' ? 'EVERYONE' : 'SUBS_ONLY';
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
    setMockGreenRoom({ ...mockGreenRoom, ...patch });
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
