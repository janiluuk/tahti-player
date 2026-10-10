import type { AudioClip } from '../state/editorStore';
import {
  DEFAULT_VELOCITY,
  MIN_NOTE_BEATS,
  newNoteId,
  PITCH_MAX,
  PITCH_MIN,
  type PianoNote,
} from './noteEditing';

export const BEATS_PER_BAR = 4;
export const MIDI_CLIP_COLOR = '#22c55e';

export const isMidiClip = (clip: Pick<AudioClip, 'sourceKind'>): boolean =>
  clip.sourceKind === 'piano-roll';

/** The tempo a MIDI clip's beats are measured in. Notes are stored in beats,
 *  so the clip keeps the tempo it was drawn at; changing the project tempo
 *  later does not stretch notes under an already-placed clip. */
export const midiClipBpm = (
  clip: Pick<AudioClip, 'sourceBpm'>,
  fallbackBpm: number,
): number =>
  clip.sourceBpm && clip.sourceBpm > 0 ? clip.sourceBpm : fallbackBpm;

/** The slice of the roll a clip plays, in source beats. A split MIDI clip
 *  keeps every note and plays a window of them, like a split audio clip. */
export function midiClipWindow(
  clip: Pick<AudioClip, 'offsetIntoSource' | 'durationSec' | 'sourceBpm'>,
  fallbackBpm: number,
): { fromBeat: number; toBeat: number; bpm: number } {
  const bpm = midiClipBpm(clip, fallbackBpm);
  const beatsPerSec = bpm / 60;
  const fromBeat = (clip.offsetIntoSource ?? 0) * beatsPerSec;
  return {
    fromBeat,
    toBeat: fromBeat + clip.durationSec * beatsPerSec,
    bpm,
  };
}

/** A MIDI clip has no audio until it is bounced; the empty blob keeps the
 *  clip a valid AudioClip for the store, autosave hashing and undo. */
const emptyAudio = () => new Blob([], { type: 'audio/wav' });

export function createMidiClip(opts: {
  trackId: string;
  startSec: number;
  bpm: number;
  bars?: number;
  notes?: PianoNote[];
  label?: string;
}): Omit<AudioClip, 'id'> {
  const bars = opts.bars ?? 2;
  const durationSec = (bars * BEATS_PER_BAR * 60) / opts.bpm;
  return {
    trackId: opts.trackId,
    label: opts.label ?? 'MIDI clip',
    audioBlob: emptyAudio(),
    mimeType: 'audio/wav',
    sourceDuration: durationSec,
    offsetIntoSource: 0,
    durationSec,
    startSec: Math.max(0, opts.startSec),
    color: MIDI_CLIP_COLOR,
    sourceKind: 'piano-roll',
    sourcePianoRoll: opts.notes ?? [],
    sourceBpm: opts.bpm,
  };
}

/** Length change for a MIDI clip, in bars from its window start. */
export function midiClipLengthUpdate(
  clip: Pick<AudioClip, 'offsetIntoSource' | 'sourceBpm'>,
  bars: number,
  fallbackBpm: number,
): Pick<AudioClip, 'durationSec' | 'sourceDuration'> {
  const bpm = midiClipBpm(clip, fallbackBpm);
  const durationSec = (Math.max(1, bars) * BEATS_PER_BAR * 60) / bpm;
  return {
    durationSec,
    sourceDuration: (clip.offsetIntoSource ?? 0) + durationSec,
  };
}

const finite = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

/** Notes read back from a saved project. Anything malformed is dropped rather
 *  than repaired: a hand-edited or truncated manifest must not crash the roll
 *  or the synth with NaN pitches. */
export function sanitizePianoNotes(raw: unknown): PianoNote[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: PianoNote[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const n = item as Partial<PianoNote>;
    if (!finite(n.pitch) || !finite(n.start) || !finite(n.duration)) {
      continue;
    }
    if (n.pitch < PITCH_MIN || n.pitch > PITCH_MAX || n.start < 0) {
      continue;
    }
    out.push({
      id: typeof n.id === 'string' && n.id ? n.id : newNoteId(),
      pitch: Math.round(n.pitch),
      start: n.start,
      duration: Math.max(MIN_NOTE_BEATS, n.duration),
      velocity: finite(n.velocity)
        ? Math.min(127, Math.max(1, Math.round(n.velocity)))
        : DEFAULT_VELOCITY,
    });
  }
  return out;
}

export function reviveMidiClip<T extends Partial<AudioClip>>(clip: T): T {
  if (clip.sourceKind !== 'piano-roll') {
    return clip;
  }
  return { ...clip, sourcePianoRoll: sanitizePianoNotes(clip.sourcePianoRoll) };
}
