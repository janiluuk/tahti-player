import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchMotionSeconders } from './governance-motion-detail';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('fetchMotionSeconders', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('reads who seconded the motion', async () => {
    const rows = [
      {
        displayName: 'Aino',
        username: 'aino',
        secondedAt: '2026-10-14T08:00:00.000Z',
      },
    ];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(rows));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchMotionSeconders('m1')).resolves.toMatchObject({
      data: rows,
    });
    expect(String(fetchMock.mock.calls[0]![0])).toContain(
      '/api/v1/governance/motions/m1/seconds',
    );
  });

  it('returns an empty list when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ error: 'Motion not found' }, 404)),
    );

    await expect(fetchMotionSeconders('m1')).resolves.toMatchObject({
      data: [],
    });
  });

  it('has a seconder for the draft in the mock app', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');

    const { data } = await fetchMotionSeconders('motion-5');
    expect(data.map((s) => s.username)).toEqual(['kaiku']);
  });
});
