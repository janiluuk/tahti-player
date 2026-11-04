import { i18n } from '@tahti-player/i18n';

export function passwordRulesHint(): string {
  return i18n.t('web:settingsBody.account.passwordRulesHint');
}

export function passwordProblem(password: string): string | null {
  if (password.length < 10) {
    return i18n.t('web:settingsBody.account.passwordTooShort');
  }
  if (password.length > 128) {
    return i18n.t('web:settingsBody.account.passwordTooLong');
  }
  if (!/[a-z]/.test(password)) {
    return i18n.t('web:settingsBody.account.passwordNeedLower');
  }
  if (!/[A-Z]/.test(password)) {
    return i18n.t('web:settingsBody.account.passwordNeedUpper');
  }
  if (!/[0-9]/.test(password)) {
    return i18n.t('web:settingsBody.account.passwordNeedNumber');
  }
  return null;
}
