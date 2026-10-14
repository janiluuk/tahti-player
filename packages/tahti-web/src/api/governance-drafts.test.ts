import { afterEach, describe, expect, it, vi } from 'vitest';

import { withdrawMotionDraft } from './governance-drafts';
import { fetchGovernanceMotion } from './governance-member';

describe('withdrawMotionDraft', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('deletes the draft', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(withdrawMotionDraft('m1')).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/api\/v1\/governance\/motions\/m1$/);
    expect(init.method).toBe('DELETE');
  });

  it("passes on the API's reason", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'Only the proposer can withdraw a motion',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    await expect(withdrawMotionDraft('m1')).resolves.toEqual({
      ok: false,
      error: 'Only the proposer can withdraw a motion',
    });
  });

  it('removes the draft in the mock app', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');

    await expect(withdrawMotionDraft('motion-5')).resolves.toEqual({
      ok: true,
    });
    await expect(fetchGovernanceMotion('motion-5')).resolves.toMatchObject({
      ok: false,
    });
  });
});
