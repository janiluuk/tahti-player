import { isForceMock } from '../mode';
import { mockSoundStore } from './studio-mock';
import { requestJson } from './studio-request';

/** Queues processing again for a sound whose upload failed (status ERROR). */
export async function retrySoundProcessing(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const item = mockSoundStore.find((sound) => sound.id === id);
    if (!item || item.status !== 'ERROR') {
      return { ok: false, error: 'Only a failed upload can be retried.' };
    }
    item.status = 'PENDING';
    item.processingError = null;
    return { ok: true };
  }
  try {
    await requestJson<{ id: string; status: 'PENDING' }>(
      `/api/me/sound/${encodeURIComponent(id)}/retry-processing`,
      { method: 'POST' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not retry processing.',
    };
  }
}
