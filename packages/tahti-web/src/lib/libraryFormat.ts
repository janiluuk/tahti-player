export function formatLibrarySize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** "3 h 20 m", "45 min", "<1 min" — coarse on purpose, for totals. */
export function formatTotalDuration(seconds: number | null): string {
  const minutes = Math.round((seconds ?? 0) / 60);
  if (minutes < 1) {
    return '<1 min';
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} m` : `${hours} h`;
}

export function pluralTracks(count: number): string {
  return count === 1 ? '1 track' : `${count.toLocaleString('en-US')} tracks`;
}
