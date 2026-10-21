import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  removeProfileBackdrop,
  uploadProfileBackdrop,
} from './profile-backdrop';

describe('profile backdrop', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads through prepare, PUT and complete', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            uploadKey: 'k',
            uploadUrl: 'https://s3.example/put',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ backdropUrl: 'https://cdn/b.jpg' }), {
          status: 200,
        }),
      );
    const file = new File(['x'], 'b.webp', { type: 'image/webp' });
    await expect(uploadProfileBackdrop(file)).resolves.toEqual({
      ok: true,
      data: { backdropUrl: 'https://cdn/b.jpg' },
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/profile/backdrop/prepare',
    );
    expect(fetchSpy.mock.calls[2]![0]).toBe(
      '/tahti-api/api/me/profile/backdrop/complete',
    );
  });

  it('refuses GIFs and removes with backdropUrl null', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    const gif = new File(['x'], 'b.gif', { type: 'image/gif' });
    await expect(uploadProfileBackdrop(gif)).resolves.toEqual({
      ok: false,
      error: 'Use JPEG, PNG, or WebP',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    await expect(removeProfileBackdrop()).resolves.toEqual({ ok: true });
    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toEqual({
      backdropUrl: null,
    });
  });
});
