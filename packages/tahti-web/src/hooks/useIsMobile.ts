import { useMediaQuery } from '@tahti-player/ui';

const QUERY = '(max-width: 767px)';
// Between the mobile single-column cutoff and where the desktop three-pane
// shell (left sidebar + main + right rail, both at their default fixed
// widths) has enough room to not crush main content -- see the 2026-08-31
// responsive audit in tahti-web/UI-REDESIGN-WORKLOG.md for the measurements
// that picked this upper bound.
const COMPACT_DESKTOP_QUERY = '(min-width: 768px) and (max-width: 1099px)';

/** True when viewport is phone-sized (Tailwind `md` breakpoint). */
export function useIsMobile(query = QUERY): boolean {
  return useMediaQuery(query);
}

/** True in the tablet/narrow-desktop band where the three-pane shell should
 * start collapsing its sidebars rather than crushing main content. */
export function useIsCompactDesktop(): boolean {
  return useIsMobile(COMPACT_DESKTOP_QUERY);
}
