import { afterEach, describe, expect, it, vi } from 'vitest';

import { setUserStorageQuota } from './admin-storage';

describe('setUserStorageQuota', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('patches /api/admin/storage/users/:id/quota with the byte target', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(setUserStorageQuota('u1', 5_000_000)).resolves.toEqual({
      ok: true,
    });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toMatch(/\/api\/admin\/storage\/users\/u1\/quota$/);
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual({ quotaBytes: 5_000_000 });
  });
});
