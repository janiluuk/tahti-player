import { useEffect, useRef } from 'react';

import type { EditList, ProEditorPluginId } from '../api/studio-types';
import { AUDIO_FX_PLUGINS, useAudioFxStore } from '../plugins/audio-fx';
import { setParam } from '../plugins/audio-fx/params';

type Graph = { ctx: AudioContext; source: MediaElementAudioSourceNode };

type BuiltChain = {
  /** Plugin ids and their `previewShape`s; a change means a rebuild. */
  key: string;
  segments: Array<{ id: ProEditorPluginId; nodes: AudioNode[] }>;
  gain: GainNode;
};

function getAudioContextCtor() {
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  );
}

/**
 * Wires the pro editor's <audio> element through a live Web Audio graph
 * matching the current EditList's EQ/Compressor/Limiter/gain settings, so
 * preview playback is actually processed through the plugin chain -- not
 * just raw playback next to controls that only apply on render.
 *
 * The limiter here is a fast high-ratio DynamicsCompressorNode, not a true
 * brickwall limiter -- close enough for an audible preview; the real
 * ffmpeg render path is still the source of truth for the exported file.
 */
export function useAudioPreviewGraph(
  audioRef: React.RefObject<HTMLAudioElement | null>,
  editList: EditList | null,
) {
  const graphRef = useRef<Graph | null>(null);
  const chainRef = useRef<BuiltChain | null>(null);
  const enabledPluginIds = useAudioFxStore((state) => state.enabledPluginIds);

  function ensureGraph(): Graph | null {
    const audio = audioRef.current;
    if (graphRef.current || !audio) {
      return graphRef.current;
    }
    const Ctx = getAudioContextCtor();
    if (!Ctx) {
      return null;
    }
    try {
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audio);
      graphRef.current = { ctx, source };
    } catch {
      // createMediaElementSource can only run once per element -- a race
      // (e.g. StrictMode double-invoke) leaves graphRef already set.
    }
    return graphRef.current;
  }

  // Resume the context on every play — browsers create AudioContext
  // suspended until a user gesture, and the chain effect below can run
  // before any gesture has happened (e.g. editList loading on mount).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const onPlay = () => {
      const graph = ensureGraph();
      if (graph && graph.ctx.state === 'suspended') {
        void graph.ctx.resume().catch(() => undefined);
      }
    };
    audio.addEventListener('play', onPlay);
    return () => {
      audio.removeEventListener('play', onPlay);
      // Browsers cap live AudioContexts. Close ours once the element is
      // really gone; a StrictMode re-run keeps the element (and must keep
      // the context, since an element can only be wired to one source).
      if (!audio.isConnected && graphRef.current) {
        void graphRef.current.ctx.close().catch(() => undefined);
        graphRef.current = null;
        chainRef.current = null;
      }
    };
  }, [audioRef]);

  useEffect(() => {
    if (!editList) {
      return;
    }
    const graph = ensureGraph();
    if (!graph) {
      return;
    }
    const { ctx, source } = graph;

    // Follows the user's own drag-ordered chain. loudnorm isn't
    // representable as a real-time node (it needs a full-pass loudness
    // analysis), so it stays render/export-only. Each plugin owns its node
    // logic (src/plugins/audio-fx) -- no per-plugin branches here.
    const active = (editList.pluginChain ?? []).filter(
      (id) =>
        enabledPluginIds.includes(id) &&
        AUDIO_FX_PLUGINS[id]?.isEnabled(editList),
    );
    const key = active
      .map(
        (id) => `${id}:${AUDIO_FX_PLUGINS[id].previewShape?.(editList) ?? ''}`,
      )
      .join('|');
    const gainValue = Math.pow(10, editList.gainDb / 20);

    const built = chainRef.current;
    if (built && built.key === key) {
      // Same shape: update parameters in place. Rebuilding on every edit
      // (each slider tick, even a cut) used to drop audio for a moment.
      for (const segment of built.segments) {
        AUDIO_FX_PLUGINS[segment.id].updatePreviewNodes(
          segment.nodes,
          editList,
          ctx,
        );
      }
      setParam(built.gain.gain, gainValue, ctx);
      return;
    }

    source.disconnect();
    for (const segment of built?.segments ?? []) {
      for (const node of segment.nodes) {
        node.disconnect();
      }
    }
    built?.gain.disconnect();

    // Gain before the plugins, like the render (`@tahti/audio-edit`
    // chained stages), so a compressor or limiter reacts to the same level.
    const gain = ctx.createGain();
    gain.gain.value = gainValue;
    source.connect(gain);
    let last: AudioNode = gain;
    const segments = active.map((id) => {
      const nodes = AUDIO_FX_PLUGINS[id].buildPreviewNodes(ctx, editList);
      for (const node of nodes) {
        last.connect(node);
        last = node;
      }
      return { id, nodes };
    });
    last.connect(ctx.destination);
    chainRef.current = { key, segments, gain };
  }, [editList, enabledPluginIds]);
}
