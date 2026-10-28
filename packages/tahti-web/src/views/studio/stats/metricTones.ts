import type { StatTone } from '@tahti-player/ui';

/**
 * One colour per Studio metric, shared by Studio home and Stats so a metric
 * keeps its colour across pages. Downloads and smart-link clicks match the
 * `DayOfWeekChart` split series (primary and accent-yellow).
 */
export const STUDIO_METRIC_TONES = {
  plays: 'blue',
  downloads: 'primary',
  smartLinkClicks: 'yellow',
  smartLinkViews: 'orange',
  clickThrough: 'cyan',
  followers: 'purple',
  minutesListened: 'green',
  minutesStreamed: 'cyan',
} as const satisfies Record<string, StatTone>;

export const ENGAGEMENT_UNIT_TONES: Record<string, StatTone> = {
  'free-downloads': 'primary',
  'paid-downloads': 'cyan',
  'fan-subs': 'purple',
};
