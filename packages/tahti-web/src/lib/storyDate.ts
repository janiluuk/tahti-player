const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

function ago(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'} ago`;
}

/** Short relative date for story cards: "3 hours ago", "1 day ago", then
 * "Oct 27, 2026" after a week. */
export function storyDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < MINUTE_MS) {
    return 'just now';
  }
  if (elapsed < HOUR_MS) {
    return ago(Math.floor(elapsed / MINUTE_MS), 'minute');
  }
  if (elapsed < DAY_MS) {
    return ago(Math.floor(elapsed / HOUR_MS), 'hour');
  }
  if (elapsed < 7 * DAY_MS) {
    return ago(Math.floor(elapsed / DAY_MS), 'day');
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
