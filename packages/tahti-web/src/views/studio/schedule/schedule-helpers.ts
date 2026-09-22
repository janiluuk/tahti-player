export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
export const DEFAULT_BROADCAST_HOUR = 20;
export const DAYS_PER_WEEK = 7;
export const FREQUENCY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type LocalDateTime = {
  date: string;
  time: string;
};

export type ScheduleCard = {
  id: string;
  startAt: string;
  endAt?: string | null;
  title: string;
  location?: string | null;
  visibility?: 'PUBLIC' | 'FAN_ONLY';
  description?: string | null;
  tagline?: string | null;
  artworkUrl?: string | null;
  backdropUrl?: string | null;
  showId?: string;
  episodeNumber?: number | null;
};

export const pad = (value: number) => value.toString().padStart(2, '0');

export function toLocalParts(iso: string | null): LocalDateTime {
  if (!iso) {
    return { date: '', time: '' };
  }
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return { date: '', time: '' };
  }
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

export function fromLocalParts(date: string, time: string): string | null {
  if (!date || !time) {
    return null;
  }
  const value = new Date(`${date}T${time}`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function endAtFor(
  startAt: string,
  durationHours: number | null | undefined,
) {
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const duration = Math.max(1, durationHours ?? 1);
  return new Date(start.getTime() + duration * 60 * 60 * 1000).toISOString();
}

export function formatTimeRange(
  startAt: string,
  endAt?: string | null,
): string {
  return `${formatTime(startAt)}${endAt ? `–${formatTime(endAt)}` : ''}`;
}

export function nextFriday(): Date {
  const value = new Date();
  const friday = 5;
  const daysUntilFriday =
    (friday - value.getDay() + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  value.setDate(value.getDate() + (daysUntilFriday || DAYS_PER_WEEK));
  value.setHours(DEFAULT_BROADCAST_HOUR, 0, 0, 0);
  return value;
}
