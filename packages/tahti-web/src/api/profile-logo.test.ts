import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  artistLogo,
  removeProfileLogo,
  setProfileLogoPlacement,
  uploadProfileLogo,
} from './profile-logo';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe('profile logo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prepares, uploads and completes a PNG logo', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        json({
          uploadKey: 'avatars/demo/logo-1.png',
          uploadUrl: 'https://s3/put',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(json({ logoUrl: 'https://cdn/logo-1.png' }));
    const file = new File(['x'], 'logo.png', { type: 'image/png' });

    await expect(uploadProfileLogo(file)).resolves.toEqual({
      ok: true,
      data: { logoUrl: 'https://cdn/logo-1.png' },
    });
    expect(String(spy.mock.calls[0]?.[0])).toBe(
      '/tahti-api/api/me/profile/logo/prepare',
    );
    expect(JSON.parse(String(spy.mock.calls[0]?.[1]?.body))).toEqual({
      filename: 'logo.png',
      contentType: 'image/png',
    });
    expect(spy.mock.calls[1]?.[0]).toBe('https://s3/put');
    expect(String(spy.mock.calls[2]?.[0])).toBe(
      '/tahti-api/api/me/profile/logo/complete',
    );
  });

  it('refuses a JPEG before calling the API', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    const file = new File(['x'], 'logo.jpg', { type: 'image/jpeg' });
    const result = await uploadProfileLogo(file);
    expect(result.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('patches the placement and clears the logo on the profile', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => json({}));
    await expect(setProfileLogoPlacement('BOTH')).resolves.toEqual({
      ok: true,
    });
    await expect(removeProfileLogo()).resolves.toEqual({ ok: true });
    expect(spy.mock.calls.map((c) => JSON.parse(String(c[1]?.body)))).toEqual([
      { logoPlacement: 'BOTH' },
      { logoUrl: null },
    ]);
    expect(spy.mock.calls.every((c) => c[1]?.method === 'PATCH')).toBe(true);
  });
});

describe('artistLogo', () => {
  it('defaults the placement to the avatar', () => {
    expect(artistLogo({ logoUrl: 'https://x/logo.png' })).toEqual({
      url: 'https://x/logo.png',
      placement: 'AVATAR',
    });
    expect(
      artistLogo({ logoUrl: 'https://x/logo.png', logoPlacement: 'COVER' }),
    ).toEqual({ url: 'https://x/logo.png', placement: 'COVER' });
    expect(artistLogo({ logoUrl: null, logoPlacement: 'BOTH' })).toBeNull();
  });
});
