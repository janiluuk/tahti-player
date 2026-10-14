import { afterEach, describe, expect, it, vi } from 'vitest';

import { removeMotionComment } from './governance-comments';
import { fetchMotionComments } from './governance-member';

describe('removeMotionComment', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('deletes the comment under its motion', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(removeMotionComment('m1', '42')).resolves.toEqual({
      ok: true,
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/v1/governance/motions/m1/comments/42');
    expect(init.method).toBe('DELETE');
  });

  it("passes on the API's reason", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'This motion is closed; its discussion is kept',
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    await expect(removeMotionComment('m1', '42')).resolves.toEqual({
      ok: false,
      error: 'This motion is closed; its discussion is kept',
    });
  });

  it('keeps a removed comment in its place in the mock app', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');

    await expect(removeMotionComment('motion-5', 'c5')).resolves.toEqual({
      ok: true,
    });
    const { data } = await fetchMotionComments('motion-5');
    expect(data[0]).toMatchObject({ id: 'c5', body: '', removed: true });
  });
});
