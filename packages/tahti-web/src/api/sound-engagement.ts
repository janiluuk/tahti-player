import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type SoundEngagementKind = 'like';

export type SoundEngagement = { active: boolean; count: number };

const KEYS: Record<SoundEngagementKind, { active: string; count: string }> = {
  like: { active: 'liked', count: 'likeCount' },
};

const mockState = new Map<string, SoundEngagement>();

const path = (kind: SoundEngagementKind, slug: string, soundId: string) =>
  `/api/v1/c/${encodeURIComponent(slug)}/sounds/${encodeURIComponent(soundId)}/${kind}`;

const parse = (
  kind: SoundEngagementKind,
  data: Record<string, unknown>,
): SoundEngagement => ({
  active: data[KEYS[kind].active] === true,
  count: Number(data[KEYS[kind].count] ?? 0),
});

/** Public count plus whether the signed-in listener has done it. */
export async function fetchSoundEngagement(
  kind: SoundEngagementKind,
  slug: string,
  soundId: string,
): Promise<SoundEngagement | null> {
  if (isForceMock()) {
    return mockState.get(`${kind}:${soundId}`) ?? { active: false, count: 0 };
  }
  try {
    const { data } = await requestJson<Record<string, unknown>>(
      path(kind, slug, soundId),
    );
    return parse(kind, data);
  } catch {
    return null;
  }
}

export async function setSoundEngagement(
  kind: SoundEngagementKind,
  slug: string,
  soundId: string,
  active: boolean,
): Promise<{ ok: true; data: SoundEngagement } | { ok: false; error: string }> {
  if (isForceMock()) {
    const prev = mockState.get(`${kind}:${soundId}`) ?? {
      active: false,
      count: 0,
    };
    const next = {
      active,
      count: Math.max(
        0,
        prev.count + (active === prev.active ? 0 : active ? 1 : -1),
      ),
    };
    mockState.set(`${kind}:${soundId}`, next);
    return { ok: true, data: next };
  }
  try {
    const { data } = await requestJson<Record<string, unknown>>(
      path(kind, slug, soundId),
      { method: active ? 'POST' : 'DELETE' },
    );
    return { ok: true, data: parse(kind, data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save that',
    };
  }
}
