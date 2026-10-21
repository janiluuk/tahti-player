const SPACE_CONTROLS =
  'button, a[href], summary, [role="button"], [role="checkbox"], [role="switch"], [role="slider"], [role="tab"], [role="menuitem"], [role="option"], [role="radio"], audio, video';

/** True when Space already means something on `target` (a focused button,
 * link or other control), so the global play/pause shortcut must leave it
 * alone. */
export function spaceActivatesTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(SPACE_CONTROLS));
}
