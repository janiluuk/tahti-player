import { i18n } from '@tahti-player/i18n';

import type { FetchMeta } from './client';
import {
  mockApproveSubmission,
  mockCreateGroup,
  mockFetchMyGroups,
  mockFetchPublicGroup,
  mockFetchPublicGroups,
  mockGroupMembership,
  mockJoinGroup,
  mockLeaveGroup,
  mockPatchGroup,
  mockRejectSubmission,
  mockResolveJoinRequest,
  mockSubmitGroupSound,
} from './groups-mock';
import {
  allowMockFallback,
  apiErrorMeta,
  isForceMock,
  mockFallbackMeta,
} from './mode';
import { requestJson } from './request-json';

export type ArtistGroupRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type GroupJoinPolicy = 'OPEN' | 'REQUEST';
export type GroupSubmitPolicy = 'OPEN' | 'APPROVE';

export type ArtistGroupSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  joinPolicy: GroupJoinPolicy;
  submitPolicy: GroupSubmitPolicy;
  collectionSlug: string;
  memberCount: number;
  itemCount: number;
};

export type MyArtistGroup = ArtistGroupSummary & {
  role: ArtistGroupRole;
  pendingJoinRequestCount: number;
  pendingSubmissionCount: number;
};

export type GroupMembershipEntry = {
  id: string;
  slug: string;
  name: string;
  coverUrl: string | null;
  isPublic: boolean;
  submitPolicy: GroupSubmitPolicy;
  role: ArtistGroupRole;
  collectionSlug: string;
  itemCount: number;
  member: boolean;
  itemId: string | null;
  submissionPending: boolean;
};

export type PublicGroupDetail = ArtistGroupSummary & {
  createdBy: { username: string; displayName: string };
  members: { username: string; displayName: string; role: ArtistGroupRole }[];
  viewer: { role: ArtistGroupRole | null; joinRequestPending: boolean };
};

export type GroupJoinRequest = {
  id: string;
  user: { username: string; displayName: string };
  createdAt: string;
};

export type GroupSoundSubmission = {
  id: string;
  note: string | null;
  createdAt: string;
  sound: { id: string; title: string };
  submittedBy: { username: string; displayName: string };
};

export async function fetchMyGroups(): Promise<{
  data: MyArtistGroup[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockFetchMyGroups(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<MyArtistGroup[]>('/api/me/groups');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockFetchMyGroups(), meta: mockFallbackMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function createArtistGroup(input: {
  name: string;
  description?: string;
  isPublic?: boolean;
  joinPolicy?: GroupJoinPolicy;
  submitPolicy?: GroupSubmitPolicy;
}): Promise<{ ok: true; data: MyArtistGroup } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, data: mockCreateGroup(input) };
  }
  try {
    const { data } = await requestJson<MyArtistGroup>('/api/me/groups', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch52.couldNotCreateGroup'),
    };
  }
}

