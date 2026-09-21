import { isForceMock } from '.././mode';
import { requestJson } from '.././request-json';

export type TrackExportStatus = {
  status: string;
  url: string | null;
  error: string | null;
};

export async function fetchTrackExportStatus(
  soundId: string,
  target: 'mixcloud',
): Promise<TrackExportStatus | null> {
  if (isForceMock()) {
    return null;
  }
  try {
    const { data } = await requestJson<{
      status: string;
      mixcloudUrl: string | null;
      error: string | null;
    }>(
      `/api/me/sound/${encodeURIComponent(soundId)}/${encodeURIComponent(target)}`,
    );
    return {
      status: data.status,
      url: data.mixcloudUrl,
      error: data.error,
    };
  } catch {
    return null;
  }
}

export async function exportTrack(
  soundId: string,
  target: 'mixcloud',
): Promise<
  { ok: true; status: TrackExportStatus } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      status: { status: 'PENDING', url: null, error: null },
    };
  }
  try {
    const { data } = await requestJson<{ status: string }>(
      `/api/me/sound/${encodeURIComponent(soundId)}/${encodeURIComponent(target)}`,
      { method: 'POST' },
    );
    return {
      ok: true,
      status: { status: data.status, url: null, error: null },
    };
  } catch (err) {
    const existing = await fetchTrackExportStatus(soundId, target);
    if (existing) {
      return { ok: true, status: existing };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Export failed',
    };
  }
}
