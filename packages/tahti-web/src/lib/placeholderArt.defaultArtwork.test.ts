import { describe, expect, it } from 'vitest';

import { defaultArtworkUrl } from './placeholderArt';

describe('defaultArtworkUrl', () => {
  it('picks the same bundled preset for the same seed', () => {
    const url = defaultArtworkUrl('sound:abc');
    expect(url).toMatch(/^\/artwork-presets\/artwork-(0[1-9]|1[0-6])\.webp$/);
    expect(defaultArtworkUrl('sound:abc')).toBe(url);
  });

  it('spreads different seeds over several presets', () => {
    const urls = new Set(
      Array.from({ length: 40 }, (_, i) => defaultArtworkUrl(`seed-${i}`)),
    );
    expect(urls.size).toBeGreaterThan(5);
  });
});
