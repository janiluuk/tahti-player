import { describe, expect, it } from 'vitest';

import { inAppPath } from './inAppPath';

const APP = 'https://app.tahti.live';

describe('inAppPath', () => {
  it('opens the artist subdomain site as the full in-app artist page', () => {
    expect(inAppPath('https://yaniho.tahti.live', APP)).toBe(
      '/u/yaniho?full=1',
    );
    expect(inAppPath('https://yaniho.tahti.live/', APP)).toBe(
      '/u/yaniho?full=1',
    );
    expect(inAppPath('https://yaniho.tahti.live/u/yaniho', APP)).toBe(
      '/u/yaniho?full=1',
    );
  });

  it('keeps other subdomain paths and the Listen home as they are', () => {
    expect(inAppPath('https://yaniho.tahti.live/t/abc', APP)).toBe('/t/abc');
    expect(inAppPath('https://yaniho.tahti.live/?home=1', APP)).toBe(
      '/?home=1',
    );
  });

  it('opens relative, same-origin and shared Tahti host links in the app', () => {
    expect(inAppPath('/u/yaniho/c/vault', APP)).toBe('/u/yaniho/c/vault');
    expect(inAppPath('https://app.tahti.live/u/yaniho?x=1#a', APP)).toBe(
      '/u/yaniho?x=1#a',
    );
    expect(inAppPath('https://tahti.live/u/yaniho', APP)).toBe('/u/yaniho');
    expect(
      inAppPath('http://127.0.0.1:5196/u/yaniho', 'http://127.0.0.1:5196'),
    ).toBe('/u/yaniho');
  });

  it('leaves other sites and reserved Tahti services as full links', () => {
    expect(inAppPath('https://bandcamp.com/x', APP)).toBeNull();
    expect(inAppPath('https://yaniho.example.com', APP)).toBeNull();
    expect(inAppPath('https://api.tahti.live/x', APP)).toBeNull();
    expect(inAppPath('https://radio.tahti.live', APP)).toBeNull();
    expect(inAppPath('http://yaniho.tahti.live', APP)).toBeNull();
    expect(inAppPath('mailto:a@b.c', APP)).toBeNull();
  });
});
