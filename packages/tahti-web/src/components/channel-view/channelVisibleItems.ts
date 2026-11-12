import {
  BACKDROP_FOLDED_ITEM_TYPES,
  type ChannelPageItem,
  type ChannelPageItemType,
} from '../../lib/channelPageLayout';

/** The layout items the channel page renders as blocks.
 *
 * In view mode, chat (the right rail) and navigation (config for the hero's
 * tab bar) never render as blocks, even when an older saved layout marks
 * them visible. With 2+ navigation tabs, an item assigned to a tab shows
 * only while that tab is active; an item in no tab always shows, so a block
 * added after the tabs exist doesn't vanish. Bio, CTA and avatar are part
 * of the backdrop, never their own block, in either mode. Links sit
 * under the bio in that same block, so the links layer does not paint a
 * second card.
 *
 * Radio stations show programming instead of artist identity: no bio,
 * links or subscribe CTA, and always a Programming block. */
export function channelVisibleItems({
  layout,
  editing,
  showNavTabs,
  navTabbedItemIds,
  activeNavTabItemIds,
  isRadioChannel,
}: {
  layout: ChannelPageItem[];
  editing: boolean;
  showNavTabs: boolean;
  navTabbedItemIds: ReadonlySet<string>;
  activeNavTabItemIds: readonly string[] | undefined;
  isRadioChannel: boolean;
}): ChannelPageItem[] {
  const base = (
    editing
      ? layout
      : layout.filter((item) => {
          if (
            !item.visible ||
            item.type === 'chat' ||
            item.type === 'navigation'
          ) {
            return false;
          }
          if (showNavTabs && navTabbedItemIds.has(item.id)) {
            return activeNavTabItemIds?.includes(item.id) ?? true;
          }
          return true;
        })
  ).filter(
    (item) =>
      item.type !== 'links' &&
      !BACKDROP_FOLDED_ITEM_TYPES.includes(item.type as ChannelPageItemType),
  );
  if (!isRadioChannel) {
    return base;
  }
  const withoutArtistBlocks = base.filter(
    (item) =>
      item.type !== 'about' &&
      item.type !== 'links' &&
      item.type !== 'subscribe',
  );
  return withoutArtistBlocks.some((item) => item.type === 'programming')
    ? withoutArtistBlocks
    : [
        ...withoutArtistBlocks,
        { id: 'programming', type: 'programming' as const, visible: true },
      ];
}
