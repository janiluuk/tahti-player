import type { ProEditorPluginId } from '../../../api/studio-types';
import { AUDIO_FX_PLUGINS } from '../../../plugins/audio-fx';

/** Big brand-tile icon for a plugin — same idiom as SourceServiceIcon,
 * used both in the "add plugin" picker and each active panel's badge. */
export function PluginIcon({
  id,
  size = 56,
}: {
  id: ProEditorPluginId;
  size?: number;
}) {
  const meta = AUDIO_FX_PLUGINS[id];
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: meta.bg }}
      aria-hidden
    >
      <meta.icon
        size={size}
        absoluteStrokeWidth
        strokeWidth={1.5}
        className="text-white opacity-95"
      />
    </div>
  );
}

export const FILTER_MODES = [
  { id: 'lowpass', label: 'Low-pass', path: 'M2 4 C8 4 10 20 22 20 H30' },
  { id: 'highpass', label: 'High-pass', path: 'M2 20 H12 C20 20 22 4 30 4' },
  {
    id: 'lowshelf',
    label: 'Low shelf',
    path: 'M2 18 C10 18 14 17 20 10 S26 6 30 6',
  },
  {
    id: 'highshelf',
    label: 'High shelf',
    path: 'M2 6 C10 6 14 7 20 14 S26 18 30 18',
  },
] as const;

export const FILTER_SLOPES = [
  {
    id: '12db',
    label: '12 dB/oct',
    path: 'M2 5 C12 5 17 8 22 13 S27 19 30 20',
  },
  {
    id: '24db',
    label: '24 dB/oct',
    path: 'M2 5 C14 5 19 8 24 17 S28 20 30 20',
  },
  { id: 'brickwall', label: 'Brickwall', path: 'M2 5 H22 V20 H30' },
] as const;

export function FilterCurve({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 32 24" className="h-7 w-10" aria-hidden>
      <path d="M1 20 H31" stroke="currentColor" strokeOpacity=".2" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export const LOG_STEPS = 1000;
const MIN_HZ = 20;
const MAX_HZ = 20000;

/** Slider position (0-LOG_STEPS) for a frequency on a log scale. */
export function toLogPosition(hz: number): number {
  const clamped = Math.min(MAX_HZ, Math.max(MIN_HZ, hz));
  return Math.round(
    (Math.log(clamped / MIN_HZ) / Math.log(MAX_HZ / MIN_HZ)) * LOG_STEPS,
  );
}

/** Frequency for a log slider position, rounded to 3 significant digits. */
export function fromLogPosition(position: number): number {
  const hz =
    MIN_HZ *
    Math.pow(
      MAX_HZ / MIN_HZ,
      Math.min(LOG_STEPS, Math.max(0, position)) / LOG_STEPS,
    );
  return Math.min(MAX_HZ, Math.max(MIN_HZ, Number(hz.toPrecision(3))));
}

export const formatHz = (hz: number) =>
  hz >= 1000
    ? `${Number((hz / 1000).toPrecision(3))} kHz`
    : `${Math.round(hz)} Hz`;
