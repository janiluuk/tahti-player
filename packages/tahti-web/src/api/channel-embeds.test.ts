import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchChannelSoundCloudEmbeds,
  soundCloudWidgetSrc,
} from './channel-embeds';

describe('channel SoundCloud embeds', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads a channel's public embeds", async () => {
    const embed = { id: 'e1', url: 'https://soundcloud.com/a/b' };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify([embed]), { status: 200 }),
      );
    await expect(
      fetchChannelSoundCloudEmbeds('night-drive'),
    ).resolves.toMatchObject({ data: [embed] });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/channels/night-drive/embeds',
    );
  });

  it('returns an empty list when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 404 }),
    );
    await expect(fetchChannelSoundCloudEmbeds('x')).resolves.toMatchObject({
      data: [],
    });
  });

  it('builds the SoundCloud widget URL for a track', () => {
    const src = new URL(soundCloudWidgetSrc('https://soundcloud.com/a/b'));
    expect(src.origin).toBe('https://w.soundcloud.com');
    expect(src.searchParams.get('url')).toBe('https://soundcloud.com/a/b');
    expect(src.searchParams.get('auto_play')).toBe('true');
  });
});
