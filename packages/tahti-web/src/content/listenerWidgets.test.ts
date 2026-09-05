import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchHearthisUserSets,
  LISTENER_WIDGET_TYPES,
  listenerWidgetType,
  resolveHearthisPageEmbedUrl,
  resolveListenerWidgetInput,
  soundcloudProfileUrl,
} from './listenerWidgets';

describe('Listen store catalog', () => {
  it('lists every streaming add-on the Listen store and add-widget picker share', () => {
    expect(LISTENER_WIDGET_TYPES.map((type) => type.id)).toEqual([
      'soundcloud',
      'youtube',
      'spotify',
      'hearthis',
      'bandcamp',
    ]);
  });
});

describe('hearthis.at listener embed', () => {
  const hearthis = listenerWidgetType('hearthis');

  it('turns a numeric track id into the official hearthis.at widget URL', () => {
    expect(hearthis?.toEmbedUrl('12345')).toContain(
      'https://hearthis.at/embed/12345/transparent_black/',
    );
    expect(hearthis?.toEmbedUrl('12345')).toContain('autoplay=0');
  });

  it('accepts a hearthis.at embed URL', () => {
    expect(
      hearthis?.toEmbedUrl(
        'https://hearthis.at/embed/12345/transparent_black/',
      ),
    ).toContain('https://hearthis.at/embed/12345/transparent_black/');
  });

  it('rejects unrelated URLs and slug-only track pages', () => {
    expect(hearthis?.toEmbedUrl('https://example.com/12345')).toBeNull();
    expect(hearthis?.toEmbedUrl('https://hearthis.at/dj/track/')).toBeNull();
  });

  it('accepts a resolved set-embed URL', () => {
    expect(
      hearthis?.toEmbedUrl(
        'https://hearthis.at/set/378936-9675121/embed/rw76K/',
      ),
    ).toBe('https://hearthis.at/set/378936-9675121/embed/rw76K/');
  });

  it('rejects a set page URL that has not been resolved to an embed yet', () => {
    expect(
      hearthis?.toEmbedUrl('https://hearthis.at/yaniho/set/some-set/'),
    ).toBeNull();
  });
});

describe('resolveHearthisPageEmbedUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('extracts the iframe src from the oEmbed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            html: '<iframe src="https://hearthis.at/set/378936-9675121/embed/rw76K/"></iframe>',
          }),
      }),
    );

    await expect(
      resolveHearthisPageEmbedUrl(
        'https://hearthis.at/yaniho/set/recorded-sets-from-gigs/',
      ),
    ).resolves.toBe('https://hearthis.at/set/378936-9675121/embed/rw76K/');

    expect(fetch).toHaveBeenCalledWith(
      'https://hearthis.at/yaniho/set/recorded-sets-from-gigs/oembed.json',
    );
  });

  it('returns null for a non-hearthis.at URL without fetching', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(
      resolveHearthisPageEmbedUrl('https://example.com/set/1/'),
    ).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns null when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    await expect(
      resolveHearthisPageEmbedUrl('https://hearthis.at/yaniho/set/x/'),
    ).resolves.toBeNull();
  });
});

describe('fetchHearthisUserSets', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps the API response into HearthisSet rows', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: '378936',
              title: 'Recorded sets from gigs',
              description: 'Recordings of past sets',
              track_count: 171,
              thumb: 'https://img.hearthis.at/thumb.jpg',
              permalink_url: 'https://hearthis.at/set/378936-9675121/',
            },
          ]),
      }),
    );

    await expect(fetchHearthisUserSets('yaniho')).resolves.toEqual([
      {
        id: '378936',
        title: 'Recorded sets from gigs',
        description: 'Recordings of past sets',
        trackCount: 171,
        thumbUrl: 'https://img.hearthis.at/thumb.jpg',
        pageUrl: 'https://hearthis.at/set/378936-9675121/',
      },
    ]);
    expect(fetch).toHaveBeenCalledWith(
      'https://api-v2.hearthis.at/yaniho/?type=playlists&page=1&count=50',
    );
  });

  it('rejects a username with unsafe characters without fetching', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(fetchHearthisUserSets('yaniho/../admin')).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns null when the response is not an array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'error' }),
      }),
    );

    await expect(fetchHearthisUserSets('yaniho')).resolves.toBeNull();
  });
});

