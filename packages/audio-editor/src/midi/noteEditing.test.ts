import { describe, expect, it } from 'vitest';

import {
  addNote,
  deleteNote,
  MIN_NOTE_BEATS,
  moveNote,
  noteEvents,
  pitchName,
  quantizeNotes,
  resizeNote,
  snapBeat,
  type PianoNote,
} from './noteEditing';

const note = (id: string, over: Partial<PianoNote> = {}): PianoNote => ({
  id,
  pitch: 60,
  start: 0,
  duration: 1,
  velocity: 100,
  ...over,
});

describe('note editing', () => {
  it('adds a note in start order with clamped pitch, start and length', () => {
    const notes = addNote([note('a', { start: 2 })], {
      id: 'b',
      pitch: 200,
      start: -1,
      duration: 0,
    });
    expect(notes.map((n) => n.id)).toEqual(['b', 'a']);
    expect(notes[0]).toMatchObject({
      pitch: 127,
      start: 0,
      duration: MIN_NOTE_BEATS,
      velocity: 100,
    });
  });

  it('gives an added note a fresh id when none is passed', () => {
    const [n] = addNote([], { pitch: 64, start: 0, duration: 1 });
    expect(n.id).toMatch(/^n/);
  });

  it('moves one note and keeps the others untouched', () => {
    const before = [note('a'), note('b', { start: 1 })];
    const after = moveNote(before, 'b', { start: 3, pitch: 67 });
    expect(after.find((n) => n.id === 'b')).toMatchObject({
      start: 3,
      pitch: 67,
    });
    expect(after.find((n) => n.id === 'a')).toBe(before[0]);
  });

  it('never moves a note before the start or off the keyboard', () => {
    const [n] = moveNote([note('a')], 'a', { start: -4, pitch: -3 });
    expect(n).toMatchObject({ start: 0, pitch: 0 });
  });

  it('resizes with a floor of the shortest note', () => {
    expect(resizeNote([note('a')], 'a', 2.5)[0].duration).toBe(2.5);
    expect(resizeNote([note('a')], 'a', 0)[0].duration).toBe(MIN_NOTE_BEATS);
  });

  it('deletes by id', () => {
    expect(deleteNote([note('a'), note('b')], 'a').map((n) => n.id)).toEqual([
      'b',
    ]);
  });
});

describe('quantize', () => {
  it('snaps to the nearest grid line', () => {
    expect(snapBeat(0.37, 0.25)).toBe(0.25);
    expect(snapBeat(0.38, 0.25)).toBe(0.5);
    expect(snapBeat(0.38, 0)).toBe(0.38);
  });

  it('snaps starts and lengths, keeping at least one step of length', () => {
    const out = quantizeNotes(
      [
        note('a', { start: 1.1, duration: 0.05 }),
        note('b', { start: 0.49, duration: 0.8 }),
      ],
      0.5,
    );
    expect(out.map((n) => [n.id, n.start, n.duration])).toEqual([
      ['b', 0.5, 1],
      ['a', 1, 0.5],
    ]);
  });

  it('can keep lengths and limit itself to some notes', () => {
    const out = quantizeNotes(
      [note('a', { start: 1.1, duration: 0.3 }), note('b', { start: 2.2 })],
      1,
      { ids: ['a'], lengths: false },
    );
    expect(out.find((n) => n.id === 'a')).toMatchObject({
      start: 1,
      duration: 0.3,
    });
    expect(out.find((n) => n.id === 'b')?.start).toBe(2.2);
  });

  it('is a no-op copy for a missing grid', () => {
    const notes = [note('a', { start: 1.1 })];
    const out = quantizeNotes(notes, 0);
    expect(out).toEqual(notes);
    expect(out).not.toBe(notes);
  });
});

describe('noteEvents', () => {
  it('converts beats to seconds at the tempo, offs before ons at a tie', () => {
    const events = noteEvents(
      [
        note('a', { start: 0, duration: 1 }),
        note('b', { start: 1, duration: 1 }),
      ],
      120,
      0,
      8,
    );
    expect(events.map((e) => [e.timeSec, e.type])).toEqual([
      [0, 'on'],
      [0.5, 'off'],
      [0.5, 'on'],
      [1, 'off'],
    ]);
  });

  it('plays only the window and cuts notes at its edges', () => {
    const events = noteEvents(
      [
        note('early', { start: 0, duration: 1 }),
        note('straddle', { start: 3, duration: 2, pitch: 62 }),
        note('late', { start: 9, duration: 1 }),
      ],
      60,
      4,
      8,
    );
    expect(events).toEqual([
      { timeSec: 0, type: 'on', pitch: 62, velocity: 100 },
      { timeSec: 1, type: 'off', pitch: 62, velocity: 0 },
    ]);
  });
});

describe('pitchName', () => {
  it('names middle C as C4', () => {
    expect(pitchName(60)).toBe('C4');
    expect(pitchName(69)).toBe('A4');
    expect(pitchName(61)).toBe('C#4');
  });
});
