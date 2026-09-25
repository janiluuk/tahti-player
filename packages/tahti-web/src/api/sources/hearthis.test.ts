import { describe, expect, it } from 'vitest';

import {
  hearthisApiTrack,
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
