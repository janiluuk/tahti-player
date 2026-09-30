import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchGreenRoomSession,
  removeGreenRoomInvite,
  setGreenRoomSessionEnabled,
} from './green-room-session';

const SESSION = {
  enabled: true,
  channelState: 'PREVIEW',
  invitePool: 'SUBS_ONLY',
  invites: [],
  candidates: [],
};

describe('green room session', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the session', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(SESSION), { status: 200 }),
      );
    await expect(fetchGreenRoomSession()).resolves.toMatchObject({
      data: SESSION,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/channel/green-room',
    );
  });

  it('opens the green room and passes on the API error', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(SESSION), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'No active broadcast session' }), {
          status: 409,
        }),
      );
    await expect(setGreenRoomSessionEnabled(true)).resolves.toMatchObject({
      ok: true,
    });
    expect(fetchSpy.mock.calls[0]![1]!.method).toBe('PATCH');
    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toEqual({
      enabled: true,
    });
    await expect(setGreenRoomSessionEnabled(true)).resolves.toEqual({
      ok: false,
      error: 'No active broadcast session',
    });
  });

  it('removes a guest', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    await expect(removeGreenRoomInvite('u1')).resolves.toEqual({ ok: true });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/channel/green-room/invites/u1',
    );
    expect(fetchSpy.mock.calls[0]![1]!.method).toBe('DELETE');
  });
});
