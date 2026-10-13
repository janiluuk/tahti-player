/**
 * takeMetamorph - offline granular morph / identity-bleed between two takes of
 * the same song ("same song, new skin").
 *
 * The host take keeps its timeline and dynamics; the donor take lends its
 * timbre. Both are cut into Hann-windowed grains on a half-grain hop. For each
 * host grain the engine looks around the time-aligned spot in the donor for the
 * grain that sounds most alike (loudness + zero-crossing brightness, the same
 * FFT-free descriptors `audioAnalysis` uses), rescales it to the host grain's
 * energy, and blends the pair by the morph amount through a crossfade curve.
 * Grain choice uses the same deterministic LCG as the granular worklet, so a
 * preview and the bounced clip are sample-identical for the same settings.
 */

export type MorphCurve = 'linear' | 'equal-power' | 's-curve';

/** `hold` applies the amount across the whole take; `rise` sweeps from the
 *  host (0) at the start to the full amount at the end. */
export type MorphSweep = 'hold' | 'rise';

export interface TakeMorphOptions {
  /** 0 = pure host, 1 = the donor's grains carrying the host's dynamics. */
  amount: number;
  curve?: MorphCurve;
  sweep?: MorphSweep;
  /** Grain length in milliseconds. */
  grainMs?: number;
  /** How far either side of the aligned position to search the donor. */
  searchMs?: number;
  /** 0..1 randomness in the donor grain pick (0 = always the closest match). */
  jitter?: number;
  /** 0..1 how strongly donor grains are rescaled to the host grain's energy. */
  followHost?: number;
  seed?: number;
}

export const TAKE_MORPH_DEFAULTS = {
  curve: 'equal-power' as MorphCurve,
  sweep: 'hold' as MorphSweep,
  grainMs: 80,
  searchMs: 250,
  jitter: 0.25,
  followHost: 1,
  seed: 99991,
};

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** Host and donor gains for a morph position `t` (0..1) under a curve. */
export function morphGains(
  t: number,
  curve: MorphCurve,
): { host: number; donor: number } {
  const x = clamp(t, 0, 1);
  if (curve === 'equal-power') {
    return {
      host: Math.cos((x * Math.PI) / 2),
      donor: Math.sin((x * Math.PI) / 2),
    };
  }
  if (curve === 's-curve') {
    const s = x * x * (3 - 2 * x);
    return { host: 1 - s, donor: s };
  }
  return { host: 1 - x, donor: x };
}

function mixToMono(channels: Float32Array[]): Float32Array {
  if (channels.length === 1) {
    return channels[0];
  }
  const n = channels[0].length;
  const out = new Float32Array(n);
  for (const data of channels) {
    for (let i = 0; i < n; i += 1) {
      out[i] += data[i];
    }
  }
  const inv = 1 / channels.length;
  for (let i = 0; i < n; i += 1) {
    out[i] *= inv;
  }
  return out;
}

interface GrainFeatures {
  rms: number;
  zcr: number;
}

function grainFeatures(
  mono: Float32Array,
  start: number,
  len: number,
): GrainFeatures {
  const a = Math.max(0, start);
  const b = Math.min(mono.length, start + len);
  let sum = 0;
  let crossings = 0;
  for (let i = a; i < b; i += 1) {
    const v = mono[i];
    sum += v * v;
    if (i > a && v >= 0 !== mono[i - 1] >= 0) {
      crossings += 1;
    }
  }
  const n = b - a;
  return n > 0
    ? { rms: Math.sqrt(sum / n), zcr: crossings / n }
    : { rms: 0, zcr: 0 };
}

/**
 * Morph two takes given as per-channel sample arrays at the same sample rate.
 * Returns new arrays with the host's channel count and length.
 */
