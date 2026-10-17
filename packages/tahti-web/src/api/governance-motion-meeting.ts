import { requestJson } from './client-request';
import { isForceMock } from './mode';

export type LinkResult = { ok: true } | { ok: false; error: string };

function errorText(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/** Board only: the meeting that takes the motion up, or null to unlink.
 * Changing the meeting drops an agenda item of the old one. */
export async function linkMotionMeeting(
  motionId: string,
  meetingId: string | null,
): Promise<LinkResult> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/v1/governance/motions/${encodeURIComponent(motionId)}/meeting`,
      { method: 'PUT', body: JSON.stringify({ meetingId }) },
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not change the meeting') };
  }
}

/** Board only: the item on the linked meeting's agenda that takes the motion
 * up, or null to unlink the item and keep the meeting. */
export async function linkMotionAgendaItem(
  motionId: string,
  agendaItemId: string | null,
): Promise<LinkResult> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/v1/governance/motions/${encodeURIComponent(motionId)}/agenda-item`,
      { method: 'PUT', body: JSON.stringify({ agendaItemId }) },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: errorText(err, 'Could not change the agenda item'),
    };
  }
}
