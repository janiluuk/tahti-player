import { describe, expect, it } from 'vitest';

import {
  keySignatureFromMidi,
  MidiPhraseError,
  parseMidiPhrase,
} from './parseMidiPhrase';
import { smf } from './smfFixture';

describe('parseMidiPhrase', () => {
  it('reads notes in quarter-note beats with tempo and time signature', () => {
    const phrase = parseMidiPhrase(
      smf({ bpm: 90, timeSig: [6, 8], pitches: [60, 64, 67] }),
    );
    expect(phrase.notes).toEqual([
      { midi: 60, startBeat: 0, durationBeats: 1, velocity: 100 / 127 },
      { midi: 64, startBeat: 1, durationBeats: 1, velocity: 100 / 127 },
      { midi: 67, startBeat: 2, durationBeats: 1, velocity: 100 / 127 },
    ]);
    expect(phrase.bpm).toBeCloseTo(90, 1);
    expect(phrase.beatsPerBar).toBe(3);
    expect(phrase.keySignature).toBeUndefined();
  });

  it('turns a minor key signature into its own tonic', () => {
    const phrase = parseMidiPhrase(
      smf({ key: { sharps: 0, minor: true }, pitches: [57, 60, 64] }),
    );
    expect(phrase.keySignature).toEqual({ tonic: 'A', mode: 'minor' });
  });

  it('reads a flat major key signature', () => {
    const phrase = parseMidiPhrase(
      smf({ key: { sharps: -3, minor: false }, pitches: [63] }),
    );
    expect(phrase.keySignature).toEqual({ tonic: 'Eb', mode: 'major' });
  });

  it('skips percussion and rejects a drums-only file', () => {
    expect(() =>
      parseMidiPhrase(smf({ channel: 9, pitches: [36, 38] })),
    ).toThrow(MidiPhraseError);
  });

  it('rejects bytes that are not MIDI', () => {
    expect(() => parseMidiPhrase(new Uint8Array([1, 2, 3, 4]))).toThrow(
      'This file could not be read as MIDI.',
    );
  });
});

describe('keySignatureFromMidi', () => {
  it.each([
    ['G', 'major', { tonic: 'G', mode: 'major' }],
    ['G', 'minor', { tonic: 'E', mode: 'minor' }],
    ['Bb', 'minor', { tonic: 'G', mode: 'minor' }],
    ['F#', 'minor', { tonic: 'Eb', mode: 'minor' }],
  ] as const)('%s %s', (key, scale, expected) => {
    expect(keySignatureFromMidi(key, scale)).toEqual(expected);
  });

  it('returns null for an unknown key', () => {
    expect(keySignatureFromMidi('H', 'major')).toBeNull();
  });
});
