import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchHearthisArtistTracks,
  hearthisApiTrack,
  hearthisProfileFromQuery,
  parseHearthisSetPermalink,
  type HearthisApiTrack,
} from './hearthis';

const apiTrack = (extra: Partial<HearthisApiTrack>): HearthisApiTrack => ({
  id: '1',
  title: 'Set',
  permalink_url: 'https://hearthis.at/dj/set/',
  duration: '3600',
  user: { username: 'DJ' },
  ...extra,
});

describe('parseHearthisSetPermalink', () => {
  it('reads the permalink from set links and accepts a bare permalink', () => {
    expect(
      parseHearthisSetPermalink('https://hearthis.at/set/380208-9827046/'),
    ).toBe('380208-9827046');
    expect(parseHearthisSetPermalink('hearthis.at/set/380208-9827046')).toBe(
      '380208-9827046',
    );
    expect(
      parseHearthisSetPermalink(
        '  https://www.hearthis.at/set/my-set/?utm=x#top ',
      ),
    ).toBe('my-set');
    expect(parseHearthisSetPermalink('380208-9827046')).toBe('380208-9827046');
  });

  it('rejects track links, other sites and empty input', () => {
    expect(parseHearthisSetPermalink('https://hearthis.at/dj/track/')).toBe(
      null,
    );
    expect(parseHearthisSetPermalink('https://example.com/set/x/')).toBe(null);
    expect(parseHearthisSetPermalink('   ')).toBe(null);
  });
});

describe('hearthisApiTrack download', () => {
  it('keeps the download link only when the uploader allows downloads', () => {
    expect(
      hearthisApiTrack(
        apiTrack({
          downloadable: '1',
          download_url: 'https://hearthis.at/dj/set/download/',
          download_filename: 'Set.mp3',
        }),
      ).download,
    ).toEqual({
      url: 'https://hearthis.at/dj/set/download/',
      fileName: 'Set.mp3',
    });
    expect(
      hearthisApiTrack(apiTrack({ downloadable: '0', download_url: '' }))
        .download,
    ).toBe(null);
    expect(
      hearthisApiTrack(apiTrack({ downloadable: '1', download_url: '' }))
        .download,
    ).toBe(null);
  });
});

describe('hearthis profile lookup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('recognises a profile link or @handle, not plain search text', () => {
    expect(hearthisProfileFromQuery('@dj-aurora')).toBe('dj-aurora');
    expect(hearthisProfileFromQuery(' https://hearthis.at/dj-aurora/ ')).toBe(
      'https://hearthis.at/dj-aurora/',
    );
    expect(
      hearthisProfileFromQuery('https://hearthis.at/dj-aurora/some-track/'),
    ).toBeNull();
    expect(hearthisProfileFromQuery('deep house')).toBeNull();
  });

  it("lists a profile's tracks", async () => {
    const tracks = [{ id: 't1', title: 'A' }];
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ username: 'dj-aurora', tracks }), {
        status: 200,
      }),
    );
    await expect(fetchHearthisArtistTracks('dj-aurora')).resolves.toMatchObject(
      { data: tracks },
    );
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/v1/imports/hearthis/by-username?profileUrl=dj-aurora',
    );
  });
});
