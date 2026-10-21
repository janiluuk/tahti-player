import { useCallback, useEffect, useMemo, useState } from 'react';

/** Bulk multi-select state for `TrackTable`, keyed by the same stable item
 * id `getItemId` already produces for drag-reorder/row keys -- not row
 * index, since sorting/filtering reorders visible rows. Selection is
 * pruned whenever `itemIds` changes (e.g. a selected row gets removed or
 * filtered out) so a stale id never lingers in a bulk-action call. */
export function useRowSelection(itemIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) {
        return prev;
      }
      const idSet = new Set(itemIds);
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (idSet.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [itemIds]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      for (const id of ids) {
        if (allSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  return {
    selectedIds: useMemo(() => Array.from(selected), [selected]),
    isSelected,
    toggle,
    toggleAll,
    clear,
  } as const;
}
