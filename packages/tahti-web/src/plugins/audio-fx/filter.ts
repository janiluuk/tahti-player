import { Filter as FilterIcon } from 'lucide-react';

import type { EditList } from '../../api/studio-types';
import { setParam } from './params';
import type { AudioFxPlugin } from './types';

type FilterSettings = EditList['filter'];

/** Biquads in series, matching the render (`@tahti/audio-edit` filter
 * plugin): high/low-pass cascade 1/2/4 12 dB-per-octave stages for
 * 12 dB / 24 dB / brickwall; shelves are a -60 dB shelf cut, doubled for
 * brickwall. */
const HP_LP_STAGES: Record<FilterSettings['slope'], number> = {
  '12db': 1,
  '24db': 2,
  brickwall: 4,
};

/** The render uses shelves as filters (cut past the corner), not tone
 * shaping. */
export const SHELF_CUT_DB = -60;

export function filterStageCount(filter: FilterSettings): number {
  if (filter.mode === 'highpass' || filter.mode === 'lowpass') {
    return HP_LP_STAGES[filter.slope];
  }
  return filter.slope === 'brickwall' ? 2 : 1;
}

export const filterPlugin: AudioFxPlugin = {
  id: 'filter',
  label: 'Filter',
  description: 'High/low-pass or shelf filter',
  icon: FilterIcon,
  bg: '#059669',
  isEnabled: (editList) => editList.filter.enabled,
  previewShape: (editList) =>
    `${editList.filter.mode}:${filterStageCount(editList.filter)}`,
  buildPreviewNodes: (ctx, editList) => {
    const nodes = Array.from(
      { length: filterStageCount(editList.filter) },
      () => {
        const filter = ctx.createBiquadFilter();
        filter.type = editList.filter.mode;
        return filter;
      },
    );
    filterPlugin.updatePreviewNodes(nodes, editList);
    return nodes;
  },
  updatePreviewNodes: (nodes, editList, ctx) => {
    const shelf =
      editList.filter.mode === 'lowshelf' ||
      editList.filter.mode === 'highshelf';
    for (const node of nodes as BiquadFilterNode[]) {
      setParam(node.frequency, editList.filter.freq, ctx);
      if (shelf) {
        setParam(node.gain, SHELF_CUT_DB, ctx);
      } else {
        setParam(node.Q, Math.SQRT1_2, ctx);
      }
    }
  },
};
