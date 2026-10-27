export type KeyNotation = 'musical' | 'camelot' | 'openKey';

export type MusicalKey = { tonic: number; minor: boolean };

export type HarmonicRelation = 'same' | 'up' | 'down' | 'relative';

export const KEY_NOTATIONS: ReadonlyArray<{ id: KeyNotation; label: string }> =
  [
    { id: 'musical', label: 'Musical (Am)' },
    { id: 'camelot', label: 'Camelot (8A)' },
    { id: 'openKey', label: 'Open Key (1m)' },
  ];

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const LETTERS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const CAMELOT_MAJOR_TONIC = [11, 6, 1, 8, 3, 10, 5, 0, 7, 2, 9, 4];

export function parseKey(raw: string | null | undefined): MusicalKey | null {
  const text = (raw ?? '').trim();
  if (!text) {
    return null;
  }
  const camelot = /^(\d{1,2})\s*([ab])$/i.exec(text);
  if (camelot) {
    const number = Number(camelot[1]);
    if (number >= 1 && number <= 12) {
      const major = CAMELOT_MAJOR_TONIC[number - 1]!;
      return camelot[2]!.toUpperCase() === 'B'
        ? { tonic: major, minor: false }
        : { tonic: (major + 9) % 12, minor: true };
    }
  }
  const openKey = /^(\d{1,2})\s*([dm])$/i.exec(text);
  if (openKey) {
    const number = Number(openKey[1]);
    if (number >= 1 && number <= 12) {
      return parseKey(
        `${((number + 6) % 12) + 1}${openKey[2]!.toLowerCase() === 'd' ? 'B' : 'A'}`,
      );
    }
  }
  const base = LETTERS[text[0]!.toUpperCase()];
  if (base === undefined) {
    return null;
  }
  let rest = text.slice(1);
  let shift = 0;
  if (rest.startsWith('#') || rest.startsWith('♯')) {
    shift = 1;
    rest = rest.slice(1);
  } else if (rest.startsWith('b') || rest.startsWith('♭')) {
    shift = -1;
    rest = rest.slice(1);
  }
  const tail = rest.trim().toLowerCase();
  let minor: boolean;
  if (tail === '' || tail === 'maj' || tail === 'major') {
    minor = false;
  } else if (
    tail === 'm' ||
    tail === 'min' ||
    tail === 'minor' ||
    tail === '-'
  ) {
    minor = true;
  } else {
    return null;
  }
  return { tonic: (base + shift + 12) % 12, minor };
}

export function keyName(key: MusicalKey): string {
  return `${NOTES[key.tonic % 12]}${key.minor ? 'm' : ''}`;
}

export function camelotNumber(key: MusicalKey): number {
  const majorTonic = key.minor ? (key.tonic + 3) % 12 : key.tonic;
  return CAMELOT_MAJOR_TONIC.indexOf(majorTonic) + 1;
}

export function camelotCode(key: MusicalKey): string {
  return `${camelotNumber(key)}${key.minor ? 'A' : 'B'}`;
}

export function openKeyCode(key: MusicalKey): string {
  return `${((camelotNumber(key) + 4) % 12) + 1}${key.minor ? 'm' : 'd'}`;
}

export function formatKey(
  raw: string | null | undefined,
  notation: KeyNotation,
): string | null {
  const key = parseKey(raw);
  if (!key) {
    return raw?.trim() || null;
  }
  if (notation === 'camelot') {
    return camelotCode(key);
  }
  if (notation === 'openKey') {
    return openKeyCode(key);
  }
  return keyName(key);
}

export function keyHue(raw: string | null | undefined): number | null {
  const key = parseKey(raw);
  return key ? (camelotNumber(key) - 1) * 30 : null;
}

function fromCamelot(number: number, minor: boolean): MusicalKey {
  const wrapped = ((number - 1 + 12) % 12) + 1;
  return parseKey(`${wrapped}${minor ? 'A' : 'B'}`)!;
}

export function harmonicNeighbours(
  raw: string | null | undefined,
): Array<{ key: MusicalKey; relation: HarmonicRelation }> {
  const key = parseKey(raw);
  if (!key) {
    return [];
  }
  const number = camelotNumber(key);
  return [
    { key, relation: 'same' },
    { key: fromCamelot(number + 1, key.minor), relation: 'up' },
    { key: fromCamelot(number - 1, key.minor), relation: 'down' },
    { key: fromCamelot(number, !key.minor), relation: 'relative' },
  ];
}

export const RELATION_LABEL: Record<HarmonicRelation, string> = {
  same: 'Same key',
  up: 'One up the wheel',
  down: 'One down the wheel',
  relative: 'Relative major/minor',
};

export function keyInputError(raw: string): string | null {
  if (raw.trim() === '') {
    return null;
  }
  return parseKey(raw) ? null : 'Use a key like Am, F#, Bbm, 8A or 1m.';
}
