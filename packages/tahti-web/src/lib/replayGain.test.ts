import { describe, expect, it } from 'vitest';

import { normalizationFor } from './replayGain';

const none = {
  loudnessLufs: null,
  truePeakDbtp: null,
  replaygainTrackGain: null,
  replaygainTrackPeak: null,
  replaygainAlbumGain: null,
  replaygainAlbumPeak: null,
};

const db = (factor: number) => 20 * Math.log10(factor);

describe('normalizationFor', () => {
  it('leaves playback alone when off or when nothing is known', () => {
    expect(
      normalizationFor('off', { ...none, replaygainTrackGain: -6 }),
    ).toEqual({ factor: 1, source: null });
    expect(normalizationFor('track', none)).toEqual({
      factor: 1,
      source: null,
    });
    expect(normalizationFor('track', null).factor).toBe(1);
  });

  it('applies the track or album gain, falling back to the other one', () => {
    const tags = {
      ...none,
      replaygainTrackGain: -6,
      replaygainTrackPeak: 0.9,
      replaygainAlbumGain: -3,
      replaygainAlbumPeak: 0.95,
    };
    expect(db(normalizationFor('track', tags).factor)).toBeCloseTo(-6);
    expect(normalizationFor('album', tags)).toMatchObject({ source: 'album' });
    expect(db(normalizationFor('album', tags).factor)).toBeCloseTo(-3);
    expect(
      normalizationFor('album', { ...tags, replaygainAlbumGain: null }),
    ).toMatchObject({ source: 'track' });
  });

  it('never boosts past the peak, and does not boost when the peak is unknown', () => {
    const boosted = normalizationFor('track', {
      ...none,
      replaygainTrackGain: 6,
      replaygainTrackPeak: 0.8,
    });
    expect(boosted.factor).toBeCloseTo(1 / 0.8);
    expect(
      normalizationFor('track', { ...none, replaygainTrackGain: 6 }).factor,
    ).toBe(1);
  });

  it('uses analysis loudness against -18 LUFS when there are no tags', () => {
    const result = normalizationFor('track', {
      ...none,
      loudnessLufs: -10,
      truePeakDbtp: -0.5,
    });
    expect(result.source).toBe('analysis');
    expect(db(result.factor)).toBeCloseTo(-8);
  });

  it('caps extreme values at +12 / -24 dB', () => {
    expect(
      db(
        normalizationFor('track', { ...none, replaygainTrackGain: -40 }).factor,
      ),
    ).toBeCloseTo(-24);
    expect(
      db(
        normalizationFor('track', {
          ...none,
          replaygainTrackGain: 30,
          replaygainTrackPeak: 0.01,
        }).factor,
      ),
    ).toBeCloseTo(12);
  });
});
