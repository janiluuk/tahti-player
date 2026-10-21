import { afterEach, describe, expect, it, vi } from 'vitest';

import { deleteComment } from './comments';

describe('deleteComment', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes a comment', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    await expect(deleteComment('c1')).resolves.toEqual({ ok: true });
    expect(fetchSpy.mock.calls[0]![0]).toBe('/tahti-api/api/comments/c1');
    expect(fetchSpy.mock.calls[0]![1]!.method).toBe('DELETE');
  });

  it('passes on the API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'Not allowed to delete this comment' }),
        { status: 403 },
      ),
    );
    await expect(deleteComment('c1')).resolves.toEqual({
      ok: false,
      error: 'Not allowed to delete this comment',
    });
  });
});
