import { useCallback, useState, useSyncExternalStore } from 'react';

/** Below Tailwind's `sm` breakpoint. */
export const PHONE_SELECTION_QUERY = '(max-width: 639px)';

function phoneQuery(): MediaQueryList | null {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return null;
  }
  return window.matchMedia(PHONE_SELECTION_QUERY) ?? null;
}

function subscribe(onChange: () => void): () => void {
  const mql = phoneQuery();
  if (!mql) {
    return () => undefined;
  }
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

const isPhoneWidth = () => phoneQuery()?.matches ?? false;

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
  const isPhone = useSyncExternalStore(subscribe, isPhoneWidth, () => false);
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
