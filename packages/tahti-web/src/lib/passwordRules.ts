/** The API's password rules (`PasswordSchema` in `@tahti/shared`), checked
 * before sending so the form can say what is missing. */
export const PASSWORD_RULES_HINT =
  'At least 10 characters, with a lowercase letter, an uppercase letter and a number';

export function passwordProblem(password: string): string | null {
  if (password.length < 10) {
    return 'Use at least 10 characters.';
  }
  if (password.length > 128) {
    return 'Use at most 128 characters.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Add a lowercase letter.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Add an uppercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Add a number.';
  }
  return null;
}
