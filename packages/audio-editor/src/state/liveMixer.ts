import {
  getEngineCtx,
  getMasterGain,
  resumeEngine,
} from '@tahti-player/audio-core';
import {
  buildEffectChain,
  getRackEffect,
  SPATIAL_TELEPORT,
  teleportXYZ,
  type ChainEntry,
  type ChainHandle,
} from '@tahti-player/audio-rack';

import { sliceChunks, type AudioChunk } from '../lib/audioAnalysis';
import {
  activeFxLanes,
  activeTrackLane,
  fxWriteTimes,
  PAN_RANGE,
  scheduleLaneOnParam,
  VOLUME_RANGE,
} from '../lib/automation';
import {
  clipPeakGain,
  sampleLane,
  useEditorStore,
  type AudioClip,
  type AutomationLane,
  type EditorTrack,
} from './editorStore';
import { logError } from './log';

const RAMP_TC = 0.015;
const FX_WRITE_EPSILON = 1e-4;
const OFFLINE_FX_STEP_SEC = 0.02;

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
const lastFxWrite = new Map<string, number>();

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
  writeFxAutomation(Math.max(0, now));
  const { loopEnabled, loopStart, loopEnd } = useEditorStore.getState();
  if (loopEnabled && loopEnd > loopStart && now >= loopEnd) {
    void seek(loopStart);
    return;
  }
  raf = requestAnimationFrame(tick);
}

function paramDefault(entryEffect: string, key: string): number | undefined {
  return getRackEffect(entryEffect)?.params.find((p) => p.key === key)?.default;
}

function writeFxAutomation(timelineSec: number): void {
  const { automationLanes } = useEditorStore.getState();
  for (const [trackId, nodes] of trackNodes) {
    if (!nodes.chain) {
      continue;
    }
    for (const lane of activeFxLanes(automationLanes, trackId)) {
      const v = sampleLane(lane, timelineSec);
      const { entryId, paramKey } = lane.target;
      if (v === null || !entryId || !paramKey) {
        continue;
      }
      const prev = lastFxWrite.get(lane.id);
      if (prev !== undefined && Math.abs(prev - v) < FX_WRITE_EPSILON) {
        continue;
      }
      lastFxWrite.set(lane.id, v);
      nodes.chain.updateParams(entryId, { [paramKey]: v });
    }
  }
}

function applyTrackAutomation(
  lanes: readonly AutomationLane[],
  playhead: number,
  ctxStart: number,
): void {
  lastFxWrite.clear();
  for (const [trackId, nodes] of trackNodes) {
    const vol = activeTrackLane(lanes, trackId, 'trackVolume');
    if (vol) {
      scheduleLaneOnParam(
        nodes.gain.gain,
        vol,
        playhead,
        ctxStart,
        VOLUME_RANGE,
      );
    }
    const pan = activeTrackLane(lanes, trackId, 'trackPan');
    if (pan) {
      scheduleLaneOnParam(nodes.panner.pan, pan, playhead, ctxStart, PAN_RANGE);
    }
  }
  writeFxAutomation(playhead);
}

