import { describe, expect, it } from 'vitest';

import { ALL_VISUALIZER_MODES } from '@tahti-player/visualizer';

import {
  CHANNEL_VIZ_PACKS,
  channelHeaderShowsVisualizer,
  channelVizPack,
  channelVizPackFromJson,
  channelVizPackId,
  hasPresetTuning,
  vizPackModeAt,
  withChannelVizPack,
} from './channelVizPacks';

describe('CHANNEL_VIZ_PACKS', () => {
  it('has unique ids', () => {
    const ids = CHANNEL_VIZ_PACKS.map((pack) => pack.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only uses Advanced/Cymatics modes the visualizer package ships', () => {
    for (const pack of CHANNEL_VIZ_PACKS) {
      expect(pack.modes.length).toBeGreaterThan(0);
      expect(pack.rotateSeconds).toBeGreaterThan(0);
      for (const mode of pack.modes) {
        expect(ALL_VISUALIZER_MODES).toContain(mode);
      }
    }
  });
});

describe('pack storage in the visual settings map', () => {
  it('adds a namespaced key with empty settings and keeps tuning', () => {
    const map = withChannelVizPack({ AURORA: { speed: 1.5 } }, 'club-night');
    expect(map).toEqual({ AURORA: { speed: 1.5 }, 'pack:club-night': {} });
    expect(channelVizPackId(map)).toBe('club-night');
  });

  it('replaces an earlier pack instead of stacking', () => {
    const first = withChannelVizPack({}, 'club-night');
    const second = withChannelVizPack(first, 'signal-lab');
    expect(Object.keys(second)).toEqual(['pack:signal-lab']);
  });

  it('clears the pack with null or an unknown id', () => {
    const map = withChannelVizPack({ AURORA: {} }, 'club-night');
    expect(withChannelVizPack(map, null)).toEqual({ AURORA: {} });
    expect(withChannelVizPack(map, 'not-a-pack')).toEqual({ AURORA: {} });
  });

  it('ignores pack keys this build does not know', () => {
    expect(channelVizPackId({ 'pack:future': {} })).toBeNull();
    expect(
      channelVizPackId({ 'pack:future': {}, 'pack:deep-listening': {} }),
    ).toBe('deep-listening');
  });

  it('reads the pack from stored JSON and survives bad JSON', () => {
    expect(channelVizPackFromJson('{"pack:liquid-metal":{}}')?.label).toBe(
      'Liquid metal',
    );
    expect(channelVizPackFromJson('nope')).toBeNull();
    expect(channelVizPackFromJson('[]')).toBeNull();
    expect(channelVizPackFromJson(null)).toBeNull();
  });

  it('does not count a pack key as preset tuning', () => {
    expect(hasPresetTuning('{"pack:club-night":{}}')).toBe(false);
    expect(hasPresetTuning('{"AURORA":{"speed":2}}')).toBe(true);
    expect(hasPresetTuning(null)).toBe(false);
  });
});

describe('vizPackModeAt', () => {
  const pack = channelVizPack('club-night');

  it('starts on the first mode and rotates every rotateSeconds', () => {
    if (!pack) {
      throw new Error('missing pack');
    }
    const step = pack.rotateSeconds * 1000;
    expect(vizPackModeAt(pack, 0)).toBe('spectrum');
    expect(vizPackModeAt(pack, step - 1)).toBe('spectrum');
    expect(vizPackModeAt(pack, step)).toBe('radial');
    expect(vizPackModeAt(pack, step * 2)).toBe('quantum');
    expect(vizPackModeAt(pack, step * 3)).toBe('spectrum');
  });

  it('treats negative time as the start', () => {
    if (!pack) {
      throw new Error('missing pack');
    }
    expect(vizPackModeAt(pack, -5000)).toBe('spectrum');
  });
});

describe('channelHeaderShowsVisualizer', () => {
  it('is hidden behind gradient, solid, slideshow and valid video headers', () => {
    expect(channelHeaderShowsVisualizer({ headerStyle: 'GRADIENT' })).toBe(
      false,
    );
    expect(channelHeaderShowsVisualizer({})).toBe(false);
    expect(channelHeaderShowsVisualizer({ headerStyle: 'SOLID' })).toBe(false);
    expect(
      channelHeaderShowsVisualizer({
        headerStyle: 'VIDEO_LOOP',
        videoBackgroundUrl: 'https://cdn.example/loop.mp4',
      }),
    ).toBe(false);
    expect(
      channelHeaderShowsVisualizer({
        headerStyle: 'VIDEO_LOOP',
        galleryMode: 'STATIC_SLIDESHOW',
        slideshowImages: ['https://cdn.example/a.jpg'],
      }),
    ).toBe(false);
  });

  it('shows when a video header has no usable media', () => {
    expect(
      channelHeaderShowsVisualizer({
        headerStyle: 'VIDEO_LOOP',
        videoBackgroundUrl: null,
      }),
    ).toBe(true);
  });
});
