import type { StudioSound, StudioSoundPatch } from '../../api/studio-types';

/** Limits mirror `SoundMetadataFieldsSchema` in `@tahti/shared`. */
export const BPM_MIN = 40;
export const BPM_MAX = 300;
export const MUSICAL_KEY_MAX_LENGTH = 12;
export const MIX_VERSION_MAX_LENGTH = 120;

/** Editor-side state for BPM, key, version and the AI label. BPM stays a
 * string so a half-typed value doesn't get coerced while editing. */
export type TrackAnalysisForm = {
  bpm: string;
  musicalKey: string;
  mixVersion: string;
  useDetectedBpmKey: boolean;
  isAiGenerated: boolean;
};

export const EMPTY_TRACK_ANALYSIS: TrackAnalysisForm = {
  bpm: '',
  musicalKey: '',
  mixVersion: '',
  useDetectedBpmKey: true,
  isAiGenerated: false,
};

export function analysisFormFromSound(sound: StudioSound): TrackAnalysisForm {
  return {
    bpm: sound.bpm != null ? String(sound.bpm) : '',
    musicalKey: sound.musicalKey ?? '',
    mixVersion: sound.mixVersion ?? '',
    useDetectedBpmKey: sound.useDetectedBpmKey ?? true,
    isAiGenerated: sound.isAiGenerated ?? false,
  };
}

export function bpmError(raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }
  if (!/^\d+$/.test(value)) {
    return 'BPM must be a whole number.';
  }
  const bpm = Number(value);
  if (bpm < BPM_MIN || bpm > BPM_MAX) {
    return `BPM must be between ${BPM_MIN} and ${BPM_MAX}.`;
  }
  return null;
}

export function musicalKeyError(raw: string): string | null {
  return raw.trim().length > MUSICAL_KEY_MAX_LENGTH
    ? `Key can be at most ${MUSICAL_KEY_MAX_LENGTH} characters.`
    : null;
}

export function mixVersionError(raw: string): string | null {
  return raw.trim().length > MIX_VERSION_MAX_LENGTH
    ? `Version can be at most ${MIX_VERSION_MAX_LENGTH} characters.`
    : null;
}

type AnalysisPatch = Pick<
  StudioSoundPatch,
  'bpm' | 'musicalKey' | 'mixVersion' | 'useDetectedBpmKey' | 'isAiGenerated'
>;

export function analysisPatchFromForm(
  form: TrackAnalysisForm,
): { ok: true; patch: AnalysisPatch } | { ok: false; error: string } {
  const error =
    bpmError(form.bpm) ??
    musicalKeyError(form.musicalKey) ??
    mixVersionError(form.mixVersion);
  if (error) {
    return { ok: false, error };
  }
  const bpm = form.bpm.trim();
  return {
    ok: true,
    patch: {
      bpm: bpm ? Number(bpm) : null,
      musicalKey: form.musicalKey.trim() || null,
      mixVersion: form.mixVersion.trim() || null,
      useDetectedBpmKey: form.useDetectedBpmKey,
      isAiGenerated: form.isAiGenerated,
    },
  };
}

/** "128 BPM, Am" from the audio analysis, or null when nothing was detected. */
export function detectedSummary(
  sound: Pick<StudioSound, 'bpmDetected' | 'keyDetected'>,
): string | null {
  const parts = [
    sound.bpmDetected != null ? `${sound.bpmDetected} BPM` : null,
    sound.keyDetected || null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}
