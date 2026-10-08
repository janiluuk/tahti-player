import {
  getEngineCtx,
  getMasterGain,
  resumeEngine,
} from '@tahti-player/audio-core';
import {
  buildEffectChain,
  SPATIAL_TELEPORT,
  teleportXYZ,
  type ChainEntry,
  type ChainHandle,
} from '@tahti-player/audio-rack';

import { sliceChunks, type AudioChunk } from '../lib/audioAnalysis';
import {
  clipPeakGain,
  useEditorStore,
  type AudioClip,
  type EditorTrack,
} from './editorStore';
import { logError } from './log';

const RAMP_TC = 0.015;

const decodeCache = new WeakMap<Blob, AudioBuffer>();
const analysisCache = new WeakMap<Blob, AudioChunk[]>();

interface TrackNodes {
  gain: GainNode;
  muteGain: GainNode;
  panner: StereoPannerNode;
  insertIn: GainNode;
  insertOut: GainNode;
  chain: ChainHandle | null;
}

let sessionMaster: GainNode | null = null;
let masterChain: ChainHandle | null = null;
let masterInsertIn: GainNode | null = null;
let masterInsertOut: GainNode | null = null;
const trackNodes = new Map<string, TrackNodes>();
let playing = false;
let startCtxTime = 0;
let startPlayhead = 0;
let raf = 0;
const scheduled: AudioBufferSourceNode[] = [];

async function decodeBlob(
  ctx: BaseAudioContext,
  blob: Blob,
): Promise<AudioBuffer | null> {
  const hit = decodeCache.get(blob);
  if (hit) {
    return hit;
  }
  try {
    const ab = await blob.arrayBuffer();
    const buf = await ctx.decodeAudioData(ab.slice(0));
    decodeCache.set(blob, buf);
    return buf;
  } catch (e) {
    logError('liveMixer', e instanceof Error ? e.message : String(e));
    return null;
  }
}

function chunksFor(blob: Blob, buf: AudioBuffer): AudioChunk[] {
  let hit = analysisCache.get(blob);
  if (!hit) {
    hit = sliceChunks(buf);
    analysisCache.set(blob, hit);
  }
  return hit;
}

function ensureSession(): GainNode {
  const ctx = getEngineCtx();
  if (!sessionMaster || sessionMaster.context !== ctx) {
    sessionMaster = ctx.createGain();
    masterInsertIn = ctx.createGain();
    masterInsertOut = ctx.createGain();
    sessionMaster.connect(masterInsertIn);
    masterInsertIn.connect(masterInsertOut);
    masterInsertOut.connect(getMasterGain());
  }
  return sessionMaster;
}

function rebuildTrackChain(track: EditorTrack, nodes: TrackNodes): void {
  const ctx = getEngineCtx();
  nodes.chain?.dispose();
  nodes.chain = null;
  try {
    nodes.muteGain.disconnect();
  } catch {
    /* */
  }
  nodes.insertIn = ctx.createGain();
  nodes.insertOut = ctx.createGain();
  const chain = (track.fxChain ?? []).filter(
    (e) => e.enabled && e.effect !== 'vst3',
  ) as ChainEntry[];
  if (chain.length) {
    nodes.chain = buildEffectChain(ctx, nodes.insertIn, nodes.insertOut, chain);
  } else {
    nodes.insertIn.connect(nodes.insertOut);
  }
  nodes.muteGain.connect(nodes.insertIn);
  try {
    nodes.insertOut.disconnect();
  } catch {
    /* */
  }
  nodes.insertOut.connect(nodes.panner);
}

function ensureTrack(track: EditorTrack): TrackNodes {
  const ctx = getEngineCtx();
  let nodes = trackNodes.get(track.id);
  if (!nodes) {
    const gain = ctx.createGain();
    const muteGain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    const insertIn = ctx.createGain();
    const insertOut = ctx.createGain();
    gain.connect(muteGain);
    muteGain.connect(insertIn);
    insertIn.connect(insertOut);
    insertOut.connect(panner);
    panner.connect(ensureSession());
    nodes = { gain, muteGain, panner, insertIn, insertOut, chain: null };
    trackNodes.set(track.id, nodes);
  }
  nodes.gain.gain.setTargetAtTime(track.volume, ctx.currentTime, RAMP_TC);
  nodes.panner.pan.setTargetAtTime(track.pan, ctx.currentTime, RAMP_TC);
  rebuildTrackChain(track, nodes);
  return nodes;
}

