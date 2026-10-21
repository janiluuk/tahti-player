import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAdminBoardTerm } from './admin-governance-board';

describe('createAdminBoardTerm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the term without the display name', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 't1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      createAdminBoardTerm({
        userId: 'u7',
        displayName: 'Liis Kask',
        role: 'TREASURER',
        termStart: '2027-01-01',
        termEnd: '2028-12-31',
      }),
    ).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/admin/governance/board-terms');
    expect(JSON.parse(init.body)).toEqual({
      userId: 'u7',
      role: 'TREASURER',
      termStart: '2027-01-01',
      termEnd: '2028-12-31',
    });
  });

  it('refuses a term that ends before it starts without asking the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      createAdminBoardTerm({
        userId: 'u7',
        displayName: 'Liis Kask',
        role: 'MEMBER',
        termStart: '2027-01-01',
        termEnd: '2026-01-01',
      }),
    ).resolves.toEqual({
      ok: false,
      error: 'The term must end after it starts',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
