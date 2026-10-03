import { describe, expect, it } from 'vitest';

import { prefixesForServices } from './dspPluginDefaults';
import { DSP_SERVICES, dspServiceLabel } from './dspServices';

describe('dspServices', () => {
  it('offers exactly the services the smart link API accepts', () => {
    expect(DSP_SERVICES.map((service) => service.key).sort()).toEqual(
      [
        'amazon',
        'apple',
        'bandcamp',
        'deezer',
        'mixcloud',
        'soundcloud',
        'spotify',
        'tidal',
        'youtube',
      ].sort(),
    );
  });

  it('labels every service, including Deezer, Amazon Music and Mixcloud', () => {
    expect(dspServiceLabel('deezer')).toBe('Deezer');
    expect(dspServiceLabel('amazon')).toBe('Amazon Music');
    expect(dspServiceLabel('mixcloud')).toBe('Mixcloud');
    expect(dspServiceLabel('Apple')).toBe('Apple Music');
    expect(dspServiceLabel('napster')).toBe('Napster');
  });

  it('gives Deezer and Amazon Music fallback prefixes but not Mixcloud', () => {
    const prefixes = prefixesForServices({});
    expect(prefixes).toMatchObject({
      deezer: 'https://www.deezer.com/album/',
      amazon: 'https://music.amazon.com/albums/',
    });
    expect(prefixes.mixcloud).toBeUndefined();
  });
});
