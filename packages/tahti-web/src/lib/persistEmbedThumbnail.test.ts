import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateArtistEmbedThumbnail } from '../api/artist-embeds';
import {
  persistEmbedThumbnail,
  resetPersistedEmbedThumbnails,
} from './persistEmbedThumbnail';

vi.mock('../api/artist-embeds', () => ({
  updateArtistEmbedThumbnail: vi.fn(),
}));

describe('persistEmbedThumbnail', () => {
  beforeEach(() => {
    resetPersistedEmbedThumbnails();
    vi.mocked(updateArtistEmbedThumbnail).mockReset();
    vi.mocked(updateArtistEmbedThumbnail).mockResolvedValue({
      ok: true,
      data: {
        id: 'e1',
        provider: 'soundcloud',
        url: 'https://soundcloud.com/tahti/night',
        title: 'Night',
        authorName: null,
        thumbnailUrl: 'https://i1.sndcdn.com/art.jpg',
        createdAt: '2026-11-11T00:00:00.000Z',
      },
    });
  });

  it('patches the SoundCloud thumbnail once', async () => {
    await expect(
      persistEmbedThumbnail('e1', 'https://i1.sndcdn.com/art.jpg'),
    ).resolves.toBe(true);
    await expect(
      persistEmbedThumbnail('e1', 'https://i1.sndcdn.com/other.jpg'),
    ).resolves.toBe(false);
    expect(updateArtistEmbedThumbnail).toHaveBeenCalledTimes(1);
    expect(updateArtistEmbedThumbnail).toHaveBeenCalledWith(
      'e1',
      'https://i1.sndcdn.com/art.jpg',
    );
  });

  it('skips a non-https cover', async () => {
    await expect(
      persistEmbedThumbnail('e2', 'http://example.com/art.jpg'),
    ).resolves.toBe(false);
    expect(updateArtistEmbedThumbnail).not.toHaveBeenCalled();
  });
});
