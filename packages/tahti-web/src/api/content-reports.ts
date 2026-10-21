import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type ContentReportTarget =
  'SOUND_ITEM' | 'RELEASE' | 'CHANNEL' | 'COLLECTION' | 'COMMENT';

export type ContentReportReason =
  'COPYRIGHT' | 'HARASSMENT' | 'SPAM' | 'ILLEGAL_CONTENT' | 'OTHER';

/** Flag something for the board's moderation queue. No account needed. */
export async function submitContentReport(input: {
  targetType: ContentReportTarget;
  targetId: string;
  reason: ContentReportReason;
  details?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  const { details, ...target } = input;
  try {
    await requestJson('/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify({
        ...target,
        ...(details?.trim() ? { details: details.trim() } : {}),
      }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not send the report',
    };
  }
}
