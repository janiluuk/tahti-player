import { requestJson } from './client-request';
import {
  fetchGovernanceMotion,
  patchGovernanceMotion,
  removeMockMotion,
  updateMockMotion,
} from './governance-member';
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

export async function editMotionDraft(
  id: string,
  input: { title: string; description: string },
): Promise<
  { ok: true; secondsCleared: number } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const current = await fetchGovernanceMotion(id);
    if (
      current.ok &&
      current.data.title === input.title &&
      current.data.description === input.description
    ) {
      return { ok: true, secondsCleared: 0 };
    }
    const patched = await patchGovernanceMotion(id, input);
    if (!patched.ok) {
      return patched;
    }
    let secondsCleared = 0;
    updateMockMotion(id, (m) => {
      secondsCleared = m.secondCount ?? 0;
      return { ...m, secondCount: 0, youSeconded: false };
    });
    return { ok: true, secondsCleared };
  }
  try {
    const { data } = await requestJson<{ secondsCleared: number }>(
      `/api/v1/governance/motions/${encodeURIComponent(id)}/draft`,
      { method: 'PUT', body: JSON.stringify(input) },
    );
    return { ok: true, secondsCleared: data.secondsCleared ?? 0 };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save the draft',
    };
  }
}
