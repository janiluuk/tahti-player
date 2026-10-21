import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchGreenRoomPrefs, patchGreenRoomPrefs } from './green-room';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe('green room defaults', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the channel defaults', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        json({ defaultEnabled: true, defaultInvitePool: 'SUBS_ONLY' }),
      );
    await expect(fetchGreenRoomPrefs()).resolves.toMatchObject({
      data: { defaultEnabled: true, invitePool: 'SUBS_ONLY' },
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/channel/green-room-defaults',
    );
  });

  it('saves only the changed field', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        json({ defaultEnabled: false, defaultInvitePool: 'MANUAL_ONLY' }),
      );
    await expect(
      patchGreenRoomPrefs({ invitePool: 'MANUAL_ONLY' }),
    ).resolves.toEqual({
      ok: true,
      data: { defaultEnabled: false, invitePool: 'MANUAL_ONLY' },
    });
    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init!.method).toBe('PATCH');
    expect(JSON.parse(init!.body as string)).toEqual({
      defaultInvitePool: 'MANUAL_ONLY',
    });
  });
});
