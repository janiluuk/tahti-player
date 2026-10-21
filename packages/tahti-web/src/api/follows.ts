import { requestJson } from './client-request';
import { listMockFollowing, mockFollow, mockUnfollow } from './mock-session';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';
import type { FollowListUser } from './types';

export type FollowStatus = {
  following: boolean;
  followerCount: number | null;
};

export type FollowResult =
  { ok: true; followerCount: number | null } | { ok: false; error: string };

function followPath(username: string): string {
  return `/api/v1/artists/${encodeURIComponent(username)}/follow`;
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
    const { data } = await requestJson<{ users: FollowListUser[] }>(
      `/api/v1/artists/${encodeURIComponent(username)}/following`,
    );
    return { data: data.users ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchFollowStatus(
  username: string,
): Promise<FollowStatus | null> {
  if (isForceMock()) {
    return {
      following: listMockFollowing().some((u) => u.username === username),
      followerCount: null,
    };
  }
  try {
    const { data } = await requestJson<FollowStatus>(followPath(username));
    return data;
  } catch {
    return null;
  }
}

async function sendFollow(
  username: string,
  method: 'POST' | 'DELETE',
  fallbackError: string,
): Promise<FollowResult> {
  if (isForceMock()) {
    if (method === 'POST') {
      mockFollow(username);
    } else {
      mockUnfollow(username);
    }
    return { ok: true, followerCount: null };
  }
  try {
    const { data } = await requestJson<Partial<FollowStatus> | undefined>(
      followPath(username),
      { method },
    );
    return {
      ok: true,
      followerCount:
        typeof data?.followerCount === 'number' ? data.followerCount : null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : fallbackError,
    };
  }
}

export function followArtist(username: string): Promise<FollowResult> {
  return sendFollow(username, 'POST', 'Follow failed');
}

export function unfollowArtist(username: string): Promise<FollowResult> {
  return sendFollow(username, 'DELETE', 'Unfollow failed');
}

export type FollowListDirection = 'followers' | 'following';

export type FollowListPage = {
  users: FollowListUser[];
  hasMore: boolean;
};

export async function fetchFollowList(
  username: string,
  direction: FollowListDirection,
  offset = 0,
): Promise<FollowListPage | null> {
  if (isForceMock()) {
    return {
      users: direction === 'following' ? listMockFollowing() : [],
      hasMore: false,
    };
  }
  try {
    const { data } = await requestJson<Partial<FollowListPage>>(
      `/api/v1/artists/${encodeURIComponent(username)}/${direction}?offset=${offset}`,
    );
    return { users: data.users ?? [], hasMore: Boolean(data.hasMore) };
  } catch {
    return null;
  }
}
