import { useCallback, useState } from 'react';

import { useMediaQuery } from '../utils/mediaQuery';

/** Below Tailwind's `sm` breakpoint. */
export const PHONE_SELECTION_QUERY = '(max-width: 639px)';

/**
 * Row checkboxes for a multi-select list: always shown on wider screens, but
 * on phones only after the user asks for them (a "Select" button), or while
 * something is still selected, so a list never hides an active selection.
 */
export function useOnDemandSelection({
  selectable,
  selectedCount,
  onClear,
}: {
  selectable: boolean;
  selectedCount: number;
  onClear?: () => void;
}) {
  const isPhone = useMediaQuery(PHONE_SELECTION_QUERY);
  const [selecting, setSelecting] = useState(false);

  const start = useCallback(() => setSelecting(true), []);
  const stop = useCallback(() => {
    setSelecting(false);
    onClear?.();
  }, [onClear]);

  const onDemand = selectable && isPhone;
  return {
    showCheckboxes: selectable && (!isPhone || selecting || selectedCount > 0),
    /** True when the host should offer the Select / Done toggle. */
    onDemand,
    selecting: onDemand && (selecting || selectedCount > 0),
    start,
    stop,
  } as const;
}
