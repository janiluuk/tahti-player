import { describe, expect, it } from 'vitest';

import { artworkMimeType, mediaSessionArtwork } from './mediaSessionArtwork';
import { placeholderArtworkUrl } from './placeholderArt';

describe('artworkMimeType', () => {
  it.each([
    ['https://cdn.example/a.svg', 'image/svg+xml'],
    ['https://cdn.example/a.png', 'image/png'],
    ['https://cdn.example/a.webp', 'image/webp'],
    ['https://cdn.example/a.jpg', 'image/jpeg'],
    ['https://cdn.example/a.JPEG', 'image/jpeg'],
    ['/radio-logos/nrj.jpg?v=2#top', 'image/jpeg'],
    ['data:image/svg+xml,%3Csvg%3E', 'image/svg+xml'],
    ['data:image/png;base64,iVBORw0KGgo=', 'image/png'],
  ])('%s -> %s', (src, type) => {
    expect(artworkMimeType(src)).toBe(type);
  });

  it.each([
    'https://cdn.example/artwork/123',
    'https://cdn.example/a.bin',
    'https://cdn.example/a.jpg/',
    'data:text/plain,hello',
    'data:,hello',
  ])('returns undefined for %s', (src) => {
    expect(artworkMimeType(src)).toBeUndefined();
  });
});

describe('mediaSessionArtwork', () => {
  it('types a single cover and omits unknown sizes', () => {
    expect(
      mediaSessionArtwork([
        { url: 'https://cdn.example/a.png', purpose: 'cover' },
      ]),
    ).toEqual([{ src: 'https://cdn.example/a.png', type: 'image/png' }]);
  });

  it('omits type when the format cannot be derived', () => {
    expect(
      mediaSessionArtwork([{ url: 'https://cdn.example/cover/1' }]),
    ).toEqual([{ src: 'https://cdn.example/cover/1' }]);
  });

  it('keeps a real SVG cover typed as SVG', () => {
    expect(
      mediaSessionArtwork([{ url: '/mock/cover.svg', purpose: 'cover' }]),
    ).toEqual([{ src: '/mock/cover.svg', type: 'image/svg+xml' }]);
  });

  it('lists alternate resolutions of the first purpose with sizes', () => {
    expect(
      mediaSessionArtwork([
        {
          url: 'https://cdn.example/s.jpg',
          width: 96,
          height: 96,
          purpose: 'cover',
        },
        {
          url: 'https://cdn.example/l.jpg',
          width: 512,
          height: 512,
          purpose: 'cover',
        },
        {
          url: 'https://cdn.example/bg.jpg',
          width: 1920,
          height: 1080,
          purpose: 'background',
        },
      ]),
    ).toEqual([
      { src: 'https://cdn.example/s.jpg', sizes: '96x96', type: 'image/jpeg' },
      {
        src: 'https://cdn.example/l.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ]);
  });

  it('drops the generated SVG placeholder', () => {
    expect(
      mediaSessionArtwork([
        { url: placeholderArtworkUrl('sound:b'), purpose: 'cover' },
      ]),
    ).toEqual([]);
  });

  it('returns nothing for an empty set', () => {
    expect(mediaSessionArtwork([])).toEqual([]);
  });
});
