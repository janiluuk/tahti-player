/** One summary level: per block of `blockSize` samples, the lowest and
 * highest sample and the mean square (for RMS). `meanSq` is null when the
 * source had no RMS (the server pyramid). */
export type SummaryLevel = {
  blockSize: number;
  min: Float32Array;
  max: Float32Array;
  meanSq: Float32Array | null;
};

export type ChannelPeaks = {
  /** Every sample of the channel, when kept; enables sample-level zoom. */
  raw: Float32Array | null;
  /** Ascending `blockSize`. */
  levels: SummaryLevel[];
};

export type WaveformData = {
  sampleRate: number;
  /** Samples per channel. */
  length: number;
  channels: ChannelPeaks[];
  /** True when built from the decoded file (real sample values, all
   * channels); false for the server's coarse mono placeholder. */
  exact: boolean;
};

export type ColumnPeak = { min: number; max: number; rms: number | null };

/** Block sizes of the summaries built from decoded audio. Each is 16× the
 * previous; anything finer than the first is read from the raw samples. */
export const SUMMARY_BLOCK_SIZES = [256, 4096, 65536] as const;

function summarize(
  source: Float32Array,
  blockSize: number,
  withRms: boolean,
): SummaryLevel {
  const count = Math.ceil(source.length / blockSize);
  const min = new Float32Array(count);
  const max = new Float32Array(count);
  const meanSq = withRms ? new Float32Array(count) : null;
  for (let b = 0; b < count; b++) {
    const start = b * blockSize;
    const end = Math.min(source.length, start + blockSize);
    let lo = Infinity;
    let hi = -Infinity;
    let sq = 0;
    for (let i = start; i < end; i++) {
      const v = source[i]!;
      if (v < lo) {
        lo = v;
      }
      if (v > hi) {
        hi = v;
      }
      sq += v * v;
    }
    min[b] = lo;
    max[b] = hi;
    if (meanSq) {
      meanSq[b] = sq / (end - start);
    }
  }
  return { blockSize, min, max, meanSq };
}

/** Merges `factor` blocks of `level` into one — builds the next coarser
 * level without touching the raw samples again. */
function coarsen(level: SummaryLevel, factor: number): SummaryLevel {
  const count = Math.ceil(level.min.length / factor);
  const min = new Float32Array(count);
  const max = new Float32Array(count);
  const meanSq = level.meanSq ? new Float32Array(count) : null;
  for (let b = 0; b < count; b++) {
    const start = b * factor;
    const end = Math.min(level.min.length, start + factor);
    let lo = Infinity;
    let hi = -Infinity;
    let sq = 0;
    for (let i = start; i < end; i++) {
      lo = Math.min(lo, level.min[i]!);
      hi = Math.max(hi, level.max[i]!);
      sq += level.meanSq ? level.meanSq[i]! : 0;
    }
    min[b] = lo;
    max[b] = hi;
    if (meanSq) {
      meanSq[b] = sq / (end - start);
    }
  }
  return { blockSize: level.blockSize * factor, min, max, meanSq };
}

/** Summary pyramid of decoded channels. `keepRaw` keeps the sample arrays
 * (no copy) for sample-level zoom; without it only the summaries stay. */
export function buildWaveformData(
  channelData: Float32Array[],
  sampleRate: number,
  keepRaw: boolean,
): WaveformData {
  const length = channelData[0]?.length ?? 0;
  const channels = channelData.map((samples) => {
    const levels: SummaryLevel[] = [
      summarize(samples, SUMMARY_BLOCK_SIZES[0], true),
    ];
    for (let i = 1; i < SUMMARY_BLOCK_SIZES.length; i++) {
      levels.push(
        coarsen(
          levels[i - 1]!,
          SUMMARY_BLOCK_SIZES[i]! / SUMMARY_BLOCK_SIZES[i - 1]!,
        ),
      );
    }
    return { raw: keepRaw ? samples : null, levels };
  });
  return { sampleRate, length, channels, exact: true };
}

/** The server's peaks pyramid (absolute peaks 0-255 of a mono downmix, one
 * array per level) as a placeholder until the file is decoded. */
export function waveformFromServerPyramid(
  pyramid: { sampleRate: number; durationSec: number; levels: number[][] },
  durationSec: number,
): WaveformData | null {
  const seconds = durationSec > 0 ? durationSec : pyramid.durationSec;
  const levels = pyramid.levels.filter((level) => level.length > 0);
  if (seconds <= 0 || levels.length === 0) {
    return null;
  }
  const sampleRate = pyramid.sampleRate > 0 ? pyramid.sampleRate : 8000;
  const length = Math.max(1, Math.round(seconds * sampleRate));
  const summaryLevels = levels
    .map((values) => {
      const min = new Float32Array(values.length);
      const max = new Float32Array(values.length);
      values.forEach((value, i) => {
        const amp = Math.min(1, Math.max(0, value / 255));
        min[i] = -amp;
        max[i] = amp;
      });
      return {
        blockSize: length / values.length,
        min,
        max,
        meanSq: null,
      };
    })
    .sort((a, b) => a.blockSize - b.blockSize);
  return {
    sampleRate,
    length,
    channels: [{ raw: null, levels: summaryLevels }],
    exact: false,
  };
}

/** Server fine peaks (int8 min/max per channel per bucket, see
 * `@tahti/audio-edit` `FinePeaksEncoder`) as waveform data. The bucket is
 * the "sample", so zoom stops at the peaks' own resolution. */
