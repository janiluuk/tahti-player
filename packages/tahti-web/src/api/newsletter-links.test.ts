import { afterEach, describe, expect, it, vi } from 'vitest';

import { unsubscribeFromNewsletter } from './newsletter-links';

describe('unsubscribeFromNewsletter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('treats the API redirect as success', async () => {
    const redirected = new Response(null, { status: 200 });
    Object.defineProperty(redirected, 'type', { value: 'opaqueredirect' });
    Object.defineProperty(redirected, 'ok', { value: false });
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(redirected);
    await expect(unsubscribeFromNewsletter('tok 1')).resolves.toEqual({
      ok: true,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/newsletter/unsubscribe/tok%201',
    );
    expect(fetchSpy.mock.calls[0]![1]!.redirect).toBe('manual');
  });

  it('explains an invalid or used link', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 404 }),
    );
    await expect(unsubscribeFromNewsletter('old')).resolves.toEqual({
      ok: false,
      error: 'This unsubscribe link is invalid or was already used.',
    });
  });
});