function applyMuteSolo(tracks: EditorTrack[]): void {
  const ctx = getEngineCtx();
  const anySolo = tracks.some((t) => t.solo);
  for (const t of tracks) {
    const nodes = trackNodes.get(t.id);
    if (!nodes) {
      continue;
    }
    const audible = !t.mute && (!anySolo || t.solo);
    nodes.muteGain.gain.setTargetAtTime(
      audible ? 1 : 0,
      ctx.currentTime,
      RAMP_TC,
    );
  }
}

function rebuildMasterChain(chain: ChainEntry[]): void {
  ensureSession();
  const ctx = getEngineCtx();
  if (!masterInsertIn || !masterInsertOut || !sessionMaster) {
    return;
  }
  masterChain?.dispose();
  masterChain = null;
  try {
    sessionMaster.disconnect();
  } catch {
    /* */
  }
  masterInsertIn = ctx.createGain();
  masterInsertOut = ctx.createGain();
  sessionMaster.connect(masterInsertIn);
  const enabled = chain.filter((e) => e.enabled && e.effect !== 'vst3');
  if (enabled.length) {
    masterChain = buildEffectChain(
      ctx,
      masterInsertIn,
      masterInsertOut,
      enabled,
    );
  } else {
    masterInsertIn.connect(masterInsertOut);
  }
  masterInsertOut.connect(getMasterGain());
}

function stopAllSources(): void {
  for (const s of scheduled) {
    try {
      s.stop();
      s.disconnect();
    } catch {
      /* */
    }
  }
  scheduled.length = 0;
}

function tick(): void {
  if (!playing) {
    return;
  }
  const ctx = getEngineCtx();
  const now = startPlayhead + (ctx.currentTime - startCtxTime);
  useEditorStore.getState().setPlayhead(Math.max(0, now));
  const { loopEnabled, loopStart, loopEnd } = useEditorStore.getState();
  if (loopEnabled && loopEnd > loopStart && now >= loopEnd) {
    void seek(loopStart);
    return;
  }
  raf = requestAnimationFrame(tick);
}

function clipsForTrack(trackId: string): AudioClip[] {
  return useEditorStore.getState().clips.filter((c) => c.trackId === trackId);
}

