import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

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

/** Sync check for stores / non-React callers (matches `useIsMobile`). */
export function isNarrowViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}
