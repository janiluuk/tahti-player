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
