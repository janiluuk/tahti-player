import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type HearthisExportStatus =
  'pending' | 'submitted' | 'delivered' | 'failed';

/** Queue a copy of the track to the artist's own hearthis.at account (needs
 * the hearthis.at export plugin). Only confirms the job was queued. */
export async function exportSoundToHearthis(
  soundId: string,
): Promise<
  { ok: true; status: HearthisExportStatus } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, status: 'pending' };
  }
  try {
    const { data } = await requestJson<{
      hearthisExportStatus: HearthisExportStatus;
    }>(`/api/me/sound/${encodeURIComponent(soundId)}/export/hearthis`, {
      method: 'POST',
    });
    return { ok: true, status: data.hearthisExportStatus ?? 'pending' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not start the export',
    };
  }
}
