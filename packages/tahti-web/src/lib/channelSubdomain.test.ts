import { describe, expect, it } from 'vitest';

import {
  artistSubdomainLabel,
  isApexHost,
  isArtistSubdomainPage,
  subdomainEntry,
} from './channelSubdomain';

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
  it('opens the full artist page on a bare artist subdomain', () => {
    expect(subdomainEntry(at('https://northern-lights.tahti.live/'))).toEqual({
      kind: 'path',
      path: '/u/northern-lights',
    });
  });

  it('keeps the query and hash', () => {
    expect(
      subdomainEntry(at('https://Moon.tahti.live/?ref=mail#chat')),
    ).toEqual({ kind: 'path', path: '/u/moon?ref=mail#chat' });
  });

  it('opens the Tahti Selects artist page on its subdomain', () => {
    expect(subdomainEntry(at('https://tahti-selects.tahti.live/'))).toEqual({
      kind: 'path',
      path: '/u/tahti-selects',
    });
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

describe('isArtistSubdomainPage', () => {
  it('applies to the matching artist home and channel on the subdomain', () => {
    expect(isArtistSubdomainPage('aino.tahti.live', '/u/aino')).toBe(true);
    expect(isArtistSubdomainPage('aino.tahti.live', '/u/aino/')).toBe(true);
    expect(isArtistSubdomainPage('aino.tahti.live', '/channel/aino')).toBe(
      true,
    );
    expect(isArtistSubdomainPage('aino.tahti.live', '/studio')).toBe(false);
    expect(isArtistSubdomainPage('aino.tahti.live', '/channel/other')).toBe(
      false,
    );
    expect(isArtistSubdomainPage('aino.tahti.live', '/u/other')).toBe(false);
    expect(isArtistSubdomainPage('tahti.live', '/u/aino')).toBe(false);
    expect(isArtistSubdomainPage('beta.tahti.live', '/u/beta')).toBe(false);
    expect(isArtistSubdomainPage('radio.tahti.live', '/u/radio')).toBe(false);
  });
});

describe('artistSubdomainLabel / isApexHost', () => {
  it('reads the artist label from the host', () => {
    expect(artistSubdomainLabel('yaniho.tahti.live')).toBe('yaniho');
    expect(artistSubdomainLabel('www.tahti.live')).toBeNull();
  });

  it('treats apex and local hosts as short-link hosts', () => {
    expect(isApexHost('tahti.live')).toBe(true);
    expect(isApexHost('www.tahti.live')).toBe(true);
    expect(isApexHost('app.tahti.live')).toBe(true);
    expect(isApexHost('localhost')).toBe(true);
    expect(isApexHost('yaniho.tahti.live')).toBe(false);
  });
});
