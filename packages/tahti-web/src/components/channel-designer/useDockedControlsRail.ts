import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

import { useIsMobile } from '../../hooks/useIsMobile';
import { useLayoutStore } from '../../stores/layoutStore';
import { useRightRailOverrideStore } from '../../stores/rightRailOverrideStore';
import { useSettingsModalStore } from '../../stores/settingsModalStore';

/** On desktop the designer's controls dock into the app's right rail
 * instead of rendering beside the preview. The caller assigns the controls
 * to `controlsForRailRef.current` each render. */
export function useDockedControlsRail(lookOnly: boolean | undefined) {
  const isMobile = useIsMobile();
  const settingsOpen = useSettingsModalStore((state) => state.isOpen);
  const setRightCollapsed = useLayoutStore((s) => s.setRightCollapsed);
  const setRightWidth = useLayoutStore((s) => s.setRightWidth);
  const rightWidth = useLayoutStore((s) => s.rightWidth);
  const setRailOverride = useRightRailOverrideStore((s) => s.setOverride);
  const dockControlsInRail = !lookOnly && !isMobile && !settingsOpen;
  const controlsForRailRef = useRef<ReactNode>(null);

  useLayoutEffect(() => {
    if (!dockControlsInRail) {
      return;
    }
    const content = controlsForRailRef.current;
    if (!content) {
      return;
    }
    setRailOverride({ title: 'Channel designer', content });
  });

  // Open the rail once when the controls dock into it — not on every render,
  // which would re-expand it right after the user collapsed it.
  useEffect(() => {
    if (dockControlsInRail) {
      setRightCollapsed(false);
    }
  }, [dockControlsInRail, setRightCollapsed]);

  useEffect(() => {
    if (!dockControlsInRail || rightWidth >= 360) {
      return;
    }
    setRightWidth(360);
  }, [dockControlsInRail, rightWidth, setRightWidth]);

  useEffect(() => {
    if (!dockControlsInRail) {
      return;
    }
    return () => setRailOverride(null);
  }, [dockControlsInRail, setRailOverride]);

  return { dockControlsInRail, controlsForRailRef };
}
