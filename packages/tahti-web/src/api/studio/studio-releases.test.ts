import { afterEach, describe, expect, it, vi } from 'vitest';

import { deleteStudioRelease, patchStudioRelease } from './studio-releases';

describe('patchStudioRelease', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the pin flag and reads back the pin time', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: 'r1', pinnedAt: '2026-10-03T10:00:00.000Z' }),
          { status: 200 },
        ),
      );
    const result = await patchStudioRelease('r1', { pinned: true });
    const [url, init] = spy.mock.calls[0] ?? [];
    expect(String(url)).toContain('/api/me/releases/r1');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toEqual({ pinned: true });
    expect(result.ok && result.data.pinnedAt).toBe('2026-10-03T10:00:00.000Z');
  });
});

describe('deleteStudioRelease', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a DELETE for the release', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    expect(await deleteStudioRelease('r1')).toEqual({ ok: true });
    const [url, init] = spy.mock.calls[0] ?? [];
    expect(String(url)).toContain('/api/me/releases/r1');
    expect(init?.method).toBe('DELETE');
  });

  it("passes the API's reason on when it refuses", async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error:
            'This release has been sent for distribution — withdraw it from stores before deleting it.',
        }),
        { status: 409 },
      ),
    );
    const result = await deleteStudioRelease('r1');
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain('sent for distribution');
  });
});
