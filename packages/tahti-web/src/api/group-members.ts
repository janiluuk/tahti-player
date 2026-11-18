import { i18n } from '@tahti-player/i18n';

import type { FetchMeta } from './client';
import type { ArtistGroupRole } from './groups';
import {
  mockFetchGroupMembers,
  mockRemoveGroupMember,
  mockSetGroupMemberRole,
  mockTransferGroup,
} from './groups-mock';
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
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch55.couldNotRemoveMember'),
    };
  }
}

/** Owner only: make a member an admin, or an admin a member again. */
export async function setGroupMemberRole(
  slug: string,
  username: string,
  role: 'ADMIN' | 'MEMBER',
): Promise<Result> {
  if (isForceMock()) {
    return mockSetGroupMemberRole(slug, username, role);
  }
  try {
    await requestJson(
      `${groupPath(slug)}/members/${encodeURIComponent(username)}`,
      { method: 'PATCH', body: JSON.stringify({ role }) },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch55.couldNotChangeRole'),
    };
  }
}

/** Owner only: hand the group and its playlist to another member; you stay as admin. */
export async function transferArtistGroup(
  slug: string,
  username: string,
): Promise<Result> {
  if (isForceMock()) {
    return mockTransferGroup(slug, username);
  }
  try {
    await requestJson(`${groupPath(slug)}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch55.couldNotHandOverGroup'),
    };
  }
}