export function waveformFromFinePeaks(
  bytes: Int8Array,
  channels: number,
  bucketsPerSec: number,
): WaveformData | null {
  const count = Math.floor(bytes.length / (2 * channels));
  if (count === 0 || channels < 1) {
    return null;
  }
  const channelPeaks = Array.from({ length: channels }, (_, c) => {
    const min = new Float32Array(count);
    const max = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      min[i] = bytes[(i * channels + c) * 2]! / 128;
      max[i] = bytes[(i * channels + c) * 2 + 1]! / 127;
    }
    const base: SummaryLevel = { blockSize: 1, min, max, meanSq: null };
    const levels = [base, coarsen(base, 16)];
    levels.push(coarsen(levels[1]!, 16));
    return { raw: null, levels };
  });
  return {
    sampleRate: bucketsPerSec,
    length: count,
    channels: channelPeaks,
    exact: false,
  };
}

/** Lowest/highest sample (and RMS when known) of `channel` over the sample
 * range [start, end). Uses the coarsest summary whose blocks still fit in
 * the range, raw samples below the first summary, and the finest summary
 * when there are no raw samples. */
export function peakInRange(
  channel: ChannelPeaks,
  start: number,
  end: number,
): ColumnPeak | null {
  const span = end - start;
  if (span <= 0) {
    return null;
  }
  let level: SummaryLevel | null = null;
  for (const candidate of channel.levels) {
    if (candidate.blockSize <= span) {
      level = candidate;
    }
  }
  if (!level && channel.raw) {
    const raw = channel.raw;
    const from = Math.max(0, Math.floor(start));
    const to = Math.min(raw.length, Math.max(from + 1, Math.ceil(end)));
    if (from >= raw.length) {
      return null;
    }
    let lo = Infinity;
    let hi = -Infinity;
    let sq = 0;
    for (let i = from; i < to; i++) {
      const v = raw[i]!;
      if (v < lo) {
        lo = v;
      }
      if (v > hi) {
        hi = v;
      }
      sq += v * v;
    }
    return { min: lo, max: hi, rms: Math.sqrt(sq / (to - from)) };
  }
  level ??= channel.levels[0] ?? null;
  if (!level) {
    return null;
  }
  const count = level.min.length;
  const from = Math.max(0, Math.floor(start / level.blockSize));
  const to = Math.min(
    count,
    Math.max(from + 1, Math.ceil(end / level.blockSize)),
  );
  if (from >= count) {
    return null;
  }
  let lo = Infinity;
  let hi = -Infinity;
  let sq = 0;
  for (let i = from; i < to; i++) {
    lo = Math.min(lo, level.min[i]!);
    hi = Math.max(hi, level.max[i]!);
    sq += level.meanSq ? level.meanSq[i]! : 0;
  }
  return {
    min: lo,
    max: hi,
    rms: level.meanSq ? Math.sqrt(sq / (to - from)) : null,
  };
}

/** Nearest sample index to `sample` (within ±`radius`) where the signal
 * crosses zero, averaged over channels. `null` without raw samples or when
 * none is close. Cutting on a zero crossing avoids a click. */
export function nearestZeroCrossing(
  data: WaveformData,
  sample: number,
  radius: number,
): number | null {
  const raws = data.channels
    .map((channel) => channel.raw)
    .filter((raw): raw is Float32Array => raw !== null);
  if (raws.length === 0) {
    return null;
  }
  const valueAt = (i: number) =>
    raws.reduce((sum, raw) => sum + (raw[i] ?? 0), 0) / raws.length;
  const center = Math.round(sample);
  for (let offset = 0; offset <= radius; offset++) {
    for (const i of offset === 0
      ? [center]
      : [center - offset, center + offset]) {
      if (i <= 0 || i >= data.length) {
        continue;
      }
      const a = valueAt(i - 1);
      const b = valueAt(i);
      if (a === 0 || (a < 0 && b >= 0) || (a > 0 && b <= 0)) {
        return i;
      }
    }
  }
  return null;
}

/** Nearest server-listed zero crossing (seconds) to `sec`, within
 * `maxDistance`. */
export function nearestListedCrossing(
  crossings: readonly number[],
  sec: number,
  maxDistance: number,
): number | null {
  if (crossings.length === 0) {
    return null;
  }
  let lo = 0;
  let hi = crossings.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (crossings[mid]! < sec) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  const candidates = [crossings[lo]!, crossings[lo - 1]].filter(
    (value): value is number => value !== undefined,
  );
  const best = candidates.reduce((a, b) =>
    Math.abs(a - sec) <= Math.abs(b - sec) ? a : b,
  );
  return Math.abs(best - sec) <= maxDistance ? best : null;
}

/** Leading and trailing stretches quieter than `thresholdDb` (dBFS, on the
 * block peaks) as sample positions `[soundStart, soundEnd)`, with `padSec`
 * kept around the sound. `null` when the whole file is below it. */
export function audibleRange(
  data: WaveformData,
  thresholdDb = -48,
  padSec = 0.01,
): { start: number; end: number } | null {
  const threshold = Math.pow(10, thresholdDb / 20);
  const levels = data.channels.map((channel) => channel.levels[0]);
  const level = levels[0];
  if (!level) {
    return null;
  }
  const loud = (block: number) =>
    levels.some(
      (l) =>
        l !== undefined &&
        Math.max(Math.abs(l.min[block] ?? 0), Math.abs(l.max[block] ?? 0)) >=
          threshold,
    );
  const count = level.min.length;
  let first = 0;
  while (first < count && !loud(first)) {
    first++;
  }
  if (first === count) {
    return null;
  }
  let last = count - 1;
  while (last > first && !loud(last)) {
    last--;
  }
  const pad = padSec * data.sampleRate;
  return {
    start: Math.max(0, first * level.blockSize - pad),
    end: Math.min(data.length, (last + 1) * level.blockSize + pad),
  };
}
