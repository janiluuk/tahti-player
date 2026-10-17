import { requestJson } from './client-request';
import { isForceMock } from './mode';

const mockCirculated = new Set<string>();

/** Board only: tell members a draft is waiting for seconds. A draft is
 * circulated once; the answer says how many members were told. */
export async function circulateMotion(
  motionId: string,
): Promise<{ ok: true; notified: number } | { ok: false; error: string }> {
  if (isForceMock()) {
    if (mockCirculated.has(motionId)) {
      return { ok: false, error: 'This draft has already been circulated' };
    }
    mockCirculated.add(motionId);
    return { ok: true, notified: 41 };
  }
  try {
    const { data } = await requestJson<{ notified: number }>(
      `/api/v1/governance/motions/${encodeURIComponent(motionId)}/circulate`,
      { method: 'POST' },
    );
    return { ok: true, notified: data.notified };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not circulate the draft',
    };
  }
}