async function scheduleFrom(playhead: number): Promise<void> {
  const ctx = getEngineCtx();
  const st = useEditorStore.getState();
  stopAllSources();
  ensureSession();
  for (const track of st.tracks) {
    ensureTrack(track);
  }
  applyMuteSolo(st.tracks);
  rebuildMasterChain(st.masterFxChain as ChainEntry[]);

  const when0 = ctx.currentTime + 0.02;
  for (const track of st.tracks) {
    const nodes = trackNodes.get(track.id);
    if (!nodes) {
      continue;
    }
    for (const clip of clipsForTrack(track.id)) {
      if (clip.muted || !clip.audioBlob) {
        continue;
      }
      if (clip.sourceKind === 'piano-roll') {
        continue;
      }
      const buf = await decodeBlob(ctx, clip.audioBlob);
      if (!buf) {
        continue;
      }
      const clipEnd = clip.startSec + clip.durationSec;
      if (clipEnd <= playhead) {
        continue;
      }
      const offsetIntoClip = Math.max(0, playhead - clip.startSec);
      const srcOffset = clip.offsetIntoSource + offsetIntoClip;
      const remaining = clip.durationSec - offsetIntoClip;
      if (remaining <= 0.001) {
        continue;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const clipGain = ctx.createGain();
      clipGain.gain.value = clipPeakGain(clip);
      src.connect(clipGain);
      clipGain.connect(nodes.gain);
      const startAt = when0 + Math.max(0, clip.startSec - playhead);
      try {
        src.start(startAt, srcOffset, remaining);
        scheduled.push(src);
      } catch (e) {
        logError('liveMixer', e instanceof Error ? e.message : String(e));
      }

      const spatial = (track.fxChain ?? []).find(
        (e) =>
          e.enabled &&
          e.effect === 'spatializer' &&
          e.params.motion === SPATIAL_TELEPORT,
      );
      if (spatial && nodes.chain) {
        const chunks = chunksFor(clip.audioBlob, buf);
        const events = chunks.map((c) => ({
          when: startAt + Math.max(0, c.tSec - offsetIntoClip),
          ...teleportXYZ(
            Math.round(c.tSec * 1000),
            c.loudness,
            c.brightness,
            4,
          ),
        }));
        for (const { inst } of nodes.chain.instances()) {
          inst.scheduleTeleport?.(events);
        }
      }
    }
  }
}

export function isPlaying(): boolean {
  return playing;
}

export function getPlayheadSec(): number {
  if (!playing) {
    return useEditorStore.getState().playheadSec;
  }
  const ctx = getEngineCtx();
  return startPlayhead + (ctx.currentTime - startCtxTime);
}

export async function play(fromSec?: number): Promise<void> {
  await resumeEngine();
  const ph = fromSec ?? useEditorStore.getState().playheadSec;
  startPlayhead = ph;
  startCtxTime = getEngineCtx().currentTime;
  playing = true;
  useEditorStore.getState().setPlaying(true);
  await scheduleFrom(ph);
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(tick);
}

export function stop(): void {
  playing = false;
  useEditorStore.getState().setPlaying(false);
  cancelAnimationFrame(raf);
  stopAllSources();
}

export async function seek(sec: number): Promise<void> {
  useEditorStore.getState().setPlayhead(sec);
  if (playing) {
    startPlayhead = sec;
    startCtxTime = getEngineCtx().currentTime;
    await scheduleFrom(sec);
  }
}

export function syncMixerParams(): void {
  const st = useEditorStore.getState();
  for (const track of st.tracks) {
    const nodes = trackNodes.get(track.id);
    if (!nodes) {
      continue;
    }
    const ctx = getEngineCtx();
    nodes.gain.gain.setTargetAtTime(track.volume, ctx.currentTime, RAMP_TC);
    nodes.panner.pan.setTargetAtTime(track.pan, ctx.currentTime, RAMP_TC);
  }
  applyMuteSolo(st.tracks);
}

export function disposeMixer(): void {
  stop();
  masterChain?.dispose();
  masterChain = null;
  for (const nodes of trackNodes.values()) {
    nodes.chain?.dispose();
  }
  trackNodes.clear();
  sessionMaster = null;
  masterInsertIn = null;
  masterInsertOut = null;
}

export async function bounceMixdown(): Promise<Blob | null> {
  const st = useEditorStore.getState();
  let end = 0;
  for (const c of st.clips) {
    end = Math.max(end, c.startSec + c.durationSec);
  }
  if (end < 0.05) {
    return null;
  }
  const sr = 44100;
  const offline = new OfflineAudioContext(2, Math.ceil(end * sr), sr);
  const master = offline.createGain();
  const masterIn = offline.createGain();
  const masterOut = offline.createGain();
  master.connect(masterIn);
  const masterFx = (st.masterFxChain ?? []).filter(
    (e) => e.enabled && e.effect !== 'vst3',
  ) as ChainEntry[];
  const mh = masterFx.length
    ? buildEffectChain(offline, masterIn, masterOut, masterFx)
    : null;
  if (!mh) {
    masterIn.connect(masterOut);
  }
  masterOut.connect(offline.destination);

  const anySolo = st.tracks.some((t) => t.solo);
  for (const track of st.tracks) {
    if (track.mute || (anySolo && !track.solo)) {
      continue;
    }
    const tGain = offline.createGain();
    tGain.gain.value = track.volume;
    const pan = offline.createStereoPanner();
    pan.pan.value = track.pan;
    const insertIn = offline.createGain();
    const insertOut = offline.createGain();
    tGain.connect(insertIn);
    const chain = (track.fxChain ?? []).filter(
      (e) => e.enabled && e.effect !== 'vst3',
    ) as ChainEntry[];
    const handle = chain.length
      ? buildEffectChain(offline, insertIn, insertOut, chain)
      : null;
    if (!handle) {
      insertIn.connect(insertOut);
    }
    insertOut.connect(pan);
    pan.connect(master);
    for (const clip of st.clips.filter((c) => c.trackId === track.id)) {
      if (clip.muted || !clip.audioBlob) {
        continue;
      }
      if (clip.sourceKind === 'piano-roll') {
        continue;
      }
      const buf = await decodeBlob(offline, clip.audioBlob);
      if (!buf) {
        continue;
      }
      const src = offline.createBufferSource();
      src.buffer = buf;
      const g = offline.createGain();
      g.gain.value = clipPeakGain(clip);
      src.connect(g);
      g.connect(tGain);
      src.start(clip.startSec, clip.offsetIntoSource, clip.durationSec);
    }
    handle?.dispose();
  }

  const rendered = await offline.startRendering();
  mh?.dispose();
  const { encodeWav } = await import('../lib/wavEncode');
  return encodeWav(rendered);
}
