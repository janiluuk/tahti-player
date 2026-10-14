import { requestJson } from './client-request';
import { updateMockMotionComments } from './governance-member';
import { isForceMock } from './mode';

export async function removeMotionComment(
  motionId: string,
  commentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    let found = false;
    updateMockMotionComments(motionId, (comments) =>
      comments.map((c) => {
        if (c.id !== commentId) {
          return c;
        }
        found = true;
        return { ...c, body: '', removed: true };
      }),
    );
    return found ? { ok: true } : { ok: false, error: 'Comment not found' };
  }
  try {
    await requestJson(
      `/api/v1/governance/motions/${encodeURIComponent(motionId)}/comments/${encodeURIComponent(commentId)}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not remove the comment',
    };
  }
}
