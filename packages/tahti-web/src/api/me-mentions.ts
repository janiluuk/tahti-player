import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type MentionSurface =
  'BIO' | 'ANNOUNCEMENT' | 'RELEASE' | 'NEWSLETTER' | 'TRACKLIST' | 'CHAT';

export type Mention = {
  id: string;
  surface: MentionSurface;
  createdAt: string;
  mentioner: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

export type MentionSettings = {
  mentionsEnabled: boolean;
  publicMentionsEnabled: boolean;
  muted: { username: string; displayName: string }[];
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const SURFACE_LABELS: Record<MentionSurface, string> = {
  BIO: 'their bio',
  ANNOUNCEMENT: 'an announcement',
  RELEASE: 'a release',
  NEWSLETTER: 'a newsletter',
  TRACKLIST: 'a tracklist',
  CHAT: 'chat',
};

export function mentionSurfaceLabel(surface: string): string {
  return SURFACE_LABELS[surface as MentionSurface] ?? 'a post';
}

export function mentionerName(mentioner: Mention['mentioner']): string {
  const name = mentioner.displayName.trim();
  return name && !name.includes('@') ? name : mentioner.username;
}

export function normalizeHandle(value: string): string {
  return value.trim().replace(/^@/, '');
}

let mockSettings: MentionSettings = {
  mentionsEnabled: true,
  publicMentionsEnabled: false,
  muted: [],
};

function failure(err: unknown, fallback: string): { ok: false; error: string } {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

export async function fetchMentions(limit = 20): Promise<Result<Mention[]>> {
  if (isForceMock()) {
    return {
      ok: true,
      data: [
        {
          id: 'm1',
          surface: 'RELEASE',
          createdAt: '2026-09-28T18:00:00.000Z',
          mentioner: {
            username: 'aurora',
            displayName: 'Aurora',
            avatarUrl: null,
          },
        },
      ],
    };
  }
  try {
    const { data } = await requestJson<{ mentions: Mention[] }>(
      `/api/me/mentions?limit=${limit}`,
    );
    return { ok: true, data: data.mentions };
  } catch (err) {
    return failure(err, 'Could not load mentions');
  }
}

export async function fetchMentionSettings(): Promise<Result<MentionSettings>> {
  if (isForceMock()) {
    return {
      ok: true,
      data: { ...mockSettings, muted: [...mockSettings.muted] },
    };
  }
  try {
    const { data } = await requestJson<MentionSettings>(
      '/api/me/mentions/settings',
    );
    return { ok: true, data };
  } catch (err) {
    return failure(err, 'Could not load mention settings');
  }
}

export async function patchMentionSettings(
  patch: Partial<
    Pick<MentionSettings, 'mentionsEnabled' | 'publicMentionsEnabled'>
  >,
): Promise<
  Result<Pick<MentionSettings, 'mentionsEnabled' | 'publicMentionsEnabled'>>
> {
  if (isForceMock()) {
    mockSettings = { ...mockSettings, ...patch };
    return { ok: true, data: mockSettings };
  }
  try {
    const { data } = await requestJson<
      Pick<MentionSettings, 'mentionsEnabled' | 'publicMentionsEnabled'>
    >('/api/me/mentions/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return { ok: true, data };
  } catch (err) {
    return failure(err, 'Could not save');
  }
}

export async function setMentionMute(
  handle: string,
  muted: boolean,
): Promise<Result<string>> {
  const username = normalizeHandle(handle);
  if (!/^[\w.-]{1,32}$/.test(username)) {
    return { ok: false, error: 'Enter a Tahti username.' };
  }
  if (isForceMock()) {
    mockSettings = {
      ...mockSettings,
      muted: muted
        ? [...mockSettings.muted, { username, displayName: username }]
        : mockSettings.muted.filter((item) => item.username !== username),
    };
    return { ok: true, data: username };
  }
  try {
    await requestJson(`/api/me/mentions/mute/${encodeURIComponent(username)}`, {
      method: muted ? 'POST' : 'DELETE',
    });
    return { ok: true, data: username };
  } catch (err) {
    return failure(err, muted ? 'Could not mute' : 'Could not unmute');
  }
}
