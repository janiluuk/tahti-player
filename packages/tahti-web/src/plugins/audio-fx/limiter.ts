import { ShieldAlert } from 'lucide-react';

import { setParam } from './params';
import type { AudioFxPlugin } from './types';

/**
 * A fast high-ratio DynamicsCompressorNode, not a true brickwall limiter —
 * close enough for an audible preview. The real ffmpeg render path is
 * still the source of truth for the exported file.
 */
export const limiterPlugin: AudioFxPlugin = {
  id: 'limiter',
  label: 'Limiter',
  description: 'Fast ceiling limiter',
  icon: ShieldAlert,
  bg: '#dc2626',
  isEnabled: (editList) => editList.limiter.enabled,
  buildPreviewNodes: (ctx, editList) => {
    const limiter = ctx.createDynamicsCompressor();
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiterPlugin.updatePreviewNodes([limiter], editList);
    return [limiter];
  },
  updatePreviewNodes: (nodes, editList, ctx) => {
    const limiter = nodes[0] as DynamicsCompressorNode;
    setParam(limiter.threshold, editList.limiter.ceilingDb, ctx);
    setParam(limiter.release, editList.limiter.releaseMs / 1000, ctx);
  },
};
