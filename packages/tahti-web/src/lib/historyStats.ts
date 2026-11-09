import type { TFunction } from '@tahti-player/i18n';

import type { HistoryEntry } from '../stores/libraryStore';
import { dateLocaleTag } from './locale';
import { webT } from './webT';

/** Nuclear desktop tracks real listening duration per play (native
 * player, local SQLite). Tahti-web only logs a play event with a
 * timestamp, so listening time here is approximated from the track's
 * own duration when known, falling back to a flat estimate for live/
 * radio plays (which have no fixed length) or missing metadata. This
 * keeps every chart driven by *some* listening-time signal rather than
 * silently degrading to a play-count chart with a different meaning. */
const FALLBACK_TRACK_MS = 3 * 60 * 1000;

function entryMs(entry: HistoryEntry): number {
  const sec = entry.playable.durationSec;
  return sec != null && sec > 0 ? sec * 1000 : FALLBACK_TRACK_MS;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function rangePresets(t: TFunction<'web'>) {
  return [
    { id: 'last7Days', label: t('historyStats.last7Days'), days: 7 },
    { id: 'last30Days', label: t('historyStats.last30Days'), days: 30 },
    { id: 'last90Days', label: t('historyStats.last90Days'), days: 90 },
    { id: 'last12Months', label: t('historyStats.last12Months'), days: 365 },
    { id: 'allTime', label: t('historyStats.allTime'), days: null },
  ] as const;
}

export type RangePresetId = ReturnType<typeof rangePresets>[number]['id'];

function rangeCutoffMs(presetId: RangePresetId): number | null {
  const preset = rangePresets(webT()).find((p) => p.id === presetId);
  return preset && preset.days != null
    ? Date.now() - preset.days * MS_PER_DAY
    : null;
}

export function entriesInRange(
  entries: HistoryEntry[],
  presetId: RangePresetId,
): HistoryEntry[] {
  const cutoff = rangeCutoffMs(presetId);
  if (cutoff == null) {
    return entries;
  }
  return entries.filter((e) => new Date(e.playedAt).getTime() >= cutoff);
}

/** Display bounds for the range picker header (e.g. "Jul 25 – Aug 23,
 * 2026"). `allTime` bounds to the earliest play so it doesn't imply a
 * fixed window that doesn't exist. */
export function rangeDisplayBounds(
  entries: HistoryEntry[],
  presetId: RangePresetId,
): { from: number; to: number } | null {
  const to = Date.now();
  const cutoff = rangeCutoffMs(presetId);
  if (cutoff != null) {
    return { from: cutoff, to };
  }
  if (entries.length === 0) {
    return null;
  }
  const earliest = Math.min(
    ...entries.map((e) => new Date(e.playedAt).getTime()),
  );
  return { from: earliest, to };
}

// Local calendar day, matching the hour and weekday charts, which also read
// local time; an ISO slice would file late-night plays under the UTC day.
function localDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Per-day listening over the last 12 months, padded with zero-value
 * endpoints so the calendar always spans the full year (same window as
 * Nuclear desktop's `useDailyListeningTime`), not just the days played. */
export function dailyListeningMs(
  entries: HistoryEntry[],
  now: Date = new Date(),
): { date: string; value: number }[] {
  const to = localDay(now);
  const fromDate = new Date(now);
  fromDate.setMonth(fromDate.getMonth() - 12);
  const from = localDay(fromDate);

  const byDate = new Map<string, number>();
  for (const e of entries) {
    const iso = localDay(new Date(e.playedAt));
    if (iso < from || iso > to) {
      continue;
    }
    byDate.set(iso, (byDate.get(iso) ?? 0) + entryMs(e));
  }
  const days = [...byDate.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (days.at(0)?.date !== from) {
    days.unshift({ date: from, value: 0 });
  }
  if (days.at(-1)?.date !== to) {
    days.push({ date: to, value: 0 });
  }
  return days;
}

export function hourlyListeningMs(entries: HistoryEntry[]): number[] {
  const hours = new Array(24).fill(0) as number[];
  for (const e of entries) {
    hours[new Date(e.playedAt).getHours()]! += entryMs(e);
  }
  return hours;
}

export type DayOfWeekValues = [
  monday: number,
  tuesday: number,
  wednesday: number,
  thursday: number,
  friday: number,
  saturday: number,
  sunday: number,
];

export function dayOfWeekListeningMs(entries: HistoryEntry[]): DayOfWeekValues {
  const days: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const e of entries) {
    const jsDay = new Date(e.playedAt).getDay(); // 0 = Sunday .. 6 = Saturday
    const mondayFirstIndex = (jsDay + 6) % 7; // 0 = Monday .. 6 = Sunday
    days[mondayFirstIndex]! += entryMs(e);
  }
  return days as DayOfWeekValues;
}

export type HistoryTopListEntry = {
  id: string;
  label: string;
  sublabel?: string;
  imageUrl?: string | null;
  value: number;
};

export function topTracks(
  entries: HistoryEntry[],
  limit = 10,
): HistoryTopListEntry[] {
  const byId = new Map<string, HistoryTopListEntry>();
  for (const e of entries) {
    const p = e.playable;
    const existing = byId.get(p.id);
    if (existing) {
      existing.value += entryMs(e);
    } else {
      byId.set(p.id, {
        id: p.id,
        label: p.title,
        sublabel: p.artist,
        imageUrl: p.coverUrl ?? null,
        value: entryMs(e),
      });
    }
  }
  return [...byId.values()].sort((a, b) => b.value - a.value).slice(0, limit);
}

export function topArtists(
  entries: HistoryEntry[],
  limit = 10,
): HistoryTopListEntry[] {
  const byArtist = new Map<string, HistoryTopListEntry>();
  for (const e of entries) {
    const p = e.playable;
    const key = p.artist || 'Unknown artist';
    const existing = byArtist.get(key);
    if (existing) {
      existing.value += entryMs(e);
    } else {
      byArtist.set(key, {
        id: key,
        label: key,
        imageUrl: p.coverUrl ?? null,
        value: entryMs(e),
      });
    }
  }
  return [...byArtist.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** Stands in for Nuclear's "top albums" — Tahti plays aren't grouped by
 * album, but a channel is the closest equivalent unit (an artist's
 * output you tune into), so this keeps the three-column top-lists
 * layout meaningful rather than leaving a fabricated "albums" list. */
export function topChannels(
  entries: HistoryEntry[],
  limit = 10,
): HistoryTopListEntry[] {
  const byChannel = new Map<string, HistoryTopListEntry>();
  for (const e of entries) {
    const p = e.playable;
    if (!p.channelSlug) {
      continue;
    }
    const existing = byChannel.get(p.channelSlug);
    if (existing) {
      existing.value += entryMs(e);
    } else {
      byChannel.set(p.channelSlug, {
        id: p.channelSlug,
        label: p.channelSlug,
        sublabel: p.artist,
        imageUrl: p.coverUrl ?? null,
        value: entryMs(e),
      });
    }
  }
  return [...byChannel.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function formatListeningDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes === 0) {
    return '0m';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

export function formatHour(hour: number): string {
  return new Date(2000, 0, 1, hour).toLocaleTimeString(dateLocaleTag(), {
    hour: 'numeric',
  });
}

export function weekdayLabelsShort(): string[] {
  const base = new Date(2023, 0, 2);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toLocaleDateString(dateLocaleTag(), { weekday: 'short' });
  });
}

export function monthLabelsShort(): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString(dateLocaleTag(), {
      month: 'short',
    }),
  );
}
