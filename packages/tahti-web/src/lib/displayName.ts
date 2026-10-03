// Same pattern as `containsEmailAddress` in tahti-org `@tahti/shared`
// (packages/shared/src/display-name.ts); keep the two in step.
const EMAIL_PATTERN = /[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}/i;

/** True when the text contains an email address anywhere in it. */
export function containsEmailAddress(text: string): boolean {
  return EMAIL_PATTERN.test(text);
}

/**
 * Credit and display names are public, so they must never carry an email
 * address. Falls back to the username, or null when there is none.
 */
export function safeCreditName(
  candidate: string | null | undefined,
  username: string | null,
): string | null {
  const trimmed = candidate?.trim() ?? '';
  return trimmed && !containsEmailAddress(trimmed) ? trimmed : username;
}
