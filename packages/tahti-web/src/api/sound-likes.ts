import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type SoundLikeState = { liked: boolean; likeCount: number };

export type SoundLikeResult =
  { ok: true; data: SoundLikeState } | { ok: false; error: string };

const mockLikes = new Map<string, SoundLikeState>();

function likePath(channelSlug: string, soundId: string): string {
  return `/api/v1/c/${encodeURIComponent(channelSlug)}/sounds/${encodeURIComponent(soundId)}/like`;
}

/** Like (or unlike) a track. Answers the new state and the public count. */
export async function setSoundLiked(
  channelSlug: string,
  soundId: string,
  liked: boolean,
  currentCount = 0,
): Promise<SoundLikeResult> {
  if (isForceMock()) {
    const key = `${channelSlug}/${soundId}`;
    const prev = mockLikes.get(key) ?? {
      liked: !liked,
      likeCount: currentCount,
    };
    const next = {
      liked,
      likeCount: Math.max(
        0,
        prev.likeCount + (liked === prev.liked ? 0 : liked ? 1 : -1),
      ),
    };
    mockLikes.set(key, next);
    return { ok: true, data: next };
  }
  try {
    const { data } = await requestJson<SoundLikeState>(
      likePath(channelSlug, soundId),
      { method: liked ? 'POST' : 'DELETE' },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not update the like',
    };
  }
}
