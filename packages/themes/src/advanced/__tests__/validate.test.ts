import { describe, expect, it } from 'vitest';

import { AdvancedThemeSchema } from '../../advanced/schema';
import { parseAdvancedTheme } from '../../advanced/validate';

const cases: [string, unknown][] = [
  ['minimal', { version: 1, name: 'Ok' }],
  [
    'full',
    {
      version: 1,
      name: 'Full',
      author: 'Aino',
      description: 'Warm',
      tags: ['warm', 'dark'],
      palette: ['#000', '#111', '#222', '#333'],
      vars: { background: 'oklch(0.2 0 0)', radius: '4px' },
      dark: { background: 'oklch(0.1 0 0)' },
    },
  ],
  ['unknown keys dropped', { version: 1, name: 'Extra', colour: 'red' }],
  ['empty vars', { version: 1, name: 'Empty', vars: {} }],
  ['not an object', 'theme'],
  ['null', null],
  ['an array', [1]],
  ['wrong version', { version: 2, name: 'Two' }],
  ['missing name', { version: 1 }],
  ['empty name', { version: 1, name: '' }],
  ['empty author', { version: 1, name: 'A', author: '' }],
  ['null author', { version: 1, name: 'A', author: null }],
  ['numeric description', { version: 1, name: 'A', description: 3 }],
  ['tags not strings', { version: 1, name: 'A', tags: [1] }],
  ['palette of three', { version: 1, name: 'A', palette: ['a', 'b', 'c'] }],
  [
    'palette of five',
    { version: 1, name: 'A', palette: ['a', 'b', 'c', 'd', 'e'] },
  ],
  ['var with leading --', { version: 1, name: 'A', vars: { '--bg': 'x' } }],
  ['empty var name', { version: 1, name: 'A', dark: { '': 'x' } }],
  ['numeric var value', { version: 1, name: 'A', vars: { bg: 1 } }],
  ['vars as a list', { version: 1, name: 'A', vars: ['bg'] }],
];

describe('parseAdvancedTheme', () => {
  it.each(cases)('agrees with AdvancedThemeSchema: %s', (_label, input) => {
    const expected = AdvancedThemeSchema.safeParse(input);
    if (expected.success) {
      expect(parseAdvancedTheme(input)).toEqual(expected.data);
    } else {
      expect(() => parseAdvancedTheme(input)).toThrowError(/^Invalid theme/);
    }
  });

  it('says what is wrong', () => {
    expect(() =>
      parseAdvancedTheme({ version: 1, vars: { '--bg': 'x' } }),
    ).toThrowError(
      'Invalid theme: name is required; vars keys must be CSS var names without leading --',
    );
  });
});
