import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchCommentSettings,
  setChannelCommentsEnabled,
  setNewChannelCommentsEnabled,
  setNewUploadCommentsEnabled,
} from './comment-settings';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe('comment settings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the channel switch and the new-upload default', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
      String(url).endsWith('/defaults')
        ? json({
            defaultTrackCommentsEnabled: false,
            defaultChannelCommentsEnabled: true,
          })
        : json({ commentsEnabled: true }),
    );
    await expect(fetchCommentSettings()).resolves.toEqual({
      ok: true,
      data: {
        channelCommentsEnabled: true,
        newUploadCommentsEnabled: false,
        newChannelCommentsEnabled: true,
      },
    });
  });

  it('leaves the channel switch out without a channel', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
      String(url).endsWith('/defaults')
        ? json({
            defaultTrackCommentsEnabled: true,
            defaultChannelCommentsEnabled: false,
          })
        : json({ error: 'Channel not found' }, 404),
    );
    await expect(fetchCommentSettings()).resolves.toEqual({
      ok: true,
      data: {
        channelCommentsEnabled: null,
        newUploadCommentsEnabled: true,
        newChannelCommentsEnabled: false,
      },
    });
  });

  it('patches each setting', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ commentsEnabled: false }))
      .mockResolvedValueOnce(
        json({
          defaultTrackCommentsEnabled: false,
          defaultChannelCommentsEnabled: true,
        }),
      )
      .mockResolvedValueOnce(
        json({
          defaultTrackCommentsEnabled: false,
          defaultChannelCommentsEnabled: false,
        }),
      );
    await expect(setChannelCommentsEnabled(false)).resolves.toEqual({
      ok: true,
      enabled: false,
    });
    await expect(setNewUploadCommentsEnabled(false)).resolves.toEqual({
      ok: true,
      enabled: false,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/comments/channel',
    );
    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toEqual({
      commentsEnabled: false,
    });
    expect(fetchSpy.mock.calls[1]![0]).toBe(
      '/tahti-api/api/me/comments/defaults',
    );
    expect(JSON.parse(fetchSpy.mock.calls[1]![1]!.body as string)).toEqual({
      defaultTrackCommentsEnabled: false,
    });
    await expect(setNewChannelCommentsEnabled(false)).resolves.toEqual({
      ok: true,
      enabled: false,
    });
    expect(fetchSpy.mock.calls[2]![0]).toBe(
      '/tahti-api/api/me/comments/defaults',
    );
    expect(JSON.parse(fetchSpy.mock.calls[2]![1]!.body as string)).toEqual({
      defaultChannelCommentsEnabled: false,
    });
  });
});
