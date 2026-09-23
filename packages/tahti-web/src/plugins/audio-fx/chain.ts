import type { EditList, ProEditorPluginId } from '../../api/studio-types';

export function addPluginToChain(
  editList: EditList,
  pluginId: ProEditorPluginId,
): EditList {
  const pluginChain = editList.pluginChain ?? [];
  if (pluginChain.includes(pluginId)) {
    return editList;
  }
  return {
    ...editList,
    pluginChain: [...pluginChain, pluginId],
    [pluginId]: { ...editList[pluginId], enabled: true },
  };
}

export function removePluginFromChain(
  editList: EditList,
  pluginId: ProEditorPluginId,
): EditList {
  return {
    ...editList,
    pluginChain: (editList.pluginChain ?? []).filter((id) => id !== pluginId),
    [pluginId]: { ...editList[pluginId], enabled: false },
  };
}

export function reorderPluginChain(
  editList: EditList,
  draggedId: ProEditorPluginId,
  targetId: ProEditorPluginId,
): EditList {
  if (draggedId === targetId) {
    return editList;
  }
  const pluginChain = [...(editList.pluginChain ?? [])];
  const draggedIndex = pluginChain.indexOf(draggedId);
  const targetIndex = pluginChain.indexOf(targetId);
  if (draggedIndex === -1 || targetIndex === -1) {
    return editList;
  }
  pluginChain.splice(draggedIndex, 1);
  pluginChain.splice(targetIndex, 0, draggedId);
  return { ...editList, pluginChain };
}

/** Order the render used before drafts carried a chain. */
const LEGACY_RENDER_ORDER: ProEditorPluginId[] = [
  'filter',
  'eq',
  'comp',
  'limiter',
];

/**
 * Drafts saved before the server kept `pluginChain` come back without one,
 * while their plugins may still be enabled (and rendered). Rebuild the
 * chain from those enabled flags, in the order the render applied them, so
 * the editor shows and plays what the export does.
 */
export function withLegacyChain(editList: EditList): EditList {
  if (editList.pluginChain) {
    return editList;
  }
  return {
    ...editList,
    pluginChain: LEGACY_RENDER_ORDER.filter((id) => editList[id].enabled),
  };
}

/** The chain the render should apply: only plugins whose add-on is
 * installed, same as the live preview. */
export function chainForRender(
  editList: EditList,
  installedIds: readonly ProEditorPluginId[],
): EditList {
  return {
    ...editList,
    pluginChain: (editList.pluginChain ?? []).filter((id) =>
      installedIds.includes(id),
    ),
  };
}
