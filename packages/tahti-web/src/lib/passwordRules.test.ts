import { describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import { passwordProblem } from './passwordRules';

describe('passwordProblem', () => {
  it('names the first rule a password breaks, like the API', () => {
    expect(passwordProblem('Short1')).toBe(
      i18n.t('web:settingsBody.account.passwordTooShort'),
    );
    expect(passwordProblem('ALLUPPERCASE1')).toBe(
      i18n.t('web:settingsBody.account.passwordNeedLower'),
    );
    expect(passwordProblem('alllowercase1')).toBe(
      i18n.t('web:settingsBody.account.passwordNeedUpper'),
    );
    expect(passwordProblem('NoNumbersHere')).toBe(
      i18n.t('web:settingsBody.account.passwordNeedNumber'),
    );
    expect(passwordProblem('GoodPassword1')).toBeNull();
  });
});
