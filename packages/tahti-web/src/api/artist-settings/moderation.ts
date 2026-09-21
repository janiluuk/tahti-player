import type { FetchMeta } from '.././client';
import { failMeta, isForceMock } from '.././mode';
import { requestJson } from '.././request-json';
import { mockChatBans, mockMembers, mockMods } from './mock';

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

export type ChatBan = {
  fingerprintHash: string;
  bannedAt: string;
};

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
export type ChannelModeratorApiRow = {
  userId: string;
  username: string;
  displayName: string;
  grantedAt: string;
};

export function toModeratorRow(row: ChannelModeratorApiRow): ModeratorRow {
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
