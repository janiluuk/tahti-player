import { isForceMock } from './mode';
import { requestJson } from './request-json';

/** Delete a track or channel comment — allowed for its author and for the
 * owner of the track or channel it's on. */
export async function deleteComment(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(`/api/comments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not delete comment',
    };
  }
}
