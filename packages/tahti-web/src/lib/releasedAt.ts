/**
 * The sound API stores `releasedAt` as a full datetime while the editors
 * show a date-only `<input type="date">`. Dates are pinned to UTC midnight
 * so a saved day reads back as the same day in every timezone.
 */
export function releaseDateFromReleasedAt(
  releasedAt: string | null | undefined,
): string {
  if (!releasedAt) {
    return '';
  }
  const parsed = new Date(releasedAt);
  return Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toISOString().slice(0, 10);
}

/**
 * `releasedAt` is non-nullable on the API (it defaults to the upload time),
 * so an empty date leaves the stored value alone instead of sending null.
 */
export function releasedAtFromReleaseDate(
  releaseDate: string | null | undefined,
): { releasedAt?: string } {
  if (!releaseDate || !/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
    return {};
  }
  const parsed = new Date(`${releaseDate}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime())
    ? {}
    : { releasedAt: parsed.toISOString() };
}
