import { describe, expect, it } from 'vitest';

import type { SoundVersion } from '../api/sound-versions';
import {
  defaultMorphPair,
  metamorphClipName,
  morphableVersions,
} from './takeMetamorph';

function version(
  versionNumber: number,
  overrides: Partial<SoundVersion> = {},
): SoundVersion {
  return {
    id: `v${versionNumber}`,
    versionNumber,
    versionLabel: `Take ${versionNumber}`,
    status: 'READY',
    isActive: false,
    durationSec: 180,
    sourceFormat: 'wav',
    sourceBitrateKbps: null,
    sourceSampleRateHz: 44100,
    sourceBitDepth: 16,
    sourceChannels: 2,
    createdAt: '2026-10-01T00:00:00Z',
    ...overrides,
  };
}

describe('takeMetamorph helpers', () => {
  it('only offers READY versions, newest first', () => {
    const rows = morphableVersions([
      version(1),
      version(3, { status: 'PROCESSING' }),
      version(2),
    ]);
    expect(rows.map((v) => v.versionNumber)).toEqual([2, 1]);
  });

  it('pairs the live version with the newest other take', () => {
    expect(
      defaultMorphPair([
        version(1, { isActive: true }),
        version(2),
        version(3),
      ]),
    ).toEqual({ hostId: 'v1', donorId: 'v3' });
    expect(defaultMorphPair([version(1), version(2)])).toEqual({
      hostId: 'v1',
      donorId: 'v2',
    });
    expect(defaultMorphPair([version(1)])).toBeNull();
  });

  it('names the clip after both source versions and the settings', () => {
    expect(
      metamorphClipName(
        version(2, { versionLabel: 'Rough mix' }),
        version(5, { versionLabel: '' }),
        { amount: 0.604, curve: 'equal-power', sweep: 'rise' },
      ),
    ).toBe('Metamorph v2 “Rough mix” × v5 (60% equal power, rising)');
  });

  it('shortens long version labels', () => {
    const name = metamorphClipName(
      version(1, { versionLabel: 'A very long label for a mastered take' }),
      version(2),
      { amount: 1, curve: 'linear', sweep: 'hold' },
    );
    expect(name).toContain('v1 “A very long label for a…”');
    expect(name).toContain('(100% linear)');
  });
});
