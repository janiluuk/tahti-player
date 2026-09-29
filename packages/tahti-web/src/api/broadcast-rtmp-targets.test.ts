import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createRtmpTarget,
  deleteRtmpTarget,
  fetchRtmpTargets,
  patchRtmpTarget,
  testRtmpTarget,
} from './broadcast';

describe('RTMP targets', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the artist routes by default and the Tahti Radio routes for the radio scope', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () => new Response(JSON.stringify([]), { status: 200 }),
      );
    await fetchRtmpTargets();
    await fetchRtmpTargets('radio');
    await createRtmpTarget({ provider: 'YOUTUBE', streamKey: 'k' }, 'radio');
    await patchRtmpTarget('t1', { enabled: false }, 'radio');
    await testRtmpTarget('t1', 'radio');
    await deleteRtmpTarget('t1', 'radio');
    expect(
      fetchSpy.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET']),
    ).toEqual([
      ['/tahti-api/api/me/rtmp-targets', 'GET'],
      ['/tahti-api/api/admin/radio/rtmp-targets', 'GET'],
      ['/tahti-api/api/admin/radio/rtmp-targets', 'POST'],
      ['/tahti-api/api/admin/radio/rtmp-targets/t1', 'PATCH'],
      ['/tahti-api/api/admin/radio/rtmp-targets/t1/test', 'POST'],
      ['/tahti-api/api/admin/radio/rtmp-targets/t1', 'DELETE'],
    ]);
  });
});
