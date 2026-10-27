import type { NativePlayLogEntry } from './nativeLibrary';

export const SET_GAP_MINUTES = 60;

export function playedAtDate(playedAt: string): Date | null {
  const date = new Date(`${playedAt.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function latestSession(
  newestFirst: NativePlayLogEntry[],
  gapMinutes = SET_GAP_MINUTES,
): NativePlayLogEntry[] {
  const session: NativePlayLogEntry[] = [];
  let previous: Date | null = null;
  for (const entry of newestFirst) {
    const at = playedAtDate(entry.playedAt);
    if (!at) {
      continue;
    }
    if (previous && previous.getTime() - at.getTime() > gapMinutes * 60_000) {
      break;
    }
    session.push(entry);
    previous = at;
  }
  return session.reverse();
}

export function formatTracklist(
  chronological: NativePlayLogEntry[],
  timeZone?: string,
): string {
  const width = String(chronological.length).length;
  return chronological
    .map((entry, index) => {
      const at = playedAtDate(entry.playedAt);
      const time = at
        ? at.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone,
          })
        : '--:--';
      const number = String(index + 1).padStart(Math.max(2, width), '0');
      const name = entry.artist
        ? `${entry.artist} – ${entry.title}`
        : entry.title;
      return `${number}. ${time} ${name}`;
    })
    .join('\n');
}
