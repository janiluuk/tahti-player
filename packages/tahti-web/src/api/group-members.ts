import type { FetchMeta } from './client';
import type { ArtistGroupRole } from './groups';
import { mockFetchGroupMembers, mockRemoveGroupMember } from './groups-mock';
import { apiErrorMeta, isForceMock } from './mode';
import { requestJson } from './request-json';

export type GroupMember = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: ArtistGroupRole;
  joinedAt: string;
};

type Result = { ok: true } | { ok: false; error: string };

function groupPath(slug: string) {
  return `/api/me/groups/${encodeURIComponent(slug)}`;
}

/** Everyone in a group, owner and admins first. Only members can list. */
export async function fetchGroupMembers(
  slug: string,
): Promise<{ data: GroupMember[]; total: number; meta: FetchMeta }> {
  if (isForceMock()) {
    const data = mockFetchGroupMembers(slug);
    return {
      data,
      total: data.length,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ items: GroupMember[]; total: number }>(
      `${groupPath(slug)}/members`,
    );
    return { data: data.items, total: data.total, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], total: 0, meta: apiErrorMeta(err) };
  }
}

/** Owner or admin takes a member out of the group (only the owner removes admins). */
export async function removeGroupMember(
  slug: string,
  username: string,
): Promise<Result> {
  if (isForceMock()) {
    return mockRemoveGroupMember(slug, username);
  }
  try {
    await requestJson(
      `${groupPath(slug)}/members/${encodeURIComponent(username)}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not remove member',
    };
  }
}
