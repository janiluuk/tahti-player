import type { PianoNote } from '../state/stubs';

export type { PianoNote };

export const PITCH_MIN = 0;
export const PITCH_MAX = 127;
/** Shortest note the roll keeps, in beats (a 1/32 note). */
export const MIN_NOTE_BEATS = 0.125;
export const DEFAULT_VELOCITY = 100;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const clampPitch = (p: number) => clamp(Math.round(p), PITCH_MIN, PITCH_MAX);

const clampVelocity = (v: number) => clamp(Math.round(v), 1, 127);

const byStartThenPitch = (a: PianoNote, b: PianoNote) =>
  a.start - b.start || a.pitch - b.pitch;

let noteSeq = 0;
export const newNoteId = (): string =>
  `n${Date.now().toString(36)}${(noteSeq++).toString(36)}`;

export const snapBeat = (beat: number, gridBeats: number): number =>
  gridBeats > 0 ? Math.round(beat / gridBeats) * gridBeats : beat;

/** Floor to the grid, so a click lands in the cell under the pointer. */
export const floorBeat = (beat: number, gridBeats: number): number =>
  gridBeats > 0 ? Math.floor(beat / gridBeats) * gridBeats : beat;

export function addNote(
  notes: readonly PianoNote[],
  note: Omit<PianoNote, 'id' | 'velocity'> & {
    id?: string;
    velocity?: number;
  },
): PianoNote[] {
  const next: PianoNote = {
    id: note.id ?? newNoteId(),
    pitch: clampPitch(note.pitch),
    start: Math.max(0, note.start),
    duration: Math.max(MIN_NOTE_BEATS, note.duration),
    velocity: clampVelocity(note.velocity ?? DEFAULT_VELOCITY),
  };
  return [...notes, next].sort(byStartThenPitch);
}

export function moveNote(
  notes: readonly PianoNote[],
  id: string,
  to: { start?: number; pitch?: number },
): PianoNote[] {
  return notes
    .map((n) =>
      n.id === id
        ? {
            ...n,
            start: to.start === undefined ? n.start : Math.max(0, to.start),
            pitch: to.pitch === undefined ? n.pitch : clampPitch(to.pitch),
          }
        : n,
    )
    .sort(byStartThenPitch);
}

export function resizeNote(
  notes: readonly PianoNote[],
  id: string,
  duration: number,
): PianoNote[] {
  return notes.map((n) =>
    n.id === id ? { ...n, duration: Math.max(MIN_NOTE_BEATS, duration) } : n,
  );
}

export function deleteNote(
  notes: readonly PianoNote[],
  id: string,
): PianoNote[] {
  return notes.filter((n) => n.id !== id);
}

/** Snap note starts (and, unless `lengths` is false, lengths) to the grid.
 *  A length never rounds down to zero: it keeps at least one grid step. */
export function quantizeNotes(
  notes: readonly PianoNote[],
  gridBeats: number,
  opts: { ids?: readonly string[]; lengths?: boolean } = {},
): PianoNote[] {
  if (!(gridBeats > 0)) {
    return notes.slice();
  }
  const only = opts.ids ? new Set(opts.ids) : null;
  const lengths = opts.lengths ?? true;
  return notes
    .map((n) => {
      if (only && !only.has(n.id)) {
        return n;
      }
      return {
        ...n,
        start: Math.max(0, snapBeat(n.start, gridBeats)),
        duration: lengths
          ? Math.max(gridBeats, snapBeat(n.duration, gridBeats))
          : n.duration,
      };
    })
    .sort(byStartThenPitch);
}

export interface NoteEvent {
  timeSec: number;
  type: 'on' | 'off';
  pitch: number;
  velocity: number;
}

/** Note on/off events in seconds from `fromBeat`, for the notes sounding in
 *  [fromBeat, toBeat). Notes are cut at both window edges. Offs sort before ons
 *  at the same instant so a repeated pitch re-triggers instead of being cut by
 *  its own predecessor's release. */
export function noteEvents(
  notes: readonly PianoNote[],
  bpm: number,
  fromBeat: number,
  toBeat: number,
): NoteEvent[] {
  const secPerBeat = 60 / bpm;
  const events: NoteEvent[] = [];
  for (const n of notes) {
    const start = Math.max(n.start, fromBeat);
    const end = Math.min(n.start + n.duration, toBeat);
    if (end <= start) {
      continue;
    }
    events.push(
      {
        timeSec: (start - fromBeat) * secPerBeat,
        type: 'on',
        pitch: n.pitch,
        velocity: n.velocity,
      },
      {
        timeSec: (end - fromBeat) * secPerBeat,
        type: 'off',
        pitch: n.pitch,
        velocity: 0,
      },
    );
  }
  return events.sort(
    (a, b) =>
      a.timeSec - b.timeSec ||
      (a.type === b.type ? 0 : a.type === 'off' ? -1 : 1),
  );
}

const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

/** Scientific pitch name, with middle C (60) as C4. */
export const pitchName = (pitch: number): string =>
  `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`;

export const isBlackKey = (pitch: number): boolean =>
  [1, 3, 6, 8, 10].includes(pitch % 12);
