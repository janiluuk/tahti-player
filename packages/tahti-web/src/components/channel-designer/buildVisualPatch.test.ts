import { describe, expect, it } from 'vitest';

import type { ChannelVisual } from '../../api/channel-design';
import { DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS } from '../../content/nowPlayingOverlayPresets';
import { buildVisualPatch, type VisualPatchDraft } from './buildVisualPatch';

const scheme = { accent: '#111111', bg: '#222222' };

function draft(visual: Partial<ChannelVisual> | null): VisualPatchDraft {
  return {
    visual: visual as ChannelVisual | null,
    scheme: scheme,
    playerScheme: scheme,
    backgroundScheme: scheme,
    visualSettings: {},
    slideshowPreset: 'FADE',
    slideshowInterval: 8,
    slideshowTransition: 600,
    slideshowAutoplay: true,
    overlaySettings: DEFAULT_NOW_PLAYING_OVERLAY_SETTINGS,
  };
}

describe('buildVisualPatch', () => {
  it('returns null until the visual has loaded', () => {
    expect(buildVisualPatch(draft(null), null)).toBeNull();
  });

  it('uses the given backdrop url and defaults optional fields', () => {
    const patch = buildVisualPatch(
      draft({ visualPreset: 'AURORA' } as never),
      'https://x/y.mp4',
    );
    expect(patch?.videoBackgroundUrl).toBe('https://x/y.mp4');
    expect(patch?.usePlayerGradient).toBe(false);
    expect(patch?.playerColorSchemeJson).toBeNull();
    expect(patch?.backgroundColorSchemeJson).toBeNull();
    expect(patch?.channelLinks).toEqual([]);
    expect(patch?.textOverlayMode).toBe('NONE');
    expect(patch?.playerOverlayAlign).toBe('CENTER');
  });

  it('serialises gradient schemes only when their toggle is on', () => {
    const patch = buildVisualPatch(
      draft({ usePlayerGradient: true, useBackgroundGradient: true } as never),
      null,
    );
    expect(patch?.playerColorSchemeJson).toContain('#111111');
    expect(patch?.backgroundColorSchemeJson).toContain('#111111');
  });
});
