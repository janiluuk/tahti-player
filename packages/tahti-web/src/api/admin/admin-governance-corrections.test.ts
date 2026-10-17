import { afterEach, describe, expect, it, vi } from 'vitest';

import { answerAdminCorrection } from './admin-governance-corrections';

describe('answerAdminCorrection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('patches the state and trimmed note', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await answerAdminCorrection('c 1', {
      state: 'REJECTED',
      resolutionNote: '  The minutes are right.  ',
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/admin/governance/corrections/c%201');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({
      state: 'REJECTED',
      resolutionNote: 'The minutes are right.',
    });
  });

  it('needs a note before asking the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      answerAdminCorrection('c1', { state: 'ACCEPTED', resolutionNote: ' ' }),
    ).resolves.toEqual({
      ok: false,
      error: 'Tell the member what was decided',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
