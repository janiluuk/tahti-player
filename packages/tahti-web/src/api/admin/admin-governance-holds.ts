import { sendJson } from '../http';
import { isForceMock } from '../mode';

export type HoldableRecord = 'meeting' | 'document' | 'resolution';

const PATHS: Record<HoldableRecord, (id: string) => string> = {
  meeting: (id) =>
    `/api/admin/governance/meetings/${encodeURIComponent(id)}/legal-hold`,
  document: (id) =>
    `/api/admin/governance/documents/${encodeURIComponent(id)}/legal-hold`,
  resolution: (id) =>
    `/api/admin/resolutions/${encodeURIComponent(id)}/legal-hold`,
};

/** Puts a governance record under a legal hold with the reason, or with
 * `reason: null` releases it. While held the record cannot be changed. */
export async function setRecordLegalHold(
  kind: HoldableRecord,
  id: string,
  reason: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = reason?.trim() || null;
  if (reason !== null && !trimmed) {
    return { ok: false, error: 'Give the reason for the hold' };
  }
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await sendJson(
      PATHS[kind](id),
      trimmed ? 'PUT' : 'DELETE',
      trimmed ? { reason: trimmed } : undefined,
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not change the legal hold',
    };
  }
}
