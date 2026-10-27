import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchGoogleDrivePickerConfig,
  GOOGLE_DRIVE_IMPORT_MAX_FILES,
  importGoogleDriveFiles,
} from './google-drive';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe('google drive import', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the Picker config', async () => {
    const config = { clientId: 'c', developerKey: 'k', accessToken: 't' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(config));

    await expect(fetchGoogleDrivePickerConfig()).resolves.toEqual({
      ok: true,
      data: config,
    });
  });

  it('tells a server without Picker keys from an expired connection', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        json({ error: 'Google Drive Picker is not configured' }, 503),
      )
      .mockResolvedValueOnce(
        json(
          {
            error: 'Google Drive account not connected',
            code: 'PROVIDER_NOT_CONNECTED',
          },
          403,
        ),
      );

    await expect(fetchGoogleDrivePickerConfig()).resolves.toMatchObject({
      ok: false,
      reason: 'not-configured',
    });
    await expect(fetchGoogleDrivePickerConfig()).resolves.toMatchObject({
      ok: false,
      reason: 'not-connected',
    });
  });

  it('queues picked files in batches the API accepts', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => json({ imports: [] }, 202));
    const files = Array.from(
      { length: GOOGLE_DRIVE_IMPORT_MAX_FILES + 1 },
      (_, index) => ({ fileId: `f${index}`, name: `track-${index}.mp3` }),
    );

    await expect(importGoogleDriveFiles(files)).resolves.toEqual({
      ok: true,
      count: files.length,
    });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(String(spy.mock.calls[0]![0])).toMatch(
      /\/api\/me\/google-drive\/import$/,
    );
    const firstBody = JSON.parse(String(spy.mock.calls[0]![1]!.body)) as {
      files: unknown[];
    };
    expect(firstBody.files).toHaveLength(GOOGLE_DRIVE_IMPORT_MAX_FILES);
  });

  it('says how many were queued before a later batch failed', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ imports: [] }, 202))
      .mockResolvedValueOnce(json({ error: 'Channel not found' }, 404));
    const files = Array.from(
      { length: GOOGLE_DRIVE_IMPORT_MAX_FILES + 1 },
      (_, index) => ({ fileId: `f${index}`, name: `track-${index}.mp3` }),
    );

    await expect(importGoogleDriveFiles(files)).resolves.toEqual({
      ok: false,
      error: `Queued ${GOOGLE_DRIVE_IMPORT_MAX_FILES}, then: Channel not found`,
    });
  });
});
