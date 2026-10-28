const pad = (n: number) => String(n).padStart(2, '0');

/** `2 d 03:12:05`, `03:12:05`, `12:05`; whole seconds, rounded up so the
 * countdown reads 00:01 until the very start, never 00:00 early. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const clock =
    days > 0 || hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;
  return days > 0 ? `${days} d ${clock}` : clock;
}

/** Running time as `42 min` or `1 h 05 min`. */
export function formatRunningTime(totalSec: number): string {
  const minutes = Math.round(Math.max(0, totalSec) / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours} h ${pad(rest)} min` : `${rest} min`;
}

export const PARTY_START_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
};
