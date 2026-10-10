import { describe, expect, it } from 'vitest';

import {
  analyzePhrase,
  classifyContour,
  densityLabel,
  describePhrase,
  estimateKey,
  melodicLine,
  noteName,
  phraseToPrompt,
  type PhraseNote,
} from './phraseAnalysis';

function line(pitches: number[], beatsEach = 1): PhraseNote[] {
  return pitches.map((midi, i) => ({
    midi,
    startBeat: i * beatsEach,
    durationBeats: beatsEach,
    velocity: 0.8,
  }));
}

const C_MAJOR_SCALE_ARCH = line([
  60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60,
]);
const A_MINOR_PHRASE = line(
  [69, 72, 71, 69, 68, 69, 64, 65, 64, 62, 60, 59, 57, 69, 57, 64],
  0.5,
);

describe('noteName', () => {
  it('names middle C as C4 and uses sharps', () => {
    expect(noteName(60)).toBe('C4');
    expect(noteName(61)).toBe('C#4');
    expect(noteName(21)).toBe('A0');
  });
});

describe('estimateKey', () => {
  it('finds C major from a C major scale', () => {
    expect(estimateKey(C_MAJOR_SCALE_ARCH)).toMatchObject({
      tonic: 'C',
      mode: 'major',
      source: 'estimate',
    });
  });

  it('finds A minor from a tonic-heavy A minor phrase', () => {
    expect(estimateKey(A_MINOR_PHRASE)).toMatchObject({
      tonic: 'A',
      mode: 'minor',
    });
  });

  it('is deterministic across calls', () => {
    expect(estimateKey(A_MINOR_PHRASE)).toEqual(estimateKey(A_MINOR_PHRASE));
  });

  it('returns null without notes', () => {
    expect(estimateKey([])).toBeNull();
  });
});

describe('melodicLine', () => {
  it('keeps the highest note of each chord', () => {
    const chord = [
      { midi: 60, startBeat: 0, durationBeats: 1, velocity: 1 },
      { midi: 67, startBeat: 0, durationBeats: 1, velocity: 1 },
      { midi: 64, startBeat: 0, durationBeats: 1, velocity: 1 },
      { midi: 65, startBeat: 1, durationBeats: 1, velocity: 1 },
    ];
    expect(melodicLine(chord).map((n) => n.midi)).toEqual([67, 65]);
  });
});

describe('classifyContour', () => {
  it.each([
    [[60, 62, 64, 67, 72], 'rising'],
    [[72, 69, 67, 64, 60], 'falling'],
    [[60, 64, 67, 72, 67, 64, 60], 'arch'],
    [[72, 67, 64, 60, 64, 67, 72], 'valley'],
    [[60, 61, 60, 61, 60], 'static'],
    [[60, 67, 60, 67, 60, 67, 61], 'wave'],
    [[64], 'static'],
  ] as const)('%j is %s', (pitches, shape) => {
    expect(classifyContour(pitches)).toBe(shape);
  });
});

describe('densityLabel', () => {
  it.each([
    [0.5, 'sparse'],
    [1, 'moderate'],
    [2, 'busy'],
    [4, 'very busy'],
  ] as const)('%d notes per beat is %s', (rate, label) => {
    expect(densityLabel(rate)).toBe(label);
  });
});

describe('analyzePhrase', () => {
  it('returns null for an empty phrase', () => {
    expect(analyzePhrase({ notes: [] })).toBeNull();
  });

  it('describes a one-octave C major arch at 1 note per beat', () => {
    const d = analyzePhrase({ notes: C_MAJOR_SCALE_ARCH, bpm: 100.4 })!;
    expect(d).toMatchObject({
      noteCount: 15,
      key: { tonic: 'C', mode: 'major', source: 'estimate' },
      tempo: { bpm: 100, source: 'file' },
      range: {
        lowest: 'C4',
        highest: 'C5',
        spanSemitones: 12,
        register: 'mid',
      },
      contour: { shape: 'arch', motion: 'stepwise', largestLeapSemitones: 2 },
      rhythm: { notesPerBeat: 1, density: 'moderate', bars: 4, beatsPerBar: 4 },
    });
  });

  it('prefers the file key signature and time signature', () => {
    const d = analyzePhrase({
      notes: C_MAJOR_SCALE_ARCH,
      keySignature: { tonic: 'A', mode: 'minor' },
      beatsPerBar: 3,
    })!;
    expect(d.key).toEqual({
      tonic: 'A',
      mode: 'minor',
      source: 'file',
      confidence: 1,
    });
    expect(d.tempo).toBeNull();
    expect(d.rhythm.bars).toBe(5);
  });

  it('reads eighth-note motion as busy', () => {
    const d = analyzePhrase({ notes: A_MINOR_PHRASE })!;
    expect(d.rhythm).toMatchObject({ notesPerBeat: 2, density: 'busy' });
    expect(d.contour.largestLeapSemitones).toBe(12);
    expect(d.contour.motion).toBe('mixed');
  });

  it('reports a low register for a bass line', () => {
    const d = analyzePhrase({ notes: line([36, 43, 36, 43, 41, 36]) })!;
    expect(d.range.register).toBe('low');
    expect(d.contour.motion).toBe('leaping');
  });
});

describe('describePhrase and phraseToPrompt', () => {
  it('produces stable text for the C major arch', () => {
    const d = analyzePhrase({ notes: C_MAJOR_SCALE_ARCH, bpm: 100 })!;
    const lines = describePhrase(d);
    expect(lines[0]).toMatch(/^Key: likely C major \(estimate, \d+% match\)$/);
    expect(lines.slice(1)).toEqual([
      'Tempo: 100 BPM (from the file)',
      'Range: C4 to C5 (12 semitones, mid register)',
      'Contour: arches up to a peak and back down, stepwise motion, largest leap 2 semitones',
      'Rhythm: moderate, about 1 note per beat over 4 bars',
    ]);
    expect(phraseToPrompt(d)).toBe(
      'melody in C major, 100 BPM, mid register (C4-C5), stepwise arch-shaped line, moderate rhythm, 4-bar phrase',
    );
  });

  it('omits tempo from the prompt when the file has none', () => {
    const d = analyzePhrase({ notes: A_MINOR_PHRASE })!;
    const prompt = phraseToPrompt(d);
    expect(prompt).not.toMatch(/BPM/);
    expect(prompt).toContain('mix of steps and leaps');
    expect(describePhrase(d)).toContain('Tempo: not set in the file');
  });
});
