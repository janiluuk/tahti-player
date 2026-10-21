import { requestJson } from './client-request';
import { updateMockMotion } from './governance-member';
import { isForceMock } from './mode';

export type MotionSecondResult =
  { ok: true; secondCount: number } | { ok: false; error: string };

function secondPath(id: string): string {
  return `/api/v1/governance/motions/${encodeURIComponent(id)}/second`;
}

function mockSecond(id: string, seconded: boolean): MotionSecondResult {
  const motion = updateMockMotion(id, (m) => {
    if (Boolean(m.youSeconded) === seconded) {
      return m;
    }
    const count = (m.secondCount ?? 0) + (seconded ? 1 : -1);
    return { ...m, youSeconded: seconded, secondCount: Math.max(0, count) };
  });
  if (!motion) {
    return { ok: false, error: 'Motion not found' };
  }
  if (motion.state !== 'DRAFT') {
    return { ok: false, error: 'Only a draft motion can be seconded' };
  }
  return { ok: true, secondCount: motion.secondCount ?? 0 };
}

export async function secondMotion(id: string): Promise<MotionSecondResult> {
  if (isForceMock()) {
    return mockSecond(id, true);
  }
  try {
    const { data } = await requestJson<{ secondCount: number }>(
      secondPath(id),
      { method: 'POST' },
    );
    return { ok: true, secondCount: data.secondCount };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not second the motion',
    };
  }
}

export async function withdrawMotionSecond(
  id: string,
): Promise<MotionSecondResult> {
  if (isForceMock()) {
    return mockSecond(id, false);
  }
  try {
    const { data } = await requestJson<{ secondCount: number }>(
      secondPath(id),
      { method: 'DELETE' },
    );
    return { ok: true, secondCount: data.secondCount };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not withdraw your second',
    };
  }
}
