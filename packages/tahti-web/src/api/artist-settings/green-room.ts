import type { FetchMeta } from '.././client';
import { failMeta, isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import { mockGreenRoom, setMockGreenRoom } from './mock';

export type WireGreenRoomInvitePool =
  'EVERYONE' | 'SUBS_ONLY' | 'MODERATORS_AND_SUBS' | 'MANUAL_ONLY';

/** The channel's green-room defaults for new broadcasts
 * (tahti-org `/api/me/channel/green-room-defaults`): whether a broadcast
 * opens its green room on its own, and who gets invited when it does. */
export type GreenRoomPrefs = {
  defaultEnabled: boolean;
  invitePool: WireGreenRoomInvitePool;
};

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

type WireGreenRoomDefaults = {
  defaultEnabled: boolean;
  defaultInvitePool: WireGreenRoomInvitePool;
};

const fromWire = (data: WireGreenRoomDefaults): GreenRoomPrefs => ({
  defaultEnabled: data.defaultEnabled,
  invitePool: data.defaultInvitePool,
});

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
  try {
    const { data } = await requestJson<WireGreenRoomDefaults>(
      '/api/me/channel/green-room-defaults',
    );
    return { data: fromWire(data), meta: { source: 'api' } };
  } catch (err) {
    return { data: { ...mockGreenRoom }, meta: failMeta(err) };
  }
}

export async function patchGreenRoomPrefs(
  patch: Partial<GreenRoomPrefs>,
): Promise<{ ok: true; data: GreenRoomPrefs } | { ok: false; error: string }> {
  if (isForceMock()) {
    setMockGreenRoom({ ...mockGreenRoom, ...patch });
    return { ok: true, data: { ...mockGreenRoom } };
  }
  try {
    const { data } = await requestJson<WireGreenRoomDefaults>(
      '/api/me/channel/green-room-defaults',
      {
        method: 'PATCH',
        body: JSON.stringify({
          ...(patch.defaultEnabled === undefined
            ? {}
            : { defaultEnabled: patch.defaultEnabled }),
          ...(patch.invitePool === undefined
            ? {}
            : { defaultInvitePool: patch.invitePool }),
        }),
      },
    );
    return { ok: true, data: fromWire(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}
