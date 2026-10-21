import { mockMembers } from './artist-settings/mock';
import type { ChannelMember } from './artist-settings/moderation';
import { isForceMock } from './mode';
import { requestJson } from './request-json';

type MemberResult =
  { ok: true; data: ChannelMember } | { ok: false; error: string };

const message = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export async function addChannelMember(input: {
  name: string;
  role: string;
}): Promise<MemberResult> {
  if (isForceMock()) {
    const member: ChannelMember = {
      id: `mock-member-${Date.now()}`,
      name: input.name,
      role: input.role,
      pictureUrl: null,
      position: mockMembers.length,
    };
    mockMembers.push(member);
    return { ok: true, data: member };
  }
  try {
    const { data } = await requestJson<ChannelMember>(
      '/api/me/channel/members',
      { method: 'POST', body: JSON.stringify(input) },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not add the person') };
  }
}

export async function updateChannelMember(
  id: string,
  patch: { name?: string; role?: string },
): Promise<MemberResult> {
  if (isForceMock()) {
    const member = mockMembers.find((item) => item.id === id);
    if (!member) {
      return { ok: false, error: 'Member not found' };
    }
    Object.assign(member, patch);
    return { ok: true, data: { ...member } };
  }
  try {
    const { data } = await requestJson<ChannelMember>(
      `/api/me/channel/members/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not save the changes') };
  }
}

export async function removeChannelMember(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const index = mockMembers.findIndex((item) => item.id === id);
    if (index >= 0) {
      mockMembers.splice(index, 1);
    }
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/channel/members/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not remove the person') };
  }
}

const MEMBER_PICTURE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function uploadChannelMemberPicture(
  id: string,
  file: File,
): Promise<{ ok: true; data: { url: string } } | { ok: false; error: string }> {
  const contentType = file.type || 'image/jpeg';
  if (!MEMBER_PICTURE_TYPES.includes(contentType)) {
    return { ok: false, error: 'Use JPEG, PNG, or WebP' };
  }
  if (isForceMock()) {
    const url = URL.createObjectURL(file);
    const member = mockMembers.find((item) => item.id === id);
    if (member) {
      member.pictureUrl = url;
    }
    return { ok: true, data: { url } };
  }
  const base = `/api/me/channel/members/${encodeURIComponent(id)}/picture`;
  try {
    const { data: prep } = await requestJson<{
      uploadKey: string;
      uploadUrl: string;
    }>(`${base}/prepare`, {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, contentType }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
    if (!put.ok) {
      throw new Error(`Upload failed (${put.status})`);
    }
    const { data } = await requestJson<{ url: string }>(`${base}/complete`, {
      method: 'POST',
      body: JSON.stringify({ uploadKey: prep.uploadKey }),
    });
    return { ok: true, data: { url: data.url } };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not upload the picture') };
  }
}

/** Needs tahti-org#577 (PATCH accepts `pictureUrl: null`). */
export async function clearChannelMemberPicture(
  id: string,
): Promise<MemberResult> {
  if (isForceMock()) {
    const member = mockMembers.find((item) => item.id === id);
    if (!member) {
      return { ok: false, error: 'Member not found' };
    }
    member.pictureUrl = null;
    return { ok: true, data: { ...member } };
  }
  try {
    const { data } = await requestJson<ChannelMember>(
      `/api/me/channel/members/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify({ pictureUrl: null }) },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not remove the picture') };
  }
}

/** Save the roster's display order (every member id, first to last). */
export async function reorderChannelMembers(
  ids: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockMembers.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    mockMembers.forEach((member, position) => {
      member.position = position;
    });
    return { ok: true };
  }
  try {
    await requestJson('/api/me/channel/members/reorder', {
      method: 'PUT',
      body: JSON.stringify({ ids }),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: message(err, 'Could not save the order') };
  }
}

/** A channel's public credits roster (`GET /api/channels/:slug/members`). */
export async function fetchPublicChannelMembers(
  slug: string,
): Promise<ChannelMember[]> {
  if (isForceMock()) {
    return [...mockMembers];
  }
  try {
    const { data } = await requestJson<ChannelMember[]>(
      `/api/channels/${encodeURIComponent(slug)}/members`,
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
