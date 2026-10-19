const HAS_VOWEL = /[aeiouy]/i;

export function isPlausiblePublicName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.length > 15 && /^[a-z0-9]+$/.test(trimmed)) {
    return false;
  }

  if (
    trimmed.length >= 3 &&
    trimmed.length <= 8 &&
    /^[a-zA-Z]+$/.test(trimmed) &&
    !HAS_VOWEL.test(trimmed)
  ) {
    return false;
  }

  return true;
}