export async function patchArtistGroup(
  slug: string,
  patch: Partial<{
    name: string;
    description: string | null;
    coverUrl: string | null;
    isPublic: boolean;
    joinPolicy: GroupJoinPolicy;
    submitPolicy: GroupSubmitPolicy;
  }>,
): Promise<{ ok: true; data: MyArtistGroup } | { ok: false; error: string }> {
  if (isForceMock()) {
    const data = mockPatchGroup(slug, patch);
    return data
      ? { ok: true, data }
      : { ok: false, error: i18n.t('web:batch53.groupNotFound') };
  }
  try {
    const { data } = await requestJson<MyArtistGroup>(
      `/api/me/groups/${encodeURIComponent(slug)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotUpdateGroup'),
    };
  }
}

export async function deleteArtistGroup(
  slug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/groups/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotDeleteGroup'),
    };
  }
}

export async function joinArtistGroup(
  slug: string,
): Promise<
  { ok: true; joined: boolean; pending: boolean } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return mockJoinGroup(slug);
  }
  try {
    const res = await requestJson<{ status?: string }>(
      `/api/me/groups/${encodeURIComponent(slug)}/join`,
      { method: 'POST' },
    );
    return {
      ok: true,
      joined: res.data.status === 'JOINED' || res.status === 201,
      pending: res.data.status === 'REQUESTED' || res.status === 202,
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotJoinGroup'),
    };
  }
}

export async function leaveArtistGroup(
  slug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return mockLeaveGroup(slug);
  }
  try {
    await requestJson(`/api/me/groups/${encodeURIComponent(slug)}/members/me`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotLeaveGroup'),
    };
  }
}

export async function fetchSoundGroupMembership(
  soundId: string,
): Promise<{ data: GroupMembershipEntry[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockGroupMembership(soundId),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<GroupMembershipEntry[]>(
      `/api/me/sound/${encodeURIComponent(soundId)}/group-membership`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: mockGroupMembership(soundId),
        meta: mockFallbackMeta(err),
      };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function submitGroupSound(
  slug: string,
  soundId: string,
  note?: string,
): Promise<
  | { ok: true; added: boolean; pending: boolean; itemId: string | null }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    return mockSubmitGroupSound(slug, soundId);
  }
  try {
    const res = await requestJson<{
      status?: string;
      item?: { id?: string };
      itemId?: string;
    }>(`/api/me/groups/${encodeURIComponent(slug)}/sounds`, {
      method: 'POST',
      body: JSON.stringify({ soundId, note }),
    });
    const pending = res.data.status === 'PENDING' || res.status === 202;
    return {
      ok: true,
      added: !pending,
      pending,
      itemId: res.data.itemId ?? res.data.item?.id ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotSubmitTrack'),
    };
  }
}

export async function fetchPublicGroups(query?: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  data: { items: ArtistGroupSummary[]; total: number };
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockFetchPublicGroups(query?.q),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const params = new URLSearchParams();
    if (query?.q) {
      params.set('q', query.q);
    }
    if (query?.limit != null) {
      params.set('limit', String(query.limit));
    }
    if (query?.offset != null) {
      params.set('offset', String(query.offset));
    }
    const qs = params.toString();
    const { data } = await requestJson<{
      items: ArtistGroupSummary[];
      total: number;
    }>('/api/v1/groups' + (qs ? `?${qs}` : ''));
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return {
        data: mockFetchPublicGroups(query?.q),
        meta: mockFallbackMeta(err),
      };
    }
    return { data: { items: [], total: 0 }, meta: apiErrorMeta(err) };
  }
}

export async function fetchPublicGroup(
  slug: string,
): Promise<{ data: PublicGroupDetail | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockFetchPublicGroup(slug),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PublicGroupDetail>(
      `/api/v1/groups/${encodeURIComponent(slug)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockFetchPublicGroup(slug), meta: mockFallbackMeta(err) };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function fetchGroupJoinRequests(
  slug: string,
): Promise<{ data: GroupJoinRequest[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<GroupJoinRequest[]>(
      `/api/me/groups/${encodeURIComponent(slug)}/join-requests`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function resolveGroupJoinRequest(
  slug: string,
  requestId: string,
  action: 'APPROVE' | 'REJECT',
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return mockResolveJoinRequest();
  }
  try {
    await requestJson(
      `/api/me/groups/${encodeURIComponent(slug)}/join-requests/${encodeURIComponent(requestId)}/resolve`,
      { method: 'POST', body: JSON.stringify({ action }) },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotResolveRequest'),
    };
  }
}

export async function fetchGroupSubmissions(
  slug: string,
): Promise<{ data: GroupSoundSubmission[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return { data: [], meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const { data } = await requestJson<GroupSoundSubmission[]>(
      `/api/me/groups/${encodeURIComponent(slug)}/submissions`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function approveGroupSubmission(
  slug: string,
  submissionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return mockApproveSubmission();
  }
  try {
    await requestJson(
      `/api/me/groups/${encodeURIComponent(slug)}/submissions/${encodeURIComponent(submissionId)}/approve`,
      { method: 'POST' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotApprove'),
    };
  }
}

export async function rejectGroupSubmission(
  slug: string,
  submissionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return mockRejectSubmission();
  }
  try {
    await requestJson(
      `/api/me/groups/${encodeURIComponent(slug)}/submissions/${encodeURIComponent(submissionId)}/reject`,
      { method: 'POST' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : i18n.t('web:batch53.couldNotReject'),
    };
  }
}
