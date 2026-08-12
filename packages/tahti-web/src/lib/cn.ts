/** Lightweight className join (avoid depending on ui package utils from app code). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
