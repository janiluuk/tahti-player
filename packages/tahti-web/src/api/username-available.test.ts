import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchUsernameAvailability } from './username-available';

describe('fetchUsernameAvailability', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks the API whether a handle is free', async () => {
    const body = { available: false, suggestions: ['dj-live'] };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    await expect(fetchUsernameAvailability('dj')).resolves.toEqual(body);
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/auth/username-available?username=dj',
    );
  });

  it('returns null when the check fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 400 }),
    );
    await expect(fetchUsernameAvailability('x')).resolves.toBeNull();
  });
});
