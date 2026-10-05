import { isForceMock } from './mode';
import { requestJson } from './request-json';

/** An account the signed-in user has blocked from messaging them. */
export type BlockedUser = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  blockedAt: string;
};

let mockBlocked: BlockedUser[] = [];

export async function fetchBlockedUsers(): Promise<BlockedUser[]> {
  if (isForceMock()) {
    return mockBlocked;
  }
  try {
    const { data } = await requestJson<{ blocked: BlockedUser[] }>(
      '/api/me/blocks',
    );
    return Array.isArray(data.blocked) ? data.blocked : [];
  } catch {
    return [];
  }
}

export async function blockUser(
  username: string,
): Promise<{ ok: true; data: BlockedUser } | { ok: false; error: string }> {
  if (isForceMock()) {
    const data: BlockedUser = {
      username,
      displayName: username,
      avatarUrl: null,
      blockedAt: new Date().toISOString(),
    };
    mockBlocked = [data, ...mockBlocked.filter((b) => b.username !== username)];
    return { ok: true, data };
  }
  try {
    const { data } = await requestJson<BlockedUser>('/api/me/blocks', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not block that account',
    };
  }
}

export async function unblockUser(
  username: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockBlocked = mockBlocked.filter((b) => b.username !== username);
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/blocks/${encodeURIComponent(username)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not unblock that account',
    };
  }
}
