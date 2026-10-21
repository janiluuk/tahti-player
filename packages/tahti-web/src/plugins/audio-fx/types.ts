import type { LucideIcon } from 'lucide-react';

import type { EditList, ProEditorPluginId } from '../../api/studio-types';

/**
 * One node in the Pro Editor's plugin chain. Owns its own tile metadata
 * (for `PluginStorePanel`/the add-plugin picker) and how it turns
 * `EditList` params into live Web Audio nodes for preview playback — a
 * new plugin means a new module implementing this, not a branch inside
 * `useAudioPreviewGraph`.
 */
export interface AudioFxPlugin {
  id: ProEditorPluginId;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Tile background — brand-mark style, same idiom as SourceServiceIcon. */
  bg: string;
  isEnabled(editList: EditList): boolean;
  /**
   * Builds this plugin's Web Audio nodes for the live preview graph. The
   * caller connects the returned nodes in series, in order, between
   * whatever came before and whatever comes after in the user's
   * drag-ordered chain.
   */
  buildPreviewNodes(ctx: AudioContext, editList: EditList): AudioNode[];
  /**
   * Writes the current parameters onto nodes this plugin built earlier,
   * without rebuilding the graph. Only called while `previewShape` is
   * unchanged, so the node list has the same shape as when it was built.
   */
  updatePreviewNodes(
    nodes: AudioNode[],
    editList: EditList,
    ctx?: BaseAudioContext,
  ): void;
  /**
   * What decides which nodes `buildPreviewNodes` returns (e.g. the filter's
   * mode and slope). A change rebuilds the graph; anything else is a
   * parameter update. Omit when the node list never changes.
   */
  previewShape?(editList: EditList): string;
}
