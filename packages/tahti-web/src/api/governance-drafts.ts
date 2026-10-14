import { requestJson } from './client-request';
import { removeMockMotion } from './governance-member';
import { isForceMock } from './mode';

export async function withdrawMotionDraft(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const motion = removeMockMotion(id);
    if (!motion) {
      return { ok: false, error: 'Motion not found' };
    }
    return { ok: true };
  }
  try {
    await requestJson(`/api/v1/governance/motions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not withdraw the motion',
    };
  }
}