describe('SoundCloud profile URL', () => {
  it('normalizes a SoundCloud account link', () => {
    expect(soundcloudProfileUrl('https://www.soundcloud.com/artist/')).toBe(
      'https://soundcloud.com/artist',
    );
  });

  it('rejects track and non-SoundCloud URLs', () => {
    expect(soundcloudProfileUrl('https://soundcloud.com/artist/track')).toBe(
      null,
    );
    expect(soundcloudProfileUrl('https://example.com/artist')).toBe(null);
  });
});

describe('resolveListenerWidgetInput', () => {
  it('accepts a SoundCloud profile and marks it to save on the account', () => {
    expect(
      resolveListenerWidgetInput('soundcloud', 'https://soundcloud.com/artist'),
    ).toEqual({
      ok: true,
      input: 'https://soundcloud.com/artist',
      saveSoundcloudProfile: true,
    });
  });

  it('accepts a SoundCloud track URL without treating it as a profile', () => {
    expect(
      resolveListenerWidgetInput(
        'soundcloud',
        'https://soundcloud.com/artist/track',
      ),
    ).toEqual({
      ok: true,
      input: 'https://soundcloud.com/artist/track',
      saveSoundcloudProfile: false,
    });
  });

  it('rejects an unrecognized YouTube URL instead of saving a broken embed', () => {
    expect(
      resolveListenerWidgetInput('youtube', 'https://example.com/watch'),
    ).toEqual({
      ok: false,
      error: expect.stringContaining("Couldn't recognize this YouTube link"),
    });
  });

  it('accepts a YouTube watch URL', () => {
    expect(
      resolveListenerWidgetInput(
        'youtube',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      ),
    ).toEqual({
      ok: true,
      input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      saveSoundcloudProfile: false,
    });
  });
});

describe('Bandcamp listener embed', () => {
  const bandcamp = listenerWidgetType('bandcamp');

  it('accepts the official EmbeddedPlayer URL', () => {
    expect(
      bandcamp?.toEmbedUrl(
        'https://bandcamp.com/EmbeddedPlayer/album=1234567890/size=large/tracklist=false/',
      ),
    ).toBe(
      'https://bandcamp.com/EmbeddedPlayer/album=1234567890/size=large/tracklist=false/',
    );
  });

  it('rejects a plain Bandcamp page URL — no derivable numeric id', () => {
    expect(
      bandcamp?.toEmbedUrl('https://artist.bandcamp.com/album/some-album'),
    ).toBeNull();
  });

  it('rejects unrelated URLs', () => {
    expect(
      bandcamp?.toEmbedUrl('https://example.com/EmbeddedPlayer/'),
    ).toBeNull();
  });
});

describe('Spotify playlist listener embed', () => {
  const spotify = listenerWidgetType('spotify');

  it('turns a Spotify playlist URL into the official playlist embed', () => {
    expect(
      spotify?.toEmbedUrl(
        'https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6',
      ),
    ).toBe('https://open.spotify.com/embed/playlist/37i9dQZF1DX4WYpdgoIcn6');
  });

  it('rejects Spotify tracks, profiles, and unrelated URLs', () => {
    expect(
      spotify?.toEmbedUrl(
        'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tjpeg',
      ),
    ).toBeNull();
    expect(spotify?.toEmbedUrl('https://spotify.com/playlist/abc')).toBeNull();
    expect(spotify?.toEmbedUrl('https://example.com/playlist/abc')).toBeNull();
  });
});
