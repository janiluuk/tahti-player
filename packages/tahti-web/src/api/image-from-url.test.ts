import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  setChannelMemberPictureFromUrl,
  setCollectionCoverFromUrl,
  setProfileAvatarFromUrl,
  setReleaseArtworkFromUrl,
} from './image-from-url';

describe('setReleaseArtworkFromUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks the API to fetch the image for the release', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ artworkUrl: 'https://cdn/a.jpg', artworkKey: 'k' }),
          { status: 200 },
        ),
      );
    await expect(
      setReleaseArtworkFromUrl('r1', 'https://example.com/cover.jpg'),
    ).resolves.toEqual({ ok: true, url: 'https://cdn/a.jpg' });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/releases/r1/artwork/from-url',
    );
    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toEqual({
      sourceUrl: 'https://example.com/cover.jpg',
    });
  });

  it('passes on why the image was refused', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Not an image' }), { status: 422 }),
    );
    await expect(
      setReleaseArtworkFromUrl('r1', 'https://example.com/page'),
    ).resolves.toEqual({ ok: false, error: 'Not an image' });
  });
});

describe('setCollectionCoverFromUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks the API to fetch the image for the collection', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://cdn/c.jpg' }), {
        status: 200,
      }),
    );
    await expect(
      setCollectionCoverFromUrl('late-night', 'https://example.com/c.jpg'),
    ).resolves.toEqual({ ok: true, url: 'https://cdn/c.jpg' });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/collections/late-night/cover/from-url',
    );
  });

  it('passes on why the image was refused', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Image too large' }), {
        status: 422,
      }),
    );
    await expect(
      setCollectionCoverFromUrl('late-night', 'https://example.com/big.jpg'),
    ).resolves.toEqual({ ok: false, error: 'Image too large' });
  });
});

describe('setProfileAvatarFromUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks the API to fetch the image as the profile picture', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          avatarUrl: 'https://cdn/a.jpg',
          avatarPosterUrl: null,
        }),
        { status: 200 },
      ),
    );
    await expect(
      setProfileAvatarFromUrl('https://example.com/me.jpg'),
    ).resolves.toEqual({ ok: true, url: 'https://cdn/a.jpg' });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/profile/avatar/from-url',
    );
    expect(JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string)).toEqual({
      sourceUrl: 'https://example.com/me.jpg',
    });
  });
});

describe('setChannelMemberPictureFromUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("asks the API to fetch the image as a member's picture", async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://cdn/ada.jpg' }), {
        status: 200,
      }),
    );
    await expect(
      setChannelMemberPictureFromUrl('m1', 'https://example.com/ada.jpg'),
    ).resolves.toEqual({ ok: true, url: 'https://cdn/ada.jpg' });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/channel/members/m1/picture/from-url',
    );
  });
});
