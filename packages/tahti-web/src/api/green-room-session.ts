import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';
import { requestJson } from './request-json';

export type GreenRoomInvite = {
  userId: string;
  username: string;
  displayName: string;
  source: 'MODERATOR' | 'FAN_SUB' | 'MANUAL' | 'PUBLIC';
  invitedAt: string;
  joinedAt: string | null;
};

export type GreenRoomCandidate = {
  userId: string;
  username: string;
  displayName: string;
  kind: 'MODERATOR' | 'FAN_SUB';
};

/** The green room of the broadcast that's running now (or would start). */
export type GreenRoomSession = {
  enabled: boolean;
  channelState: 'OFFLINE' | 'PREVIEW' | 'LIVE';
  invitePool: 'MODERATORS_AND_SUBS' | 'SUBS_ONLY' | 'MANUAL_ONLY' | 'EVERYONE';
  invites: GreenRoomInvite[];
  candidates: GreenRoomCandidate[];
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const message = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

let mockSession: GreenRoomSession = {
  enabled: false,
  channelState: 'PREVIEW',
  invitePool: 'MODERATORS_AND_SUBS',
  invites: [],
  candidates: [
    {
      userId: 'mock-mod',
      username: 'listener',
      displayName: 'Listener One',
      kind: 'MODERATOR',
    },
  ],
};

export async function fetchGreenRoomSession(): Promise<{
  data: GreenRoomSession | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockSession,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<GreenRoomSession>('/api/me/channel/green-room');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

/** Open or close the green room for the current broadcast; opening it also
 * invites everyone the channel's invite pool covers. */
export async function setGreenRoomSessionEnabled(
  enabled: boolean,
): Promise<Result<GreenRoomSession>> {
  if (isForceMock()) {
    mockSession = {
      ...mockSession,
      enabled,
      invites: enabled
        ? mockSession.candidates.map((candidate) => ({
            userId: candidate.userId,
            username: candidate.username,
            displayName: candidate.displayName,
            source: candidate.kind,
            invitedAt: new Date().toISOString(),
            joinedAt: null,
          }))
        : mockSession.invites,
    };
    return { ok: true, data: mockSession };
  }
  try {
    const { data } = await requestJson<GreenRoomSession>(
      '/api/me/channel/green-room',
      { method: 'PATCH', body: JSON.stringify({ enabled }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: message(err, 'Could not change the green room'),
    };
  }
}

export async function removeGreenRoomInvite(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockSession = {
      ...mockSession,
      invites: mockSession.invites.filter((invite) => invite.userId !== userId),
    };
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/channel/green-room/invites/${encodeURIComponent(userId)}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not remove the guest') };
  }
}

export async function inviteToGreenRoom(
  username: string,
): Promise<Result<GreenRoomInvite>> {
  if (isForceMock()) {
    const invite: GreenRoomInvite = {
      userId: `mock-${username}`,
      username,
      displayName: username,
      source: 'MANUAL',
      invitedAt: new Date().toISOString(),
      joinedAt: null,
    };
    mockSession = { ...mockSession, invites: [...mockSession.invites, invite] };
    return { ok: true, data: invite };
  }
  try {
    const { data } = await requestJson<GreenRoomInvite>(
      '/api/me/channel/green-room/invites',
      { method: 'POST', body: JSON.stringify({ username }) },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not invite that person') };
  }
}

/** Invite everyone the invite pool covers who isn't on the list yet (new
 * fan subscribers or moderators since the room opened). */
export async function syncGreenRoomInvites(): Promise<
  Result<GreenRoomSession>
> {
  if (isForceMock()) {
    return { ok: true, data: mockSession };
  }
  try {
    const { data } = await requestJson<GreenRoomSession>(
      '/api/me/channel/green-room/sync',
      { method: 'POST' },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: message(err, 'Could not update the guest list'),
    };
  }
}
