export const FADE_OUT_MS = 700;
export const FADE_IN_MS = 1200;
const STEP_MS = 50;

/** Equal-power level for a fade that is `progress` (0 to 1) of the way
 * from `from` to `to`: a sine going up, a cosine going down. A linear ramp
 * sounds like it drops off a cliff near silence. */
export function fadeLevelAt(from: number, to: number, progress: number) {
  const p = (Math.min(1, Math.max(0, progress)) * Math.PI) / 2;
  const shape = to > from ? Math.sin(p) : 1 - Math.cos(p);
  return from + (to - from) * shape;
}

/** Moves a level from `from` to `to` over `ms`, calling `onLevel` on the
 * way and with the exact end value last. Resolves `false` when
 * `cancelled()` turns true first; the level is then left where it was. */
export function rampLevel(opts: {
  from: number;
  to: number;
  ms: number;
  onLevel: (level: number) => void;
  cancelled?: () => boolean;
}): Promise<boolean> {
  const { from, to, ms, onLevel, cancelled } = opts;
  return new Promise((resolve) => {
    const steps = Math.max(1, Math.round(ms / STEP_MS));
    let step = 0;
    const tick = () => {
      if (cancelled?.()) {
        resolve(false);
        return;
      }
      step += 1;
      if (step >= steps) {
        onLevel(to);
        resolve(true);
        return;
      }
      onLevel(fadeLevelAt(from, to, step / steps));
      setTimeout(tick, STEP_MS);
    };
    setTimeout(tick, STEP_MS);
  });
}
