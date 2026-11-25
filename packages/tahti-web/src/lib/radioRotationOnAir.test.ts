import { describe, expect, it } from 'vitest';

import {
  findOnAirRotationItemId,
  nextRotationItemId,
  sortRotationByPosition,
} from './radioRotationOnAir';

const items = [
  { id: 'r1', soundId: 's1', title: 'Night Transit' },
  { id: 'r2', soundId: 's2', title: 'Aurora' },
  { id: 'r3', soundId: 's3', title: 'Aurora' },
];

describe('findOnAirRotationItemId', () => {
  it('is null when nothing is on air', () => {
    expect(findOnAirRotationItemId(items, null, null)).toBeNull();
  });

  it('matches by sound id when the latest play agrees with the station', () => {
    expect(
      findOnAirRotationItemId(
        items,
        { title: 'Aurora' },
        { title: 'Aurora', soundId: 's3' },
      ),
    ).toBe('r3');
  });

  it('does not fall back to the title when the playing sound is not in the rotation', () => {
    expect(
      findOnAirRotationItemId(
        items,
        { title: 'Aurora' },
        { title: 'Aurora', soundId: 'other' },
      ),
    ).toBeNull();
  });

  it('falls back to the title when the latest play has no sound id', () => {
    expect(
      findOnAirRotationItemId(
        items,
        { title: 'Night Transit' },
        { title: 'Night Transit', soundId: null },
      ),
    ).toBe('r1');
  });

  it('falls back to the title when the latest play is a different track', () => {
    expect(
      findOnAirRotationItemId(
        items,
        { title: 'Night Transit' },
        { title: 'Aurora', soundId: 's2' },
      ),
    ).toBe('r1');
  });
});

describe('nextRotationItemId', () => {
  it('returns the following entry and loops to the top', () => {
    expect(nextRotationItemId(items, 'r1')).toBe('r2');
    expect(nextRotationItemId(items, 'r3')).toBe('r1');
  });

  it('is null without a current entry or with a single entry', () => {
    expect(nextRotationItemId(items, null)).toBeNull();
    expect(nextRotationItemId(items, 'missing')).toBeNull();
    expect(nextRotationItemId([items[0]!], 'r1')).toBeNull();
  });
});

describe('sortRotationByPosition', () => {
  it('orders by position when every row has one', () => {
    expect(
      sortRotationByPosition([
        { id: 'b', position: 2 },
        { id: 'a', position: 0 },
        { id: 'c', position: 5 },
      ]).map((item) => item.id),
    ).toEqual(['a', 'b', 'c']);
  });

  it('keeps the API order when a position is missing', () => {
    expect(
      sortRotationByPosition([{ id: 'b', position: 2 }, { id: 'a' }]).map(
        (item) => item.id,
      ),
    ).toEqual(['b', 'a']);
  });
});
