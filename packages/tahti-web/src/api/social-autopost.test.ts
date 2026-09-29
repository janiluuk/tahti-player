import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  disconnectSocial,
  fetchSocialAutoPost,
  fetchSocialPosts,
  postToSocial,
  saveBluesky,
  saveMastodon,
} from './social-autopost';

describe('social auto-post API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads, connects and disconnects Mastodon and Bluesky', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () => new Response(JSON.stringify({}), { status: 200 }),
      );
    await fetchSocialAutoPost();
    await saveMastodon({
      instanceUrl: 'https://mastodon.social',
      accessToken: 'token',
      onReleasePublished: true,
    });
    await saveBluesky({ handle: 'me.bsky.social', appPassword: 'pw' });
    await disconnectSocial('bluesky');
    expect(
      fetchSpy.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET']),
    ).toEqual([
      ['/tahti-api/api/me/social', 'GET'],
      ['/tahti-api/api/me/social/mastodon', 'PUT'],
      ['/tahti-api/api/me/social/bluesky', 'PUT'],
      ['/tahti-api/api/me/social/bluesky', 'DELETE'],
    ]);
    expect(JSON.parse(String(fetchSpy.mock.calls[1]![1]?.body))).toEqual({
      instanceUrl: 'https://mastodon.social',
      accessToken: 'token',
      onReleasePublished: true,
    });
  });

  it('passes the API error through when a connection is refused', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'Could not verify Mastodon credentials' }),
        { status: 400 },
      ),
    );
    await expect(
      saveMastodon({ instanceUrl: 'https://x', accessToken: 't' }),
    ).resolves.toEqual({
      ok: false,
      error: 'Could not verify Mastodon credentials',
    });
  });

  it('reads the post log and queues a manual post', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () => new Response(JSON.stringify([]), { status: 200 }),
      );
    await fetchSocialPosts();
    await postToSocial('MASTODON', 'Hello');
    expect(
      fetchSpy.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET']),
    ).toEqual([
      ['/tahti-api/api/me/social/posts', 'GET'],
      ['/tahti-api/api/me/social/post', 'POST'],
    ]);
    expect(JSON.parse(String(fetchSpy.mock.calls[1]![1]?.body))).toEqual({
      platform: 'MASTODON',
      message: 'Hello',
    });
  });
});
