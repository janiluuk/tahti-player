import { useEffect, useState } from 'react';

import {
  loadChannelLayoutPresetId,
  loadChannelPageLayout,
  saveChannelLayoutPresetId,
  saveChannelPageLayout,
  type ChannelLayoutPresetId,
  type ChannelPageItem,
} from '../lib/channelPageLayout';

export type MoveDragState = {
  id: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
} | null;

/** Owns `ChannelView`'s page-layout editing state: the layout array itself,
 * which item is selected/being dragged, and the dirty/preset bookkeeping
 * around saving it. Pure state relocation from `ChannelView.tsx` -- no
 * behavior change (see `codebase-refactor-hotspots.md`'s history for why
 * this was left for a dedicated pass: every other piece of that component
 * reads `editing`/`layout` too, so this hook exports them rather than
 * hiding them, and callers still compose look-editing/preset side effects
 * (`applyPreset`, `startEdit`, etc.) themselves using the setters below --
 * this hook only owns what's genuinely layout-shaped. */
export function useChannelLayoutEditing(slug: string) {
  const [layout, setLayout] = useState<ChannelPageItem[]>(() =>
    loadChannelPageLayout(slug),
  );
  const [activePresetId, setActivePresetId] =
    useState<ChannelLayoutPresetId | null>(() =>
      loadChannelLayoutPresetId(slug),
    );
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [moveDrag, setMoveDrag] = useState<MoveDragState>(null);
  const [layoutDirty, setLayoutDirty] = useState(false);

  useEffect(() => {
    setLayout(loadChannelPageLayout(slug));
    setActivePresetId(loadChannelLayoutPresetId(slug));
    setLayoutDirty(false);
  }, [slug]);

  // Takes an updater (not a precomputed array) so each call always builds on
  // the latest layout -- reading the closed-over `layout` variable directly
  // races when two edits (e.g. a fast double-click on "Add") fire before
  // React re-renders between them, both computing from the same stale array
  // and silently dropping one of the changes (or duplicating an item).
  const updateLayout = (
    updater:
      | ChannelPageItem[]
      | ((prev: ChannelPageItem[]) => ChannelPageItem[]),
    opts?: { clearPreset?: boolean },
  ) => {
    setLayout((prev) =>
      typeof updater === 'function' ? updater(prev) : updater,
    );
    setLayoutDirty(true);
    if (opts?.clearPreset !== false && activePresetId) {
      setActivePresetId(null);
      saveChannelLayoutPresetId(slug, null);
    }
  };

  const removeLayoutItem = (id: string) => {
    updateLayout((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const saveLayout = () => {
    saveChannelPageLayout(slug, layout);
    saveChannelLayoutPresetId(slug, activePresetId);
    setLayoutDirty(false);
  };

  return {
    layout,
    setLayout,
    activePresetId,
    setActivePresetId,
    editing,
    setEditing,
    selectedId,
    setSelectedId,
    dragId,
    setDragId,
    moveDrag,
    setMoveDrag,
    layoutDirty,
    setLayoutDirty,
    updateLayout,
    removeLayoutItem,
    saveLayout,
  };
}
