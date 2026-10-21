/** Orchestrates the full matchering pipeline — mirrors
 * `matchering/stages.py`'s `main()` (`__match_levels` /
 * `__match_frequencies` / `__correct_levels` / `__finalize`), using
 * matchering's own default `Config`/`LimiterConfig` values
 * (`matchering/defaults.py`). Only the "with limiter" output is produced
 * (matchering can also emit "no limiter" / "no limiter, normalized"
 * variants — out of scope for this pass, see the plugin README). */
import { convolveSame, deriveFir } from './dsp/frequencies';
import {
  amplify,
  analyzeLevels,
  clip,
  loudestPieces,
  lrToMs,
  msToLr,
  normalizeStereo,
  pieceRmses,
  rms,
  rmsCoefficient,
  type StereoSignal,
} from './dsp/levels';
import {
  DEFAULT_LIMITER_CONFIG,
  limit,
  type LimiterConfig,
} from './dsp/limiter';

export type MasteringConfig = {
  sampleRate: number;
  threshold: number;
  minValue: number;
  maxPieceSizeSeconds: number;
  fftSize: number;
  linLogOversampling: number;
  rmsCorrectionSteps: number;
  lowessFrac: number;
  limiter: LimiterConfig;
};

export function defaultMasteringConfig(sampleRate: number): MasteringConfig {
  return {
    sampleRate,
    threshold: (2 ** 15 - 61) / 2 ** 15,
    minValue: 1e-6,
    maxPieceSizeSeconds: 15,
    fftSize: 4096,
    linLogOversampling: 4,
    rmsCorrectionSteps: 4,
    lowessFrac: 0.0375,
    limiter: DEFAULT_LIMITER_CONFIG,
  };
}

export type MasteringStage =
  'matching-levels' | 'matching-frequencies' | 'correcting-levels' | 'limiting';

export type MasteringInput = { stereo: StereoSignal; sampleRate: number };

function amplifyStereo(stereo: StereoSignal, gain: number): StereoSignal {
  return {
    left: amplify(stereo.left, gain),
    right: amplify(stereo.right, gain),
  };
}

/** Masters `target` to sound like `reference`, returning the resulting
 * stereo signal at `target`/`reference`'s shared sample rate. Both inputs
 * must already be at the same sample rate — decode both through one
 * shared-rate `AudioContext` before calling this (matchering itself
 * enforces a single fixed internal sample rate the same way, just via its
 * own ffmpeg-based loader instead). */
export function matchTracks(
  target: MasteringInput,
  reference: MasteringInput,
  config: MasteringConfig = defaultMasteringConfig(target.sampleRate),
  onProgress?: (stage: MasteringStage) => void,
): StereoSignal {
  if (target.sampleRate !== reference.sampleRate) {
    throw new Error(
      `Target and reference sample rates must match (got ${target.sampleRate}Hz and ${reference.sampleRate}Hz).`,
    );
  }
  const sampleRate = target.sampleRate;
  const minSamples = config.fftSize;
  if (
    target.stereo.left.length <= minSamples ||
    reference.stereo.left.length <= minSamples
  ) {
    throw new Error(
      `Both the track and the reference must be longer than ${(minSamples / sampleRate).toFixed(2)}s.`,
    );
  }

  const maxPieceSize = config.maxPieceSizeSeconds * sampleRate;

  // ── Match levels ─────────────────────────────────────────────────────
  onProgress?.('matching-levels');

  const {
    result: normalizedReference,
    coefficient: finalAmplitudeCoefficient,
  } = normalizeStereo(
    reference.stereo,
    config.threshold,
    config.minValue,
    false,
  );

  const targetAnalysis = analyzeLevels(target.stereo, maxPieceSize);
  const referenceAnalysis = analyzeLevels(normalizedReference, maxPieceSize);

  const levelCoefficient = rmsCoefficient(
    targetAnalysis.matchRms,
    referenceAnalysis.matchRms,
    config.minValue,
  );

  const targetMid = amplify(targetAnalysis.mid, levelCoefficient);
  const targetSide = amplify(targetAnalysis.side, levelCoefficient);
  const targetLoudestMid = targetAnalysis.loudestMid.map((piece) =>
    amplify(piece, levelCoefficient),
  );
  const targetLoudestSide = targetAnalysis.loudestSide.map((piece) =>
    amplify(piece, levelCoefficient),
  );

  // ── Match frequencies ────────────────────────────────────────────────
  onProgress?.('matching-frequencies');

  const midFir = deriveFir(
    targetLoudestMid,
    referenceAnalysis.loudestMid,
    sampleRate,
    config.fftSize,
    config.minValue,
    config.lowessFrac,
    config.linLogOversampling,
  );
  const sideFir = deriveFir(
    targetLoudestSide,
    referenceAnalysis.loudestSide,
    sampleRate,
    config.fftSize,
    config.minValue,
    config.lowessFrac,
    config.linLogOversampling,
  );

  let resultMid = convolveSame(targetMid, midFir);
  const resultSide = convolveSame(targetSide, sideFir);
  let resultStereo = msToLr(resultMid, resultSide);

  // ── Correct levels ───────────────────────────────────────────────────
  onProgress?.('correcting-levels');

  for (let step = 0; step < config.rmsCorrectionSteps; step++) {
    const clippedMid = clip(resultMid);
    const clippedRmses = pieceRmses(clippedMid, targetAnalysis.pieceRanges);
    const clippedAverageRms = rms(clippedRmses);
    const { matchRms: clippedMatchRms } = loudestPieces(
      clippedRmses,
      clippedAverageRms,
    );
    const coefficient = rmsCoefficient(
      clippedMatchRms,
      referenceAnalysis.matchRms,
      config.minValue,
    );
    resultMid = amplify(resultMid, coefficient);
    resultStereo = amplifyStereo(resultStereo, coefficient);
  }

  // ── Finalize (limiter) ───────────────────────────────────────────────
  onProgress?.('limiting');

  const limited = limit(
    resultStereo,
    sampleRate,
    config.threshold,
    config.limiter,
  );
  // The reference was boosted up to `threshold` before analysis (when it
  // started out quieter than that) so the level-matching math had more
  // headroom to work with; scaling the final result back down by that same
  // coefficient un-does that boost, so the output reflects the reference's
  // real relative loudness rather than its artificially peaked copy's.
  return amplifyStereo(limited, finalAmplitudeCoefficient);
}

// Re-exported for the worker/UI layer to construct inputs and report
// friendly progress labels without reaching into ./dsp/*.
export type { StereoSignal } from './dsp/levels';
export { lrToMs };
