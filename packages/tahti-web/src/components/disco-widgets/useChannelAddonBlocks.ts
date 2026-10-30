import { useCallback, useEffect, useState } from 'react';

import {
  addonInstallIdOf,
  createAddonBlock,
  createLogoBlock,
  deleteChannelBlock,
  fetchMyChannelBlocks,
  patchChannelBlockWidth,
  reorderChannelBlocks,
  type ChannelBlockView,
  type ChannelBlockWidth,
} from '../../api/channel-blocks';
import { reorderedBlockIds } from '../../lib/channelBlockLayout';

type Failure = string | null;

/** The channel layout behind the artist's add-on list: each add-on's width,
 * kept in the same order as the list. Until a width is first changed there
 * is no layout and every add-on renders full width in list order. */
export function useChannelAddonBlocks(enabled: boolean) {
  const [blocks, setBlocks] = useState<ChannelBlockView[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    void fetchMyChannelBlocks().then((result) => {
      if (!cancelled && result.data) {
        setBlocks(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const blockFor = useCallback(
    (installId: string) =>
      blocks.find((block) => addonInstallIdOf(block) === installId),
    [blocks],
  );

  const widthOf = (installId: string): ChannelBlockWidth =>
    blockFor(installId)?.width ?? 'FULL';

  const syncOrder = async (
    current: ChannelBlockView[],
    installOrder: string[],
  ): Promise<Failure> => {
    if (current.length === 0) {
      return null;
    }
    const ids = reorderedBlockIds(
      current.map((block) => ({
        id: block.id,
        installId: addonInstallIdOf(block),
      })),
      installOrder,
    );
    if (ids.every((id, index) => id === current[index]!.id)) {
      return null;
    }
    const result = await reorderChannelBlocks(ids);
    if (result.error) {
      return result.error;
    }
    const byId = new Map(current.map((block) => [block.id, block]));
    setBlocks(ids.map((id, position) => ({ ...byId.get(id)!, position })));
    return null;
  };

  const create = async (
    current: ChannelBlockView[],
    installIds: string[],
    widthFor: (installId: string) => ChannelBlockWidth,
  ): Promise<{ blocks: ChannelBlockView[]; error: Failure }> => {
    const next = [...current];
    for (const installId of installIds) {
      const result = await createAddonBlock(installId, widthFor(installId));
      if (result.error !== null) {
        setBlocks(next);
        return { blocks: next, error: result.error };
      }
      next.push(result.data);
    }
    setBlocks(next);
    return { blocks: next, error: null };
  };

  /** Sets one add-on's width. The first change lays out every add-on, so
   * the order on the channel stays the list's order. */
  const setWidth = async (
    installId: string,
    width: ChannelBlockWidth,
    installOrder: string[],
  ): Promise<Failure> => {
    const existing = blockFor(installId);
    if (existing) {
      const result = await patchChannelBlockWidth(existing.id, width);
      if (result.error) {
        return result.error;
      }
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === existing.id ? { ...block, width } : block,
        ),
      );
      return null;
    }
    const missing =
      blocks.length === 0
        ? installOrder
        : installOrder.filter((id) => id === installId);
    const created = await create(blocks, missing, (id) =>
      id === installId ? width : 'FULL',
    );
    return created.error ?? syncOrder(created.blocks, installOrder);
  };

  /** Keeps a newly installed add-on in an existing layout. */
  const place = async (
    installId: string,
    installOrder: string[],
  ): Promise<Failure> => {
    if (blocks.length === 0 || blockFor(installId)) {
      return null;
    }
    const created = await create(blocks, [installId], () => 'FULL');
    return created.error ?? syncOrder(created.blocks, installOrder);
  };

  const addLogo = async (config: {
    assetId: string;
    url: string;
  }): Promise<{ error: Failure; block?: ChannelBlockView }> => {
    const result = await createLogoBlock(config, 'FULL');
    if (result.error || !result.data) {
      return { error: result.error ?? 'Could not place the logo' };
    }
    setBlocks((prev) => [...prev, result.data]);
    return { error: null, block: result.data };
  };

  const removeBlock = async (id: string): Promise<Failure> => {
    const result = await deleteChannelBlock(id);
    if (result.error) {
      return result.error;
    }
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    return null;
  };

  const setBlockWidth = async (
    id: string,
    width: ChannelBlockWidth,
  ): Promise<Failure> => {
    const result = await patchChannelBlockWidth(id, width);
    if (result.error) {
      return result.error;
    }
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, width } : block)),
    );
    return null;
  };

  const unplace = async (installId: string): Promise<Failure> => {
    const existing = blockFor(installId);
    if (!existing) {
      return null;
    }
    const result = await deleteChannelBlock(existing.id);
    if (result.error) {
      return result.error;
    }
    setBlocks((prev) => prev.filter((block) => block.id !== existing.id));
    return null;
  };

  return {
    blocks,
    widthOf,
    setWidth,
    place,
    unplace,
    addLogo,
    removeBlock,
    setBlockWidth,
    reorder: (installOrder: string[]) => syncOrder(blocks, installOrder),
  };
}
