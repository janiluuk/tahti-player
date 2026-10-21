import type { MorphCurve, MorphSweep } from '@tahti-player/audio-rack';

import type { SoundVersion } from '../api/sound-versions';

export const MORPH_CURVE_LABELS: Record<MorphCurve, string> = {
  linear: 'Linear',
  'equal-power': 'Equal power',
  's-curve': 'S-curve',
};

const LABEL_MAX = 24;

function shortLabel(version: SoundVersion): string {
  const label = version.versionLabel.trim();
  if (!label) {
    return `v${version.versionNumber}`;
  }
  const clipped =
    label.length > LABEL_MAX ? `${label.slice(0, LABEL_MAX - 1)}…` : label;
  return `v${version.versionNumber} “${clipped}”`;
}

/** Versions that can be decoded for a morph, newest first. */
export function morphableVersions(versions: SoundVersion[]): SoundVersion[] {
  return versions
    .filter((v) => v.status === 'READY')
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

/** Host defaults to the live version, donor to the newest other one. */
export function defaultMorphPair(
  versions: SoundVersion[],
): { hostId: string; donorId: string } | null {
  const ready = morphableVersions(versions);
  if (ready.length < 2) {
    return null;
  }
  const host = ready.find((v) => v.isActive) ?? ready[1];
  const donor = ready.find((v) => v.id !== host.id)!;
  return { hostId: host.id, donorId: donor.id };
}

/**
 * The clip and track name that records where a morph came from, so the
 * bounced revision still says which two takes it was made of.
 */
export function metamorphClipName(
  host: SoundVersion,
  donor: SoundVersion,
  settings: { amount: number; curve: MorphCurve; sweep: MorphSweep },
): string {
  const pct = Math.round(Math.max(0, Math.min(1, settings.amount)) * 100);
  const shape = `${MORPH_CURVE_LABELS[settings.curve].toLowerCase()}${settings.sweep === 'rise' ? ', rising' : ''}`;
  return `Metamorph ${shortLabel(host)} × ${shortLabel(donor)} (${pct}% ${shape})`;
}
