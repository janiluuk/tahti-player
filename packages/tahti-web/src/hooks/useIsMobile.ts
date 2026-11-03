import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';
// Between the mobile single-column cutoff and where the desktop three-pane
// shell (left sidebar + main + right rail, both at their default fixed
// widths) has enough room to not crush main content -- see the 2026-08-31
// responsive audit in tahti-web/UI-REDESIGN-WORKLOG.md for the measurements
// that picked this upper bound.
const COMPACT_DESKTOP_QUERY = '(min-width: 768px) and (max-width: 1099px)';

/** True when viewport is phone-sized (Tailwind `md` breakpoint). */
export function useIsMobile(query = QUERY): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True in the tablet/narrow-desktop band where the three-pane shell should
 * start collapsing its sidebars rather than crushing main content. */
export function useIsCompactDesktop(): boolean {
  return useIsMobile(COMPACT_DESKTOP_QUERY);
}
