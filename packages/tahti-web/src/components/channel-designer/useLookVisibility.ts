import { useEffect, useRef, useState } from 'react';

import {
  channelLookElements,
  isArtistLookBlockId,
  loadArtistLookVisibility,
  saveArtistLookVisibility,
  type ArtistLookBlockId,
  type ChannelLookElementId,
} from '../../lib/channelLookElements';
import {
  loadChannelPageLayout,
  setItemVisible,
  type ChannelPageItem,
  type ChannelPageItemType,
} from '../../lib/channelPageLayout';
import { persistChannelPageLayout } from '../../lib/persistChannelPageLayout';
import { webT } from '../../lib/webT';

type Options = {
  layoutSlug: string;
  reloadToken: number;
  layout?: ChannelPageItem[];
  onLayoutChange?: (
    updater:
      ChannelPageItem[] | ((prev: ChannelPageItem[]) => ChannelPageItem[]),
  ) => void;
  onLookVisibilityChange?: (
    visibility: Record<ArtistLookBlockId, boolean>,
  ) => void;
};

/** Which look elements (player, backdrop, layout blocks) are switched on,
 * persisted per channel, plus the matching page-layout toggle. */
export function useLookVisibility({
  layoutSlug,
  reloadToken,
  layout,
  onLayoutChange,
  onLookVisibilityChange,
}: Options) {
  const [lookVisibility, setLookVisibility] = useState<
    Record<ArtistLookBlockId, boolean>
  >(() => loadArtistLookVisibility(layoutSlug));

  // Callers often pass an inline callback; going through a ref keeps this
  // effect from re-running (and re-notifying the parent) on every render.
  const onLookVisibilityChangeRef = useRef(onLookVisibilityChange);
  onLookVisibilityChangeRef.current = onLookVisibilityChange;

  useEffect(() => {
    const visibility = loadArtistLookVisibility(layoutSlug);
    setLookVisibility(visibility);
    onLookVisibilityChangeRef.current?.(visibility);
  }, [layoutSlug, reloadToken]);

  // Inside ChannelView's editor the page layout belongs to the parent
  // (unsaved until its own Save); writing storage behind its back left its
  // view stale and let its next save overwrite this toggle.
  const toggleLayoutType = (type: ChannelPageItemType) => {
    const toggle = (items: ChannelPageItem[]) => {
      const row = items.find((item) => item.type === type);
      return row ? setItemVisible(items, row.id, !row.visible) : items;
    };
    if (layout && onLayoutChange) {
      onLayoutChange(toggle);
      return;
    }
    void persistChannelPageLayout(
      layoutSlug,
      toggle(loadChannelPageLayout(layoutSlug)),
    );
  };

  const lookBlockVisible = (id: ChannelLookElementId) => {
    const meta = channelLookElements(webT()).find(
      (element) => element.id === id,
    );
    if (layout && meta?.layoutType) {
      return (
        layout.find((item) => item.type === meta.layoutType)?.visible ?? false
      );
    }
    if (!isArtistLookBlockId(id)) {
      return true;
    }
    return lookVisibility[id] !== false;
  };

  const toggleSelectedLook = (id: ChannelLookElementId) => {
    const meta = channelLookElements(webT()).find(
      (element) => element.id === id,
    );
    if (meta?.layoutType) {
      toggleLayoutType(meta.layoutType);
      if (layout && onLayoutChange) {
        return;
      }
    }
    if (!isArtistLookBlockId(id)) {
      return;
    }
    const next = {
      ...lookVisibility,
      [id]: !lookBlockVisible(id),
    };
    setLookVisibility(next);
    saveArtistLookVisibility(layoutSlug, next);
    onLookVisibilityChange?.(next);
  };

  return { lookBlockVisible, toggleSelectedLook };
}
