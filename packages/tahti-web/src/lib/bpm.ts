export const BPM_MIN = 40;
export const BPM_MAX = 300;
export const TAP_RESET_MS = 2000;
export const TAP_WINDOW = 8;

export type BpmRange = { min: number; max: number; factor: 1 | 2 | 0.5 };

export function roundBpm(bpm: number): number {
  return Math.round(bpm * 10) / 10;
}

export function bpmInputError(raw: string): string | null {
  if (raw.trim() === '') {
    return null;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return 'BPM must be a number.';
  }
  if (value !== 0 && (value < BPM_MIN || value > BPM_MAX)) {
    return `BPM must be between ${BPM_MIN} and ${BPM_MAX}.`;
  }
  return null;
}

export function halveBpm(bpm: number): number | null {
  const next = roundBpm(bpm / 2);
  return next >= BPM_MIN ? next : null;
}

export function doubleBpm(bpm: number): number | null {
  const next = roundBpm(bpm * 2);
  return next <= BPM_MAX ? next : null;
}

export function tempoFromTaps(taps: number[]): number | null {
  const recent = taps.slice(-TAP_WINDOW);
  if (recent.length < 2) {
    return null;
  }
  const span = recent[recent.length - 1]! - recent[0]!;
  if (span <= 0) {
    return null;
  }
  const bpm = (60000 * (recent.length - 1)) / span;
  return bpm >= BPM_MIN && bpm <= BPM_MAX ? roundBpm(bpm) : null;
}

export function addTap(taps: number[], now: number): number[] {
  const last = taps[taps.length - 1];
  if (last !== undefined && now - last > TAP_RESET_MS) {
    return [now];
  }
  return [...taps, now].slice(-TAP_WINDOW);
}

export function bpmRanges(
  bpm: number,
  tolerancePercent: number,
  halfDouble: boolean,
): BpmRange[] {
  const span = (value: number, factor: BpmRange['factor']): BpmRange => ({
    min: roundBpm(value * (1 - tolerancePercent / 100)),
    max: roundBpm(value * (1 + tolerancePercent / 100)),
    factor,
  });
  const ranges = [span(bpm, 1)];
  if (halfDouble) {
    if (bpm * 2 <= BPM_MAX) {
      ranges.push(span(bpm * 2, 2));
    }
    if (bpm / 2 >= BPM_MIN) {
      ranges.push(span(bpm / 2, 0.5));
    }
  }
  return ranges;
}

export function bpmShiftPercent(from: number, to: number): number {
  const candidates = [to, to / 2, to * 2];
  const best = candidates.reduce((closest, value) =>
    Math.abs(value - from) < Math.abs(closest - from) ? value : closest,
  );
  return Math.round(((best - from) / from) * 1000) / 10;
}
