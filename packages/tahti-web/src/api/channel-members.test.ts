import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  addChannelMember,
  removeChannelMember,
  updateChannelMember,
} from './channel-members';

const MEMBER = {
  id: 'm1',
  name: 'Ada',
  role: 'Vocals',
  pictureUrl: null,
  position: 0,
};

describe('channel members', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds, edits and removes a person', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(MEMBER), { status: 201 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...MEMBER, role: 'Drums' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(
      addChannelMember({ name: 'Ada', role: 'Vocals' }),
    ).resolves.toEqual({ ok: true, data: MEMBER });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/channel/members',
    );
    await expect(
      updateChannelMember('m1', { role: 'Drums' }),
    ).resolves.toMatchObject({ ok: true, data: { role: 'Drums' } });
    expect(fetchSpy.mock.calls[1]![0]).toBe(
      '/tahti-api/api/me/channel/members/m1',
    );
    expect(fetchSpy.mock.calls[1]![1]!.method).toBe('PATCH');
    await expect(removeChannelMember('m1')).resolves.toEqual({ ok: true });
    expect(fetchSpy.mock.calls[2]![1]!.method).toBe('DELETE');
  });

  it('passes on the API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Channel not found' }), {
        status: 404,
      }),
    );
    await expect(
      addChannelMember({ name: 'Ada', role: 'Vocals' }),
    ).resolves.toEqual({ ok: false, error: 'Channel not found' });
  });
});
