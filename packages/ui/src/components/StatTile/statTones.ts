/**
 * Per-metric colour identity for stat tiles, KPI rows and their charts.
 * Every class uses the `-strong` tokens: the plain accents are pastel fills
 * that fall well under 3:1 on light themes, while `-strong` stays readable in
 * light themes and points back at the accent in dark ones. The value text of
 * a toned stat stays in foreground ink; `edge`, `fill` and the solid icon
 * `chip` (background-coloured icon on the tone) carry the colour. Give each metric one tone and keep it
 * on every surface that shows that metric, instead of cycling by position.
 */
export const STAT_TONES = [
  'primary',
  'blue',
  'green',
  'purple',
  'yellow',
  'cyan',
  'orange',
  'red',
] as const;

export type StatTone = (typeof STAT_TONES)[number];

export type StatToneClasses = {
  text: string;
  fill: string;
  chip: string;
  edge: string;
};

export const statToneClasses: Record<StatTone, StatToneClasses> = {
  primary: {
    text: 'text-primary-strong',
    fill: 'bg-primary-strong',
    chip: 'bg-primary-strong text-background',
    edge: 'border-l-primary-strong',
  },
  blue: {
    text: 'text-accent-blue-strong',
    fill: 'bg-accent-blue-strong',
    chip: 'bg-accent-blue-strong text-background',
    edge: 'border-l-accent-blue-strong',
  },
  green: {
    text: 'text-accent-green-strong',
    fill: 'bg-accent-green-strong',
    chip: 'bg-accent-green-strong text-background',
    edge: 'border-l-accent-green-strong',
  },
  purple: {
    text: 'text-accent-purple-strong',
    fill: 'bg-accent-purple-strong',
    chip: 'bg-accent-purple-strong text-background',
    edge: 'border-l-accent-purple-strong',
  },
  yellow: {
    text: 'text-accent-yellow-strong',
    fill: 'bg-accent-yellow-strong',
    chip: 'bg-accent-yellow-strong text-background',
    edge: 'border-l-accent-yellow-strong',
  },
  cyan: {
    text: 'text-accent-cyan-strong',
    fill: 'bg-accent-cyan-strong',
    chip: 'bg-accent-cyan-strong text-background',
    edge: 'border-l-accent-cyan-strong',
  },
  orange: {
    text: 'text-accent-orange-strong',
    fill: 'bg-accent-orange-strong',
    chip: 'bg-accent-orange-strong text-background',
    edge: 'border-l-accent-orange-strong',
  },
  red: {
    text: 'text-accent-red-strong',
    fill: 'bg-accent-red-strong',
    chip: 'bg-accent-red-strong text-background',
    edge: 'border-l-accent-red-strong',
  },
};
