import { describe, expect, it } from 'vitest';

import { passwordProblem } from './passwordRules';

describe('passwordProblem', () => {
  it('names the first rule a password breaks, like the API', () => {
    expect(passwordProblem('Short1')).toBe('Use at least 10 characters.');
    expect(passwordProblem('ALLUPPERCASE1')).toBe('Add a lowercase letter.');
    expect(passwordProblem('alllowercase1')).toBe('Add an uppercase letter.');
    expect(passwordProblem('NoNumbersHere')).toBe('Add a number.');
    expect(passwordProblem('GoodPassword1')).toBeNull();
  });
});
