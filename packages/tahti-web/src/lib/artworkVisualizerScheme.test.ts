import { describe, expect, it } from 'vitest';

import { artworkVisualizerScheme } from './artworkVisualizerScheme';

const CHANNEL_SCHEME = {
  accent: '#22D3EE',
  highlight: '#A78BFA',
  bg: '#0B1220',
  text: '#F8FAFC',
  muted: '#64748B',
};

describe('artworkVisualizerScheme', () => {
  it('keeps the channel scheme without artwork colour', () => {
    expect(artworkVisualizerScheme(CHANNEL_SCHEME, null)).toBe(CHANNEL_SCHEME);
  });

  it('keeps the channel scheme for grey artwork', () => {
    expect(artworkVisualizerScheme(CHANNEL_SCHEME, [128, 128, 128])).toBe(
      CHANNEL_SCHEME,
    );
    expect(artworkVisualizerScheme(CHANNEL_SCHEME, [130, 128, 126])).toBe(
      CHANNEL_SCHEME,
    );
  });

  it('takes accent from the artwork hue and a shifted highlight', () => {
    expect(artworkVisualizerScheme(CHANNEL_SCHEME, [0, 0, 255])).toEqual({
      ...CHANNEL_SCHEME,
      accent: '#0000FF',
      highlight: '#CF70FF',
    });
  });

  it('brightens and saturates dark, muddy artwork', () => {
    expect(artworkVisualizerScheme(CHANNEL_SCHEME, [60, 30, 20])).toEqual({
      ...CHANNEL_SCHEME,
      accent: '#C65C39',
      highlight: '#DFD890',
    });
  });
});
