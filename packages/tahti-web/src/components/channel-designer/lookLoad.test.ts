import { describe, expect, it } from 'vitest';

import type { ChannelVisual } from '../../api/channel-design';
import type { ChannelGallery } from '../../api/channel-gallery';
import { buildLoadedLook } from './lookLoad';
import { applyPresetToVisual } from './presetApply';

const gallery = {
  galleryMode: 'NONE',
  slideshowImages: ['https://a/1.jpg', 'https://a/2.jpg'],
  videoBackgroundUrl: null,
} as unknown as ChannelGallery;

describe('buildLoadedLook', () => {
  it('flags and corrects the unsupported MINIMAL preset', () => {
    const loaded = buildLoadedLook(
      { visualPreset: 'MINIMAL' } as ChannelVisual,
      gallery,
      {},
    );
    expect(loaded.presetNeedsCorrection).toBe(true);
    expect(loaded.shownVisual.visualPreset).toBe('AURORA');
    expect(loaded.snapshot.previewPreset).toBe('AURORA');
  });

  it('keeps a valid preset and applies defaults', () => {
    const loaded = buildLoadedLook(
      { visualPreset: 'AURORA' } as ChannelVisual,
      gallery,
      {},
    );
    expect(loaded.presetNeedsCorrection).toBe(false);
    expect(loaded.snapshot.galleryImages).toBe(
      'https://a/1.jpg\nhttps://a/2.jpg',
    );
    expect(loaded.snapshot.videoBackgroundUrl).toBe('');
    expect(loaded.snapshot.slideshowInterval).toBe(8);
    expect(loaded.snapshot.slideshowAutoplay).toBe(true);
  });
});

describe('applyPresetToVisual', () => {
  it('resets omitted fields but keeps overlay style and background preset', () => {
    const v = {
      visualPreset: 'AURORA',
      nowPlayingOverlayStyle: 'x',
      backgroundVisualPreset: 'y',
      usePlayerGradient: true,
      textOverlayText: 'hi',
    } as unknown as ChannelVisual;
    const next = applyPresetToVisual(v, { headerStyle: 'SOLID' } as never);
    expect(next.headerStyle).toBe('SOLID');
    expect(next.visualPreset).toBe('AURORA');
    expect(next.usePlayerGradient).toBe(false);
    expect(next.textOverlayText).toBe('');
    expect(next.nowPlayingOverlayStyle).toBe('x');
    expect(next.backgroundVisualPreset).toBe('y');
  });
});
