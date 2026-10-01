import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchMyLikes, likedTrackToPlayable, type LikedTrack } from './likes';

const liked = (overrides: Partial<LikedTrack> = {}): LikedTrack => ({
  id: 's1',
  title: 'Northern Lights',
  bannerUrl: 'https://cdn.example/s1.jpg',
  audioUrl: 'https://cdn.example/s1.mp3',
  channelSlug: 'aino',
  artistUsername: 'aino',
  artistDisplayName: 'Aino',
  likedAt: '2026-10-01T12:00:00.000Z',
  url: 'https://tahti.live/c/aino#sound-item-s1',
  ...overrides,
});

describe('likes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads your likes from the API', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ items: [liked()] }), { status: 200 }),
      );
    const result = await fetchMyLikes();
    expect(String(fetchSpy.mock.calls[0]![0])).toContain(
      '/api/me/likes?limit=100',
    );
    expect(result.data.map((track) => track.id)).toEqual(['s1']);
  });

  it('returns no likes when signed out', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    await expect(fetchMyLikes()).resolves.toMatchObject({ data: [] });
  });

  it('plays a liked track as the track itself, and skips gated ones', () => {
    expect(likedTrackToPlayable(liked())).toMatchObject({
      id: 'sound:s1',
      kind: 'sound',
      artist: 'Aino',
      streamUrl: 'https://cdn.example/s1.mp3',
      channelSlug: 'aino',
    });
    expect(likedTrackToPlayable(liked({ audioUrl: null }))).toBeNull();
  });
});
