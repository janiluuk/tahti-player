/** Beats are quarter notes, so they stay tempo-independent. */
export type PhraseNote = {
  midi: number;
  startBeat: number;
  durationBeats: number;
  velocity: number;
};

export type KeySignatureHint = { tonic: string; mode: 'major' | 'minor' };

export type Phrase = {
  notes: readonly PhraseNote[];
  bpm?: number;
  beatsPerBar?: number;
  keySignature?: KeySignatureHint;
};

export type KeyEstimate = {
  tonic: string;
  mode: 'major' | 'minor';
  source: 'file' | 'estimate';
  /** Pearson correlation of the winning key profile, 0..1 after clamping. */
  confidence: number;
};

export type ContourShape =
  'rising' | 'falling' | 'arch' | 'valley' | 'wave' | 'static';

export type DensityLabel = 'sparse' | 'moderate' | 'busy' | 'very busy';

export type PhraseDescription = {
  noteCount: number;
  key: KeyEstimate | null;
  tempo: { bpm: number; source: 'file' } | null;
  range: {
    lowest: string;
    highest: string;
    spanSemitones: number;
    register: 'low' | 'mid' | 'high';
  };
  contour: {
    shape: ContourShape;
    motion: 'stepwise' | 'mixed' | 'leaping';
    largestLeapSemitones: number;
  };
  rhythm: {
    notesPerBeat: number;
    density: DensityLabel;
    lengthBeats: number;
    bars: number;
    beatsPerBar: number;
  };
};

const SHARP_NAMES = [
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
] as const;
const MAJOR_KEY_NAMES = [
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
] as const;
const MINOR_KEY_NAMES = [
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
] as const;

// Krumhansl-Kessler key profiles (Krumhansl 1990), index 0 = tonic.
const MAJOR_PROFILE = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];
const MINOR_PROFILE = [
  6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];

export function noteName(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  return `${SHARP_NAMES[pc]}${Math.floor(midi / 12) - 1}`;
}

function correlate(a: readonly number[], b: readonly number[]): number {
  const n = a.length;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i]! - meanA;
    const db = b[i]! - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

export function estimateKey(notes: readonly PhraseNote[]): KeyEstimate | null {
  const histogram = new Array<number>(12).fill(0);
  for (const note of notes) {
    histogram[((note.midi % 12) + 12) % 12]! += Math.max(
      note.durationBeats,
      0.01,
    );
  }
  if (histogram.every((v) => v === 0)) {
    return null;
  }

  let best: KeyEstimate | null = null;
  let bestScore = -Infinity;
  // Fixed iteration order (major before minor, C upward) keeps ties deterministic.
  for (const mode of ['major', 'minor'] as const) {
    const profile = mode === 'major' ? MAJOR_PROFILE : MINOR_PROFILE;
    for (let tonic = 0; tonic < 12; tonic++) {
      const rotated = histogram.map((_, i) => histogram[(i + tonic) % 12]!);
      const score = correlate(rotated, profile);
      if (score > bestScore) {
        bestScore = score;
        best = {
          tonic: (mode === 'major' ? MAJOR_KEY_NAMES : MINOR_KEY_NAMES)[tonic]!,
          mode,
          source: 'estimate',
          confidence: Math.max(0, Math.min(1, score)),
        };
      }
    }
  }
  return best;
}

/** Highest note per onset, so chords collapse to their top line. */
export function melodicLine(notes: readonly PhraseNote[]): PhraseNote[] {
  const byOnset = new Map<number, PhraseNote>();
  for (const note of notes) {
    const onset = Math.round(note.startBeat * 1000) / 1000;
    const current = byOnset.get(onset);
    if (!current || note.midi > current.midi) {
      byOnset.set(onset, note);
    }
  }
  return [...byOnset.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, note]) => note);
}

export function classifyContour(pitches: readonly number[]): ContourShape {
  if (pitches.length < 2) {
    return 'static';
  }
  const first = pitches[0]!;
  const last = pitches[pitches.length - 1]!;
  const max = Math.max(...pitches);
  const min = Math.min(...pitches);
  if (max - min <= 2) {
    return 'static';
  }

  const peakIndex = pitches.indexOf(max);
  const troughIndex = pitches.indexOf(min);
  const interior = (i: number) => i > 0 && i < pitches.length - 1;
  // Peak/trough must stand clearly above/below both ends to count as an arch/valley.
  const edgeMargin = Math.max(3, (max - min) / 3);

  let directionChanges = 0;
  let lastDirection = 0;
  for (let i = 1; i < pitches.length; i++) {
    const direction = Math.sign(pitches[i]! - pitches[i - 1]!);
    if (direction !== 0) {
      if (lastDirection !== 0 && direction !== lastDirection) {
        directionChanges++;
      }
      lastDirection = direction;
    }
  }

  if (
    interior(peakIndex) &&
    max - first >= edgeMargin &&
    max - last >= edgeMargin &&
    directionChanges <= 3
  ) {
    return 'arch';
  }
  if (
    interior(troughIndex) &&
    first - min >= edgeMargin &&
    last - min >= edgeMargin &&
    directionChanges <= 3
  ) {
    return 'valley';
  }
  if (last - first >= 3) {
    return 'rising';
  }
  if (first - last >= 3) {
    return 'falling';
  }
  return 'wave';
}

export function densityLabel(notesPerBeat: number): DensityLabel {
  if (notesPerBeat < 1) {
    return 'sparse';
  }
  if (notesPerBeat < 2) {
    return 'moderate';
  }
  if (notesPerBeat < 4) {
    return 'busy';
  }
  return 'very busy';
}

