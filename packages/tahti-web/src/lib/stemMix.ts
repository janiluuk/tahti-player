export type StemChannel = {
  muted: boolean;
  solo: boolean;
  /** Fader level, 0..1. */
  level: number;
};

export type StemMix = Record<string, StemChannel>;

export const DEFAULT_STEM_CHANNEL: StemChannel = {
  muted: false,
  solo: false,
  level: 1,
};

const clampLevel = (level: number) =>
  Number.isFinite(level) ? Math.min(Math.max(level, 0), 1) : 1;

export function channelFor(mix: StemMix, label: string): StemChannel {
  return mix[label] ?? DEFAULT_STEM_CHANNEL;
}

/**
 * Gain each stem should play at. Any solo silences every non-solo stem
 * (mute still wins on a soloed stem, as on a hardware desk), otherwise
 * mute silences only that stem.
 */
export function effectiveStemGains(
  labels: string[],
  mix: StemMix,
): Record<string, number> {
  const anySolo = labels.some((label) => channelFor(mix, label).solo);
  const gains: Record<string, number> = {};
  for (const label of labels) {
    const channel = channelFor(mix, label);
    const audible = !channel.muted && (!anySolo || channel.solo);
    gains[label] = audible ? clampLevel(channel.level) : 0;
  }
  return gains;
}

export function toggleStemMute(mix: StemMix, label: string): StemMix {
  const channel = channelFor(mix, label);
  return { ...mix, [label]: { ...channel, muted: !channel.muted } };
}

/** `exclusive` (e.g. alt/shift-click) solos this stem and clears the rest. */
export function toggleStemSolo(
  mix: StemMix,
  label: string,
  exclusive = false,
): StemMix {
  const channel = channelFor(mix, label);
  const nextSolo = !channel.solo;
  if (!exclusive) {
    return { ...mix, [label]: { ...channel, solo: nextSolo } };
  }
  const next: StemMix = {};
  for (const [key, value] of Object.entries(mix)) {
    next[key] = { ...value, solo: false };
  }
  next[label] = { ...channel, solo: nextSolo };
  return next;
}

export function setStemLevel(
  mix: StemMix,
  label: string,
  level: number,
): StemMix {
  const channel = channelFor(mix, label);
  return { ...mix, [label]: { ...channel, level: clampLevel(level) } };
}
