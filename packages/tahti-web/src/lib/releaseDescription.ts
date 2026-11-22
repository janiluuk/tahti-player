/** Split a pasted tracklist description into lines when it uses "01 - Title" style. */
const NUMBERED_TRACK = /(?:^|\s+)(?=\d{1,2}\s*[-–—.]\s*\S)/g;

export function releaseDescriptionLines(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }
  if (trimmed.includes('\n')) {
    return trimmed
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  const numbered = trimmed
    .split(NUMBERED_TRACK)
    .map((line) => line.trim())
    .filter(Boolean);
  if (numbered.length >= 2) {
    return numbered;
  }
  return [trimmed];
}