function registerFor(medianMidi: number): 'low' | 'mid' | 'high' {
  if (medianMidi < 55) {
    return 'low';
  }
  if (medianMidi > 74) {
    return 'high';
  }
  return 'mid';
}

function round(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function analyzePhrase(phrase: Phrase): PhraseDescription | null {
  const notes = phrase.notes.filter((n) => n.durationBeats >= 0);
  if (notes.length === 0) {
    return null;
  }

  const line = melodicLine(notes);
  const pitches = line.map((n) => n.midi);
  const allPitches = notes.map((n) => n.midi);
  const lowest = Math.min(...allPitches);
  const highest = Math.max(...allPitches);
  const sorted = [...allPitches].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;

  const intervals = pitches
    .slice(1)
    .map((p, i) => Math.abs(p - pitches[i]!))
    .filter((v) => v > 0);
  const stepShare =
    intervals.length === 0
      ? 1
      : intervals.filter((v) => v <= 2).length / intervals.length;
  const motion =
    stepShare >= 0.7 ? 'stepwise' : stepShare >= 0.4 ? 'mixed' : 'leaping';

  const startBeat = Math.min(...notes.map((n) => n.startBeat));
  const endBeat = Math.max(...notes.map((n) => n.startBeat + n.durationBeats));
  const lengthBeats = Math.max(endBeat - startBeat, 1);
  const beatsPerBar =
    phrase.beatsPerBar && phrase.beatsPerBar > 0 ? phrase.beatsPerBar : 4;
  const notesPerBeat = round(line.length / lengthBeats, 0.1);

  const key: KeyEstimate | null = phrase.keySignature
    ? { ...phrase.keySignature, source: 'file', confidence: 1 }
    : estimateKey(notes);

  return {
    noteCount: notes.length,
    key,
    tempo:
      phrase.bpm && phrase.bpm > 0
        ? { bpm: Math.round(phrase.bpm), source: 'file' }
        : null,
    range: {
      lowest: noteName(lowest),
      highest: noteName(highest),
      spanSemitones: highest - lowest,
      register: registerFor(median),
    },
    contour: {
      shape: classifyContour(pitches),
      motion,
      largestLeapSemitones: intervals.length ? Math.max(...intervals) : 0,
    },
    rhythm: {
      notesPerBeat,
      density: densityLabel(notesPerBeat),
      lengthBeats: round(lengthBeats, 0.25),
      bars: Math.max(1, Math.ceil(lengthBeats / beatsPerBar - 0.05)),
      beatsPerBar,
    },
  };
}

const CONTOUR_TEXT: Record<ContourShape, string> = {
  rising: 'rises overall',
  falling: 'falls overall',
  arch: 'arches up to a peak and back down',
  valley: 'dips down and climbs back up',
  wave: 'moves up and down around a centre',
  static: 'stays around one pitch',
};

function keyText(key: KeyEstimate): string {
  return `${key.tonic} ${key.mode}`;
}

export function describePhrase(d: PhraseDescription): string[] {
  const lines: string[] = [];
  if (d.key) {
    lines.push(
      d.key.source === 'file'
        ? `Key: ${keyText(d.key)} (from the file's key signature)`
        : `Key: likely ${keyText(d.key)} (estimate, ${Math.round(d.key.confidence * 100)}% match)`,
    );
  }
  lines.push(
    d.tempo
      ? `Tempo: ${d.tempo.bpm} BPM (from the file)`
      : 'Tempo: not set in the file',
  );
  lines.push(
    `Range: ${d.range.lowest} to ${d.range.highest} (${d.range.spanSemitones} semitones, ${d.range.register} register)`,
  );
  const leap =
    d.contour.largestLeapSemitones > 0
      ? `, largest leap ${d.contour.largestLeapSemitones} semitones`
      : '';
  lines.push(
    `Contour: ${CONTOUR_TEXT[d.contour.shape]}, ${d.contour.motion} motion${leap}`,
  );
  lines.push(
    `Rhythm: ${d.rhythm.density}, about ${d.rhythm.notesPerBeat} note${d.rhythm.notesPerBeat === 1 ? '' : 's'} per beat over ${d.rhythm.bars} bar${d.rhythm.bars === 1 ? '' : 's'}`,
  );
  return lines;
}

const CONTOUR_PROMPT: Record<ContourShape, string> = {
  rising: 'rising',
  falling: 'falling',
  arch: 'arch-shaped',
  valley: 'valley-shaped',
  wave: 'undulating',
  static: 'repeated-note',
};

const MOTION_PROMPT = {
  stepwise: 'stepwise',
  mixed: 'mix of steps and leaps',
  leaping: 'leaping',
} as const;

export function phraseToPrompt(d: PhraseDescription): string {
  const parts: string[] = [];
  parts.push(d.key ? `melody in ${keyText(d.key)}` : 'melody');
  if (d.tempo) {
    parts.push(`${d.tempo.bpm} BPM`);
  }
  parts.push(
    `${d.range.register} register (${d.range.lowest}-${d.range.highest})`,
  );
  parts.push(
    d.contour.motion === 'mixed'
      ? `${CONTOUR_PROMPT[d.contour.shape]} line with a ${MOTION_PROMPT.mixed}`
      : `${MOTION_PROMPT[d.contour.motion]} ${CONTOUR_PROMPT[d.contour.shape]} line`,
  );
  parts.push(`${d.rhythm.density} rhythm`);
  parts.push(`${d.rhythm.bars}-bar phrase`);
  return parts.join(', ');
}
