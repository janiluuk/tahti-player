import { describe, expect, it } from 'vitest';

import {
  camelotCode,
  formatKey,
  harmonicNeighbours,
  keyHue,
  keyInputError,
  keyName,
  openKeyCode,
  parseKey,
} from './musicalKey';

describe('parseKey', () => {
  it.each([
    ['Am', 'Am'],
    ['A minor', 'Am'],
    ['Bbm', 'A#m'],
    ['Db', 'C#'],
    ['F#', 'F#'],
    ['c', 'C'],
    ['8A', 'Am'],
    ['8B', 'C'],
    ['1A', 'G#m'],
    ['12B', 'E'],
    ['1m', 'Am'],
    ['1d', 'C'],
    ['6d', 'B'],
    ['12d', 'F'],
    ['E♭ major', 'D#'],
  ])('reads %s as %s', (raw, expected) => {
    expect(keyName(parseKey(raw)!)).toBe(expected);
  });

  it.each(['', 'H', '13A', 'Am7', 'C sharp'])('rejects %j', (raw) => {
    expect(parseKey(raw)).toBeNull();
  });
});

describe('notation', () => {
  it('maps every key to the Camelot and Open Key wheels and back', () => {
    const names = ['C', 'G', 'D', 'Am', 'Em', 'F#m', 'A#'];
    for (const name of names) {
      const key = parseKey(name)!;
      expect(keyName(parseKey(camelotCode(key))!)).toBe(name);
      expect(keyName(parseKey(openKeyCode(key))!)).toBe(name);
    }
    expect(camelotCode(parseKey('Am')!)).toBe('8A');
    expect(openKeyCode(parseKey('Am')!)).toBe('1m');
    expect(openKeyCode(parseKey('G')!)).toBe('2d');
  });

  it('formats in the chosen notation and leaves unknown text alone', () => {
    expect(formatKey('A minor', 'musical')).toBe('Am');
    expect(formatKey('Am', 'camelot')).toBe('8A');
    expect(formatKey('Am', 'openKey')).toBe('1m');
    expect(formatKey('weird', 'camelot')).toBe('weird');
    expect(formatKey(null, 'camelot')).toBeNull();
  });

  it('gives the wheel position a colour', () => {
    expect(keyHue('1A')).toBe(0);
    expect(keyHue('8B')).toBe(210);
    expect(keyHue('?')).toBeNull();
  });
});

describe('harmonicNeighbours', () => {
  it('returns the same key, one step either way and the relative key', () => {
    expect(
      harmonicNeighbours('8A').map(
        ({ key, relation }) => `${relation}:${camelotCode(key)}`,
      ),
    ).toEqual(['same:8A', 'up:9A', 'down:7A', 'relative:8B']);
  });

  it('wraps around the wheel', () => {
    expect(
      harmonicNeighbours('12B').map(({ key }) => camelotCode(key)),
    ).toEqual(['12B', '1B', '11B', '12A']);
  });

  it('is empty for an unknown key', () => {
    expect(harmonicNeighbours(null)).toEqual([]);
  });
});

describe('keyInputError', () => {
  it('accepts blank and known spellings and explains the rest', () => {
    expect(keyInputError('')).toBeNull();
    expect(keyInputError('8A')).toBeNull();
    expect(keyInputError('banana')).toMatch(/Am, F#/);
  });
});
