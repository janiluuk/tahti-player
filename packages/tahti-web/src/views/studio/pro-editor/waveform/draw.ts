export type TimeView = { start: number; end: number };

/** `m:ss`, with as many decimals as `step` needs (down to 0.1 ms). */
export function formatClock(sec: number, step = 1): string {
  const safe = Math.max(0, Number.isFinite(sec) ? sec : 0);
  const decimals =
    step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(step) - 1e-9));
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(safe * factor) / factor;
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded - minutes * 60;
  const whole = Math.floor(seconds);
  const fraction =
    decimals > 0
      ? `.${Math.round((seconds - whole) * factor)
          .toString()
          .padStart(decimals, '0')}`
      : '';
  return `${minutes}:${whole.toString().padStart(2, '0')}${fraction}`;
}
