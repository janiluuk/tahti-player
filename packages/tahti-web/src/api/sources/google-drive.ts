import { isForceMock } from '.././mode';
import { requestJson, RequestJsonError } from '.././request-json';

/** `GET /api/me/google-drive/picker-config`: a short-lived Drive token plus
 * the Picker keys. */
export type GoogleDrivePickerConfig = {
  clientId: string;
  developerKey: string;
  accessToken: string;
};

export type GoogleDrivePickedFile = {
  fileId: string;
  name: string;
  mimeType?: string;
};

/** The API takes at most this many files per import request. */
export const GOOGLE_DRIVE_IMPORT_MAX_FILES = 20;

export type GoogleDrivePickerConfigResult =
  | { ok: true; data: GoogleDrivePickerConfig }
  | {
      ok: false;
      reason: 'not-configured' | 'not-connected' | 'failed';
      error: string;
    };

export async function fetchGoogleDrivePickerConfig(): Promise<GoogleDrivePickerConfigResult> {
  if (isForceMock()) {
    return {
      ok: false,
      reason: 'not-configured',
      error: 'Google Drive picking isn’t available in demo mode.',
    };
  }
  try {
    const { data } = await requestJson<GoogleDrivePickerConfig>(
      '/api/me/google-drive/picker-config',
    );
    return { ok: true, data };
  } catch (err) {
    if (err instanceof RequestJsonError && err.status === 503) {
      return {
        ok: false,
        reason: 'not-configured',
        error: 'Google Drive picking isn’t set up on this server yet.',
      };
    }
    if (
      err instanceof RequestJsonError &&
      err.code === 'PROVIDER_NOT_CONNECTED'
    ) {
      return {
        ok: false,
        reason: 'not-connected',
        error: 'Your Google Drive connection expired. Connect again.',
      };
    }
    return {
      ok: false,
      reason: 'failed',
      error:
        err instanceof Error ? err.message : 'Could not open Google Drive.',
    };
  }
}

/** Queues the picked files as cloud-import jobs, in batches the API accepts.
 * Progress shows in the Upload page's import panel. */
export async function importGoogleDriveFiles(
  files: GoogleDrivePickedFile[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, count: files.length };
  }
  let queued = 0;
  try {
    for (
      let start = 0;
      start < files.length;
      start += GOOGLE_DRIVE_IMPORT_MAX_FILES
    ) {
      const batch = files.slice(start, start + GOOGLE_DRIVE_IMPORT_MAX_FILES);
      await requestJson('/api/me/google-drive/import', {
        method: 'POST',
        body: JSON.stringify({ files: batch }),
      });
      queued += batch.length;
    }
    return { ok: true, count: queued };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Import failed';
    return {
      ok: false,
      error: queued > 0 ? `Queued ${queued}, then: ${reason}` : reason,
    };
  }
}