export function morphTakeChannels(
  host: Float32Array[],
  donor: Float32Array[],
  sampleRate: number,
  opts: TakeMorphOptions,
): Float32Array<ArrayBuffer>[] {
  if (host.length === 0 || sampleRate <= 0) {
    return [];
  }
  const o = { ...TAKE_MORPH_DEFAULTS, ...opts };
  const amount = clamp(o.amount, 0, 1);
  const hostLen = host[0].length;
  const out: Float32Array<ArrayBuffer>[] = host.map(
    () => new Float32Array(hostLen),
  );

  // Even length so the periodic Hann window at a half-grain hop sums to exactly 1.
  const grain = Math.max(
    64,
    2 * Math.round((o.grainMs / 1000) * sampleRate * 0.5),
  );
  const hop = grain / 2;
  const donorLen = donor[0]?.length ?? 0;
  if (amount === 0 || donorLen < grain) {
    host.forEach((data, c) => out[c].set(data));
    return out;
  }

  const win = new Float32Array(grain);
  for (let i = 0; i < grain; i += 1) {
    win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / grain);
  }

  const hostMono = mixToMono(host);
  const donorMono = mixToMono(donor);
  const donorFrames: GrainFeatures[] = [];
  for (let s = -hop; s < donorLen; s += hop) {
    donorFrames.push(grainFeatures(donorMono, s, grain));
  }
  let peakRms = 1e-9;
  for (const f of donorFrames) {
    peakRms = Math.max(peakRms, f.rms);
  }
  const hostFrames: GrainFeatures[] = [];
  let hostPeak = 1e-9;
  for (let s = -hop; s < hostLen; s += hop) {
    const f = grainFeatures(hostMono, s, grain);
    hostFrames.push(f);
    hostPeak = Math.max(hostPeak, f.rms);
  }

  const searchFrames = Math.max(
    0,
    Math.round(((o.searchMs / 1000) * sampleRate) / hop),
  );
  const jitter = clamp(o.jitter, 0, 1);
  const follow = clamp(o.followHost, 0, 1);
  let seed = o.seed >>> 0;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Starting one hop before 0 means every sample sits under exactly two grains.
  for (let frame = 0; frame < hostFrames.length; frame += 1) {
    const start = frame * hop - hop;
    const center = start + hop;
    const pos = hostLen > 1 ? clamp(center / (hostLen - 1), 0, 1) : 0;
    const t = o.sweep === 'rise' ? amount * pos : amount;
    const g = morphGains(t, o.curve);
    const hf = hostFrames[frame];

    const aligned = Math.round(((start * donorLen) / hostLen + hop) / hop);
    const lo = clamp(aligned - searchFrames, 0, donorFrames.length - 1);
    const hi = clamp(aligned + searchFrames, 0, donorFrames.length - 1);
    let best = lo;
    let bestScore = Infinity;
    for (let k = lo; k <= hi; k += 1) {
      const df = donorFrames[k];
      const score =
        Math.abs(df.rms / peakRms - hf.rms / hostPeak) +
        Math.abs(df.zcr - hf.zcr) * 4 +
        (Math.abs(k - aligned) / (searchFrames + 1)) * 0.25 +
        jitter * rng();
      if (score < bestScore) {
        bestScore = score;
        best = k;
      }
    }
    const donorStart = best * hop - hop;
    const dRms = donorFrames[best].rms;
    const ratio = dRms > 1e-9 ? clamp(hf.rms / dRms, 0, 8) : 0;
    const donorGain = g.donor * (1 + (ratio - 1) * follow);

    for (let c = 0; c < out.length; c += 1) {
      const h = host[c];
      const d = donor[Math.min(c, donor.length - 1)];
      const dst = out[c];
      for (let i = 0; i < grain; i += 1) {
        const j = start + i;
        if (j < 0 || j >= hostLen) {
          continue;
        }
        const dv = d[donorStart + i] ?? 0;
        dst[j] += win[i] * (g.host * h[j] + donorGain * dv);
      }
    }
  }
  return out;
}

function channelsOf(buffer: AudioBuffer): Float32Array[] {
  const out: Float32Array[] = [];
  for (let c = 0; c < buffer.numberOfChannels; c += 1) {
    out.push(buffer.getChannelData(c));
  }
  return out;
}

async function resampleTo(
  buffer: AudioBuffer,
  sampleRate: number,
): Promise<AudioBuffer> {
  if (buffer.sampleRate === sampleRate) {
    return buffer;
  }
  const ctx = new OfflineAudioContext(
    buffer.numberOfChannels,
    Math.max(1, Math.ceil(buffer.duration * sampleRate)),
    sampleRate,
  );
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();
  return ctx.startRendering();
}

/** Render a morph of two decoded takes into a new AudioBuffer at the host's
 *  sample rate and length (the donor is resampled first when rates differ). */
export async function renderTakeMorph(
  host: AudioBuffer,
  donor: AudioBuffer,
  opts: TakeMorphOptions,
): Promise<AudioBuffer> {
  const donorAtRate = await resampleTo(donor, host.sampleRate);
  const channels = morphTakeChannels(
    channelsOf(host),
    channelsOf(donorAtRate),
    host.sampleRate,
    opts,
  );
  const out = new AudioBuffer({
    numberOfChannels: host.numberOfChannels,
    length: host.length,
    sampleRate: host.sampleRate,
  });
  channels.forEach((data, c) => out.copyToChannel(data, c));
  return out;
}
