import { Gauge } from 'lucide-react';

import { setParam } from './params';
import type { AudioFxPlugin } from './types';

export const compPlugin: AudioFxPlugin = {
  id: 'comp',
  label: 'Compressor',
  description: 'Dynamics compressor',
  icon: Gauge,
  bg: '#7c3aed',
  isEnabled: (editList) => editList.comp.enabled,
  previewShape: (editList) => (editList.comp.makeupDb !== 0 ? 'makeup' : ''),
  buildPreviewNodes: (ctx, editList) => {
    const nodes: AudioNode[] = [ctx.createDynamicsCompressor()];
    if (editList.comp.makeupDb !== 0) {
      nodes.push(ctx.createGain());
    }
    compPlugin.updatePreviewNodes(nodes, editList);
    return nodes;
  },
  updatePreviewNodes: (nodes, editList, ctx) => {
    const { thresholdDb, ratio, attackMs, releaseMs, makeupDb } = editList.comp;
    const comp = nodes[0] as DynamicsCompressorNode;
    setParam(comp.threshold, thresholdDb, ctx);
    setParam(comp.ratio, ratio, ctx);
    setParam(comp.attack, attackMs / 1000, ctx);
    setParam(comp.release, releaseMs / 1000, ctx);
    const makeup = nodes[1] as GainNode | undefined;
    if (makeup) {
      setParam(makeup.gain, Math.pow(10, makeupDb / 20), ctx);
    }
  },
};
