import type { ChannelBlockWidth } from '../api/channel-blocks';

/** Same 6-unit row as tahti-org's `packChannelBlocks`, so a layout made in the
 * legacy dashboard renders the same here. */
export const CHANNEL_BLOCK_ROW_UNITS = 6;

export const CHANNEL_BLOCK_WIDTH_UNITS: Record<ChannelBlockWidth, number> = {
  FULL: 6,
  HALF: 3,
  THIRD: 2,
};

/** Fills rows left to right in order; a block that doesn't fit starts the
 * next row, and the gap it leaves stays empty. */
export function packChannelBlocks<Block extends { width: ChannelBlockWidth }>(
  blocks: Block[],
): Block[][] {
  const rows: Block[][] = [];
  let current: Block[] = [];
  let used = 0;
  for (const block of blocks) {
    const units = CHANNEL_BLOCK_WIDTH_UNITS[block.width];
    if (current.length > 0 && used + units > CHANNEL_BLOCK_ROW_UNITS) {
      rows.push(current);
      current = [];
      used = 0;
    }
    current.push(block);
    used += units;
  }
  if (current.length > 0) {
    rows.push(current);
  }
  return rows;
}

/** New block order after the add-ons were reordered: each add-on block slot
 * takes the next add-on in `installOrder`, logo blocks keep their slots. */
export function reorderedBlockIds(
  blocks: { id: string; installId: string | null }[],
  installOrder: string[],
): string[] {
  const addonBlocks = blocks.filter((block) => block.installId !== null);
  const rank = new Map(installOrder.map((id, index) => [id, index]));
  const sorted = [...addonBlocks].sort(
    (left, right) =>
      (rank.get(left.installId!) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(right.installId!) ?? Number.MAX_SAFE_INTEGER),
  );
  let next = 0;
  return blocks.map((block) =>
    block.installId === null ? block.id : sorted[next++]!.id,
  );
}

/** The add-ons the layout doesn't place, for the plain list under it. */
export function withoutPlacedAddons<Widget extends { installId: string }>(
  widgets: Widget[],
  blocks: { addon: { installId: string } | null }[],
): Widget[] {
  const placed = new Set(
    blocks.flatMap((block) => (block.addon ? [block.addon.installId] : [])),
  );
  return placed.size === 0
    ? widgets
    : widgets.filter((widget) => !placed.has(widget.installId));
}
