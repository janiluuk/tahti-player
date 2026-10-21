import { describe, expect, it } from 'vitest';

import { subdomainEntry } from './channelSubdomain';

const at = (href: string) => {
  const url = new URL(href);
  return {
    hostname: url.hostname,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  };
};

describe('subdomainEntry', () => {
  it('opens the channel on a bare channel subdomain', () => {
    expect(subdomainEntry(at('https://northern-lights.tahti.live/'))).toEqual({
      kind: 'path',
      path: '/channel/northern-lights',
    });
  });

  it('keeps the query and hash', () => {
    expect(
      subdomainEntry(at('https://Moon.tahti.live/?ref=mail#chat')),
    ).toEqual({ kind: 'path', path: '/channel/moon?ref=mail#chat' });
  });

  it('opens the station on radio.tahti.live', () => {
    expect(subdomainEntry(at('https://radio.tahti.live/'))).toEqual({
      kind: 'path',
      path: '/radio',
    });
  });

  it('moves the legacy tahti-radio subdomain to radio', () => {
    expect(subdomainEntry(at('https://tahti-radio.tahti.live/radio'))).toEqual({
      kind: 'url',
      url: 'https://radio.tahti.live/radio',
    });
  });

  it('leaves other paths, explicit home and service hosts alone', () => {
    for (const href of [
      'https://northern-lights.tahti.live/library',
      'https://northern-lights.tahti.live/?home=1',
      'https://app.tahti.live/',
      'https://beta.tahti.live/',
      'https://www.tahti.live/',
      'https://tahti.live/',
      'https://api.tahti.live/',
      'https://a.b.tahti.live/',
      'http://localhost:5180/',
      'https://example.com/',
    ]) {
      expect(subdomainEntry(at(href)), href).toBeNull();
    }
  });
});
