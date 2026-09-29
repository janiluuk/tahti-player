import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  addArtistEmbed,
  fetchArtistEmbeds,
  removeArtistEmbed,
} from './artist-embeds';

const EMBED = {
  id: 'e1',
  provider: 'soundcloud',
  url: 'https://soundcloud.com/a/b',
  title: 'B',
  authorName: 'A',
  thumbnailUrl: null,
  createdAt: '2026-09-01T12:00:00.000Z',
};

describe('artist embeds', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists my SoundCloud embeds', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify([EMBED]), { status: 200 }),
      );
    await expect(fetchArtistEmbeds()).resolves.toMatchObject({
      data: [EMBED],
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe('/tahti-api/api/me/embeds');
  });

  it('adds a track by URL and passes on the API error', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(EMBED), { status: 201 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Maximum 20 embeds' }), {
          status: 400,
        }),
      );
    await expect(addArtistEmbed(EMBED.url)).resolves.toMatchObject({
      ok: true,
      data: EMBED,
    });
    const init = fetchSpy.mock.calls[0]![1]!;
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ url: EMBED.url });
    await expect(addArtistEmbed(EMBED.url)).resolves.toEqual({
      ok: false,
      error: 'Maximum 20 embeds',
    });
  });

  it('removes an embed', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }));
    await expect(removeArtistEmbed('e1')).resolves.toEqual({ ok: true });
    expect(fetchSpy.mock.calls[0]![0]).toBe('/tahti-api/api/me/embeds/e1');
    expect(fetchSpy.mock.calls[0]![1]!.method).toBe('DELETE');
  });
});
