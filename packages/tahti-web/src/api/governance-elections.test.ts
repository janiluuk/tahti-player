import { afterEach, describe, expect, it, vi } from 'vitest';

import { standForElection, withdrawCandidacy } from './governance-elections';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('election candidacy', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stands with a trimmed statement', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 201));
    vi.stubGlobal('fetch', fetchMock);
    await expect(standForElection('e 1', '  Hello  ')).resolves.toEqual({
      ok: true,
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain(
      '/api/v1/governance/elections/e%201/candidacy',
    );
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ statement: 'Hello' });
  });

  it('stands without a statement when it is blank', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 201));
    vi.stubGlobal('fetch', fetchMock);
    await standForElection('e1', '   ');
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({});
  });

  it('withdraws with DELETE and passes on a refusal', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ error: 'The result of this election is recorded' }, 409),
      );
    vi.stubGlobal('fetch', fetchMock);
    await expect(withdrawCandidacy('e1')).resolves.toEqual({
      ok: false,
      error: 'The result of this election is recorded',
    });
    expect(fetchMock.mock.calls[0]![1].method).toBe('DELETE');
  });
});