/** Hand the params back to the static mixer values once the transport stops. */
function releaseAutomation(): void {
  const st = useEditorStore.getState();
  for (const track of st.tracks) {
    const nodes = trackNodes.get(track.id);
    if (!nodes) {
      continue;
    }
    nodes.gain.gain.cancelScheduledValues(0);
    nodes.panner.pan.cancelScheduledValues(0);
    for (const lane of activeFxLanes(st.automationLanes, track.id)) {
      const { entryId, paramKey } = lane.target;
      const entry = (track.fxChain ?? []).find((e) => e.id === entryId);
      if (!entry || !paramKey || !nodes.chain) {
        continue;
      }
      const v = entry.params[paramKey] ?? paramDefault(entry.effect, paramKey);
      if (v !== undefined) {
        nodes.chain.updateParams(entry.id, { [paramKey]: v });
      }
    }
  }
  lastFxWrite.clear();
  syncMixerParams();
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
  applyTrackAutomation(st.automationLanes, playhead, when0);
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
  releaseAutomation();
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
    // While playing, an automated param follows its lane; a fader move must not
    // cut into the scheduled envelope.
    if (
      !playing ||
      !activeTrackLane(st.automationLanes, track.id, 'trackVolume')
    ) {
      nodes.gain.gain.setTargetAtTime(track.volume, ctx.currentTime, RAMP_TC);
    }
    if (
      !playing ||
      !activeTrackLane(st.automationLanes, track.id, 'trackPan')
    ) {
      nodes.panner.pan.setTargetAtTime(track.pan, ctx.currentTime, RAMP_TC);
    }
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
  const trackHandles: ChainHandle[] = [];
  const fxWrites: OfflineFxWrites = new Map();
  for (const track of st.tracks) {
    if (track.mute || (anySolo && !track.solo)) {
      continue;
    }
    const tGain = offline.createGain();
    tGain.gain.value = track.volume;
    const pan = offline.createStereoPanner();
    pan.pan.value = track.pan;
    const volLane = activeTrackLane(
      st.automationLanes,
      track.id,
      'trackVolume',
    );
    if (volLane) {
      scheduleLaneOnParam(tGain.gain, volLane, 0, 0, VOLUME_RANGE);
    }
    const panLane = activeTrackLane(st.automationLanes, track.id, 'trackPan');
    if (panLane) {
      scheduleLaneOnParam(pan.pan, panLane, 0, 0, PAN_RANGE);
    }
    const fxLanes = activeFxLanes(st.automationLanes, track.id);
    const insertIn = offline.createGain();
    const insertOut = offline.createGain();
    tGain.connect(insertIn);
    const chain = (
      (track.fxChain ?? []).filter(
        (e) => e.enabled && e.effect !== 'vst3',
      ) as ChainEntry[]
    ).map((e) => withLaneStartValues(e, fxLanes));
    const handle = chain.length
      ? buildEffectChain(offline, insertIn, insertOut, chain)
      : null;
    if (handle) {
      trackHandles.push(handle);
      collectOfflineFxWrites(fxWrites, handle, fxLanes, end);
    } else {
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
  }
  registerOfflineFxWrites(offline, fxWrites, end);

  const rendered = await offline.startRendering();
  // Track chains stay wired until rendering finishes; disposing them inside
  // the loop disconnected every track insert before a sample was rendered.
  for (const h of trackHandles) {
    h.dispose();
  }
  mh?.dispose();
  const { encodeWav } = await import('../lib/wavEncode');
  return encodeWav(rendered);
}

function withLaneStartValues(
  entry: ChainEntry,
  lanes: readonly AutomationLane[],
): ChainEntry {
  const own = lanes.filter((l) => l.target.entryId === entry.id);
  if (!own.length) {
    return entry;
  }
  const params = { ...entry.params };
  for (const lane of own) {
    const v = sampleLane(lane, 0);
    if (v !== null && lane.target.paramKey) {
      params[lane.target.paramKey] = v;
    }
  }
  return { ...entry, params };
}

/** Pending FX param pushes keyed by render time in ms. One map serves every
 *  track because an OfflineAudioContext rejects a second suspend at a time
 *  that already has one. */
type OfflineFxWrites = Map<number, Array<() => void>>;

function collectOfflineFxWrites(
  writes: OfflineFxWrites,
  handle: ChainHandle,
  lanes: readonly AutomationLane[],
  endSec: number,
): void {
  for (const lane of lanes) {
    const { entryId, paramKey } = lane.target;
    if (!entryId || !paramKey) {
      continue;
    }
    for (const t of fxWriteTimes(lane, OFFLINE_FX_STEP_SEC, endSec)) {
      const key = Math.round(t * 1000);
      const list = writes.get(key) ?? [];
      list.push(() => {
        const v = sampleLane(lane, t);
        if (v !== null) {
          handle.updateParams(entryId, { [paramKey]: v });
        }
      });
      writes.set(key, list);
    }
  }
}

function registerOfflineFxWrites(
  offline: OfflineAudioContext,
  writes: OfflineFxWrites,
  endSec: number,
): void {
  // Rack params are plain values, not AudioParams, so an offline render can only
  // follow them by pausing at fixed steps and pushing the next value.
  for (const [ms, fns] of writes) {
    const t = ms / 1000;
    if (t <= 0 || t >= endSec) {
      continue;
    }
    offline
      .suspend(t)
      .then(() => {
        for (const fn of fns) {
          fn();
        }
        return offline.resume();
      })
      .catch((e: unknown) =>
        logError('liveMixer', e instanceof Error ? e.message : String(e)),
      );
  }
}
