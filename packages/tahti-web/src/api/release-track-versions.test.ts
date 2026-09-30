import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  activateReleaseTrackVersion,
  fetchReleaseTrackVersions,
} from './release-track-versions';

const V1 = {
  id: 'v1',
  versionNumber: 1,
  versionLabel: 'Original',
  status: 'READY',
  isActive: true,
  durationSec: 200,
  createdAt: '2026-09-01T12:00:00.000Z',
};

describe('release track versions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists a track's versions", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify([V1]), { status: 200 }));
    await expect(fetchReleaseTrackVersions('r1', 't1')).resolves.toMatchObject({
      data: [V1],
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/releases/r1/tracks/t1/versions',
    );
  });

  it('switches the active version and passes on the API error', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify([V1]), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Version is not ready yet' }), {
          status: 400,
        }),
      );
    await expect(
      activateReleaseTrackVersion('r1', 't1', 'v1'),
    ).resolves.toEqual({ ok: true, data: [V1] });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/releases/r1/tracks/t1/versions/v1/activate',
    );
    expect(fetchSpy.mock.calls[0]![1]!.method).toBe('POST');
    await expect(
      activateReleaseTrackVersion('r1', 't1', 'v2'),
    ).resolves.toEqual({ ok: false, error: 'Version is not ready yet' });
  });
});
