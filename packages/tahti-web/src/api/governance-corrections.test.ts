import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  requestCorrection,
  withdrawCorrection,
} from './governance-corrections';

describe('requestCorrection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the subject and trimmed details', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'c1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await requestCorrection({
      subject: 'GOVERNANCE_RECORD',
      details: '  The minutes list the wrong date.  ',
    });
    expect(result.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/v1/governance/corrections');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      subject: 'GOVERNANCE_RECORD',
      details: 'The minutes list the wrong date.',
    });
  });
});

describe('withdrawCorrection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deletes the request and passes on the API's refusal", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'This request is no longer waiting for an answer',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(withdrawCorrection('c 1')).resolves.toEqual({
      ok: false,
      error: 'This request is no longer waiting for an answer',
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/v1/governance/corrections/c%201');
    expect(init.method).toBe('DELETE');
  });
});
