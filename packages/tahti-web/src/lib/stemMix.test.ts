import { describe, expect, it } from 'vitest';

import {
  effectiveStemGains,
  setStemLevel,
  toggleStemMute,
  toggleStemSolo,
  type StemMix,
} from './stemMix';

const labels = ['vocals', 'drums', 'bass', 'other'];

describe('effectiveStemGains', () => {
  it('plays every stem at full level by default', () => {
    expect(effectiveStemGains(labels, {})).toEqual({
      vocals: 1,
      drums: 1,
      bass: 1,
      other: 1,
    });
  });

  it('silences only the muted stem', () => {
    const mix = toggleStemMute({}, 'drums');
    expect(effectiveStemGains(labels, mix)).toEqual({
      vocals: 1,
      drums: 0,
      bass: 1,
      other: 1,
    });
  });

  it('silences every non-solo stem while any stem is soloed', () => {
    const mix = toggleStemSolo(toggleStemSolo({}, 'vocals'), 'bass');
    expect(effectiveStemGains(labels, mix)).toEqual({
      vocals: 1,
      drums: 0,
      bass: 1,
      other: 0,
    });
  });

  it('keeps a soloed stem silent when it is also muted', () => {
    const mix = toggleStemMute(toggleStemSolo({}, 'vocals'), 'vocals');
    expect(effectiveStemGains(labels, mix)).toEqual({
      vocals: 0,
      drums: 0,
      bass: 0,
      other: 0,
    });
  });

  it('scales audible stems by their level and clamps out-of-range levels', () => {
    let mix: StemMix = setStemLevel({}, 'vocals', 0.5);
    mix = setStemLevel(mix, 'drums', 3);
    mix = setStemLevel(mix, 'bass', -1);
    mix = setStemLevel(mix, 'other', Number.NaN);
    expect(effectiveStemGains(labels, mix)).toEqual({
      vocals: 0.5,
      drums: 1,
      bass: 0,
      other: 1,
    });
  });

  it('remembers a level through mute and unmute', () => {
    let mix = setStemLevel({}, 'bass', 0.3);
    mix = toggleStemMute(mix, 'bass');
    expect(effectiveStemGains(labels, mix).bass).toBe(0);
    mix = toggleStemMute(mix, 'bass');
    expect(effectiveStemGains(labels, mix).bass).toBe(0.3);
  });

  it('ignores mix entries for stems that are not in the set', () => {
    const mix = toggleStemSolo({}, 'piano');
    expect(effectiveStemGains(labels, mix).vocals).toBe(1);
  });
});

describe('toggleStemSolo', () => {
  it('adds to the solo set by default', () => {
    const mix = toggleStemSolo(toggleStemSolo({}, 'vocals'), 'drums');
    expect(mix.vocals?.solo).toBe(true);
    expect(mix.drums?.solo).toBe(true);
  });

  it('clears other solos when exclusive', () => {
    const mix = toggleStemSolo(toggleStemSolo({}, 'vocals'), 'drums', true);
    expect(mix.vocals?.solo).toBe(false);
    expect(mix.drums?.solo).toBe(true);
  });

  it('unsolos on a second toggle', () => {
    const mix = toggleStemSolo(toggleStemSolo({}, 'vocals'), 'vocals');
    expect(effectiveStemGains(labels, mix).drums).toBe(1);
  });
});
