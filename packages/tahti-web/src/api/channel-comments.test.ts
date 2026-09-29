import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchChannelComments, postChannelComment } from './channel-comments';

describe('channel comments', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads a channel's comments", async () => {
    const body = { comments: [{ id: 'c1' }], commentsEnabled: true };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    await expect(fetchChannelComments('night-drive')).resolves.toMatchObject({
      data: body,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/comments/channel/night-drive',
    );
  });

  it('returns nothing when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 404 }),
    );
    await expect(fetchChannelComments('x')).resolves.toMatchObject({
      data: null,
    });
  });

  it('posts a comment and passes on the API error', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'c2', body: 'Hi' }), { status: 201 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: 'Comments are off for this channel' }),
          { status: 403 },
        ),
      );
    await expect(
      postChannelComment('night-drive', 'Hi'),
    ).resolves.toMatchObject({ ok: true, data: { id: 'c2' } });
    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toEqual({
      body: 'Hi',
    });
    await expect(postChannelComment('night-drive', 'Hi')).resolves.toEqual({
      ok: false,
      error: 'Comments are off for this channel',
    });
  });
});
