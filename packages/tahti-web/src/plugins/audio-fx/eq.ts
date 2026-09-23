import { SlidersHorizontal } from 'lucide-react';

import { setParam } from './params';
import type { AudioFxPlugin } from './types';

export const eqPlugin: AudioFxPlugin = {
  id: 'eq',
  label: 'EQ',
  description: '3-band parametric equalizer',
  icon: SlidersHorizontal,
  bg: '#0ea5e9',
  isEnabled: (editList) => editList.eq.enabled,
  previewShape: (editList) => String(editList.eq.bands.length),
  buildPreviewNodes: (ctx, editList) => {
    const nodes = editList.eq.bands.map(() => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      return filter;
    });
    eqPlugin.updatePreviewNodes(nodes, editList);
    return nodes;
  },
  updatePreviewNodes: (nodes, editList, ctx) => {
    editList.eq.bands.forEach((band, i) => {
      const filter = nodes[i] as BiquadFilterNode | undefined;
      if (!filter) {
        return;
      }
      setParam(filter.frequency, band.freq, ctx);
      setParam(filter.Q, band.q, ctx);
      setParam(filter.gain, band.gainDb, ctx);
    });
  },
};
