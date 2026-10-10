import { Midi } from '@tonejs/midi';

import type { KeySignatureHint, Phrase, PhraseNote } from './phraseAnalysis';

const PITCH_CLASS: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};
const MAJOR_NAMES = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
];
const MINOR_NAMES = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'Bb',
  'B',
];

export class MidiPhraseError extends Error {}

/**
 * @tonejs/midi reports a key signature as the major key sharing those
 * accidentals even when the scale flag is minor (A minor arrives as
 * `{ key: 'C', scale: 'minor' }`), so the minor tonic is the relative minor.
 */
export function keySignatureFromMidi(
  key: string,
  scale: string,
): KeySignatureHint | null {
  const majorPc = PITCH_CLASS[key];
  if (majorPc === undefined) {
    return null;
  }
  if (scale === 'minor') {
    return { tonic: MINOR_NAMES[(majorPc + 9) % 12]!, mode: 'minor' };
  }
  return { tonic: MAJOR_NAMES[majorPc]!, mode: 'major' };
}

export function parseMidiPhrase(data: ArrayBuffer | Uint8Array): Phrase {
  let midi: Midi;
  try {
    midi = new Midi(data);
  } catch {
    throw new MidiPhraseError('This file could not be read as MIDI.');
  }
  const ppq = midi.header.ppq || 480;
  const notes: PhraseNote[] = [];
  for (const track of midi.tracks) {
    if (track.instrument.percussion) {
      continue;
    }
    for (const note of track.notes) {
      notes.push({
        midi: note.midi,
        startBeat: note.ticks / ppq,
        durationBeats: note.durationTicks / ppq,
        velocity: note.velocity,
      });
    }
  }
  if (notes.length === 0) {
    throw new MidiPhraseError('No pitched notes found in this MIDI file.');
  }
  notes.sort((a, b) => a.startBeat - b.startBeat || a.midi - b.midi);

  const firstKey = midi.header.keySignatures[0];
  const keySignature = firstKey
    ? keySignatureFromMidi(firstKey.key, firstKey.scale)
    : null;
  const bpm = midi.header.tempos[0]?.bpm;
  const [numerator, denominator] =
    midi.header.timeSignatures[0]?.timeSignature ?? [];
  const beatsPerBar =
    numerator && denominator ? (numerator * 4) / denominator : undefined;

  return {
    notes,
    ...(bpm ? { bpm } : {}),
    ...(beatsPerBar ? { beatsPerBar } : {}),
    ...(keySignature ? { keySignature } : {}),
  };
}
