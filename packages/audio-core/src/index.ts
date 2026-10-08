export type AudioCoreGraph = {
  ctx: AudioContext;
  masterGain: GainNode;
  analyser: AnalyserNode;
};

let engine: AudioCoreGraph | null = null;
let externalAnalyser: AnalyserNode | null = null;
let externalCtx: AudioContext | null = null;
/** Gain on `externalCtx` so liveMixer/getMasterGain never cross contexts. */
let externalMasterGain: GainNode | null = null;

function createGraph(): AudioCoreGraph {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new Ctx();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 1;
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;
  masterGain.connect(analyser);
  analyser.connect(ctx.destination);
  return { ctx, masterGain, analyser };
}

export function ensureEngine(): AudioCoreGraph {
  if (!engine) {
    engine = createGraph();
  }
  return engine;
}

export function getEngineCtx(): AudioContext {
  if (externalCtx) {
    return externalCtx;
  }
  return ensureEngine().ctx;
}

/**
 * Destination gain for editor/mixer graphs. Always matches `getEngineCtx()` —
 * when the player bridge installs an external context, we create a gain on
 * that same context (never return the internal engine's gain).
 */
export function getMasterGain(): GainNode {
  if (externalCtx) {
    if (!externalMasterGain || externalMasterGain.context !== externalCtx) {
      externalMasterGain = externalCtx.createGain();
      externalMasterGain.gain.value = 1;
      // Tap the player analyser when present so viz hears the editor bus;
      // otherwise feed the shared destination so preview is audible.
      if (externalAnalyser && externalAnalyser.context === externalCtx) {
        try {
          externalMasterGain.connect(externalAnalyser);
        } catch {
          externalMasterGain.connect(externalCtx.destination);
        }
      } else {
        externalMasterGain.connect(externalCtx.destination);
      }
    }
    return externalMasterGain;
  }
  return ensureEngine().masterGain;
}

export function getAnalyser(): AnalyserNode {
  if (externalAnalyser) {
    return externalAnalyser;
  }
  return ensureEngine().analyser;
}

export function setExternalAnalyser(
  analyser: AnalyserNode | null,
  ctx?: AudioContext | null,
): void {
  externalAnalyser = analyser;
  externalCtx = ctx ?? (analyser?.context as AudioContext | null) ?? null;
  externalMasterGain = null;
}

export function clearExternalAnalyser(): void {
  externalAnalyser = null;
  externalCtx = null;
  externalMasterGain = null;
}

/** Prefer the isolated editor/engine graph (e.g. Studio Pro multitrack). */
export function preferInternalEngine(): void {
  clearExternalAnalyser();
}

export function samplePeakAndRMS(analyser: AnalyserNode): {
  peakDb: number;
  rmsDb: number;
} {
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  let peak = 0;
  let sumSq = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = Math.abs(buf[i]!);
    if (v > peak) {
      peak = v;
    }
    sumSq += buf[i]! * buf[i]!;
  }
  const rms = Math.sqrt(sumSq / buf.length);
  const toDb = (x: number) => (x <= 1e-8 ? -Infinity : 20 * Math.log10(x));
  return { peakDb: toDb(peak), rmsDb: toDb(rms) };
}

export async function resumeEngine(): Promise<void> {
  const ctx = getEngineCtx();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}
