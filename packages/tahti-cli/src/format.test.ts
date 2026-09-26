import { describe, expect, it } from 'vitest';

import {
  formatBytes,
  formatDate,
  formatDetails,
  formatTable,
} from './format.mjs';

describe('formatDate', () => {
  it('prints the ISO date, or a dash when missing or invalid', () => {
    expect(formatDate('2026-09-01T12:00:00.000Z')).toBe('2026-09-01');
    expect(formatDate(null)).toBe('-');
    expect(formatDate('not a date')).toBe('-');
  });
});

describe('formatBytes', () => {
  it('formats byte strings with binary units', () => {
    expect(formatBytes('512')).toBe('512 B');
    expect(formatBytes('1572864')).toBe('1.5 MB');
    expect(formatBytes(undefined)).toBe('-');
  });
});

describe('formatTable', () => {
  it('aligns columns and shows a dash for empty cells', () => {
    expect(
      formatTable(
        ['A', 'BB'],
        [
          ['long', null],
          ['x', 'y'],
        ],
      ),
    ).toBe(['A     BB', 'long  -', 'x     y'].join('\n'));
  });
});

describe('formatDetails', () => {
  it('aligns labels', () => {
    expect(
      formatDetails([
        ['ID', 'a1'],
        ['TITLE', ''],
      ]),
    ).toBe('ID     a1\nTITLE  -');
  });
});
