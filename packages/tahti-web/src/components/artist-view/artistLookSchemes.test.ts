import { describe, expect, it } from 'vitest';

import { artistLookSchemes } from './artistLookSchemes';

type Visual = Parameters<typeof artistLookSchemes>[0];
type Extras = Parameters<typeof artistLookSchemes>[1];

const EXTRAS = {} as Extras;
const ARTIST = {
  username: 'a',
  backdropUrl: 'https://cdn/backdrop.jpg',
} as Parameters<typeof artistLookSchemes>[2];

describe('artistLookSchemes backdrop', () => {
  it('prefers the channel slideshow, then the profile backdrop', () => {
    expect(
      artistLookSchemes(
        { slideshowImages: ['https://cdn/slide.jpg'] } as Visual,
        EXTRAS,
        ARTIST,
      ).artistBackdropUrl,
    ).toBe('https://cdn/slide.jpg');
    expect(artistLookSchemes(null, EXTRAS, ARTIST).artistBackdropUrl).toBe(
      'https://cdn/backdrop.jpg',
    );
    expect(artistLookSchemes(null, EXTRAS).artistBackdropUrl).toBeNull();
  });

  it('shows no still backdrop behind a video background', () => {
    expect(
      artistLookSchemes(
        { videoBackgroundUrl: 'https://cdn/v.mp4' } as Visual,
        EXTRAS,
        ARTIST,
      ).artistBackdropUrl,
    ).toBeNull();
  });
});
