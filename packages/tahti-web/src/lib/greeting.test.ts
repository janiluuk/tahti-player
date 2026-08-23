import { describe, expect, it } from 'vitest';

import { timeOfDayGreeting } from './greeting';

describe('timeOfDayGreeting', () => {
  it.each([
    [0, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [17, 'Good afternoon'],
    [18, 'Good evening'],
    [23, 'Good evening'],
  ])('returns the local greeting for hour %s', (hour, expected) => {
    expect(timeOfDayGreeting(hour)).toBe(expected);
  });
});
