import { afterEach, describe, expect, it, vi } from 'vitest';

import { editMotionDraft, withdrawMotionDraft } from './governance-drafts';
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

describe('editMotionDraft', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('puts the new text and reports the seconds it cleared', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: 'm1', state: 'DRAFT', secondsCleared: 2 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      editMotionDraft('m1', { title: 'New', description: 'Text' }),
    ).resolves.toEqual({ ok: true, secondsCleared: 2 });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/v1/governance/motions/m1/draft');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({
      title: 'New',
      description: 'Text',
    });
  });

  it('clears seconds in the mock app only when the text changes', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    const before = await fetchGovernanceMotion('motion-1');
    if (!before.ok) {
      throw new Error('mock motion missing');
    }

    await expect(
      editMotionDraft('motion-1', {
        title: before.data.title,
        description: before.data.description,
      }),
    ).resolves.toEqual({ ok: true, secondsCleared: 0 });
    await expect(
      editMotionDraft('motion-1', {
        title: 'A new title',
        description: before.data.description,
      }),
    ).resolves.toMatchObject({ ok: true });
    const after = await fetchGovernanceMotion('motion-1');
    expect(after).toMatchObject({
      ok: true,
      data: { title: 'A new title', secondCount: 0 },
    });
  });
});
