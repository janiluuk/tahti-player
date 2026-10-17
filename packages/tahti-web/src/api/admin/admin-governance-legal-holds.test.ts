import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchGovernanceLegalHolds } from './admin-governance-legal-holds';

describe('fetchGovernanceLegalHolds', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('narrows by kind with a comma list', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await fetchGovernanceLegalHolds(['MEETING', 'DOCUMENT']);
    expect(String(fetchMock.mock.calls[0]![0])).toContain(
      '/api/admin/governance/legal-holds?kind=MEETING,DOCUMENT',
    );
  });
});
