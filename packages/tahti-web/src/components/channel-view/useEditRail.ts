import { useEffect, useLayoutEffect, type ReactNode } from 'react';

import { useLayoutStore } from '../../stores/layoutStore';
import { useRightRailOverrideStore } from '../../stores/rightRailOverrideStore';

const MIN_RAIL_WIDTH = 360;

/** While editing on desktop, the layers menu lives in the app's right rail. */
export function useEditRail(
  active: boolean,
  title: string,
  content: ReactNode,
) {
  const setRailOverride = useRightRailOverrideStore((s) => s.setOverride);
  const setRightCollapsed = useLayoutStore((s) => s.setRightCollapsed);
  const setRightWidth = useLayoutStore((s) => s.setRightWidth);
  const rightWidth = useLayoutStore((s) => s.rightWidth);

  // Content follows every render; expanding is a separate effect below so it
  // happens once, not right after the user collapses the rail again.
  useLayoutEffect(() => {
    setRailOverride(active ? { title, content } : null);
  });

  useEffect(() => {
    if (active) {
      setRightCollapsed(false);
    }
  }, [active, setRightCollapsed]);

  useEffect(() => {
    if (active && rightWidth < MIN_RAIL_WIDTH) {
      setRightWidth(MIN_RAIL_WIDTH);
    }
  }, [active, rightWidth, setRightWidth]);

  useEffect(() => () => setRailOverride(null), [setRailOverride]);
}
