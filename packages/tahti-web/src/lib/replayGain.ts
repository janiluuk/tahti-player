import type { NativeAnalysisDetail } from './native-library/analysis';

export type NormalizationMode = 'off' | 'track' | 'album';

/** ReplayGain 2.0 reference loudness, used when only analysis loudness is known. */
export const REFERENCE_LUFS = -18;
export const MAX_BOOST_DB = 12;
export const MAX_CUT_DB = -24;

type GainSource = Pick<
  NativeAnalysisDetail,
  | 'loudnessLufs'
  | 'truePeakDbtp'
  | 'replaygainTrackGain'
  | 'replaygainTrackPeak'
  | 'replaygainAlbumGain'
  | 'replaygainAlbumPeak'
>;

export type Normalization = {
  /** Linear factor for the gain node; 1 means untouched. */
  factor: number;
  source: 'track' | 'album' | 'analysis' | null;
};

const UNCHANGED: Normalization = { factor: 1, source: null };

function finite(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Gain to apply to one local track. Album mode falls back to the track
 * value and track mode to the album value; with no ReplayGain tags the
 * loudness measured by analysis stands in. The result never pushes the
 * track's peak over full scale. */
export function normalizationFor(
  mode: NormalizationMode,
  detail: GainSource | null,
): Normalization {
  if (mode === 'off' || !detail) {
    return UNCHANGED;
  }
  const track = {
    gain: detail.replaygainTrackGain,
    peak: detail.replaygainTrackPeak,
  };
  const album = {
    gain: detail.replaygainAlbumGain,
    peak: detail.replaygainAlbumPeak,
  };
  const [first, second] = mode === 'album' ? [album, track] : [track, album];
  let gainDb: number;
  let peak: number | null;
  let source: Normalization['source'];
  if (finite(first.gain)) {
    gainDb = first.gain;
    peak = finite(first.peak) ? first.peak : null;
    source = mode;
  } else if (finite(second.gain)) {
    gainDb = second.gain;
    peak = finite(second.peak) ? second.peak : null;
    source = mode === 'album' ? 'track' : 'album';
  } else if (finite(detail.loudnessLufs)) {
    gainDb = REFERENCE_LUFS - detail.loudnessLufs;
    peak = finite(detail.truePeakDbtp)
      ? 10 ** (detail.truePeakDbtp / 20)
      : null;
    source = 'analysis';
  } else {
    return UNCHANGED;
  }
  const clamped = Math.min(MAX_BOOST_DB, Math.max(MAX_CUT_DB, gainDb));
  let factor = 10 ** (clamped / 20);
  if (peak !== null && peak > 0) {
    factor = Math.min(factor, 1 / peak);
  } else if (factor > 1) {
    factor = 1;
  }
  return { factor, source };
}
