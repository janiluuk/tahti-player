import {
  getRackEffect,
  type ChainEntry,
  type RackParamDescriptor,
} from '@tahti-player/audio-rack';

import {
  sampleLane,
  type AutomationLane,
  type AutomationPoint,
  type AutomationTarget,
  type EditorTrack,
} from '../state/editorStore';

export type AutomationLaneKind = 'volume' | 'pan' | 'fx';

export interface AutomationRange {
  min: number;
  max: number;
}

export const VOLUME_RANGE: AutomationRange = { min: 0, max: 1 };
export const PAN_RANGE: AutomationRange = { min: -1, max: 1 };

export interface TrackFxAutomationParam {
  entryId: string;
  paramKey: string;
  label: string;
  range: AutomationRange;
}

const isContinuous = (p: RackParamDescriptor): boolean =>
  !p.options &&
  p.kind !== 'toggle' &&
  p.kind !== 'select' &&
  p.max > p.min &&
  !(p.min === 0 && p.max === 1 && p.step === 1);

/** The one FX parameter a track exposes for automation: the first enabled rack
 *  effect's wet/dry when it declares one, else its first continuous param. */
export function trackFxAutomationParam(
  track: Pick<EditorTrack, 'fxChain'>,
): TrackFxAutomationParam | null {
  for (const entry of (track.fxChain ?? []) as ChainEntry[]) {
    if (!entry.enabled || entry.effect === 'vst3') {
      continue;
    }
    const def = getRackEffect(entry.effect);
    if (!def) {
      continue;
    }
    const param =
      def.params.find((p) => p.key === def.mixKey && isContinuous(p)) ??
      def.params.find(isContinuous);
    if (!param) {
      continue;
    }
    return {
      entryId: entry.id,
      paramKey: param.key,
      label: `${def.label} ${param.label}`,
      range: { min: param.min, max: param.max },
    };
  }
  return null;
}

export function automationTargetFor(
  kind: AutomationLaneKind,
  trackId: string,
  fx: TrackFxAutomationParam | null,
): AutomationTarget | null {
  if (kind === 'volume') {
    return { kind: 'trackVolume', trackId };
  }
  if (kind === 'pan') {
    return { kind: 'trackPan', trackId };
  }
  if (!fx) {
    return null;
  }
  return {
    kind: 'trackFx',
    trackId,
    entryId: fx.entryId,
    paramKey: fx.paramKey,
  };
}

export const clampToRange = (v: number, r: AutomationRange): number =>
  Math.max(r.min, Math.min(r.max, v));

/** Enabled lanes with at least one point that drive `kind` on `trackId`. */
export function activeTrackLane(
  lanes: readonly AutomationLane[],
  trackId: string,
  kind: 'trackVolume' | 'trackPan',
): AutomationLane | undefined {
  return lanes.find(
    (l) =>
      l.enabled &&
      l.points.length > 0 &&
      l.target.kind === kind &&
      l.target.trackId === trackId,
  );
}

export function activeFxLanes(
  lanes: readonly AutomationLane[],
  trackId: string,
): AutomationLane[] {
  return lanes.filter(
    (l) =>
      l.enabled &&
      l.points.length > 0 &&
      l.target.kind === 'trackFx' &&
      l.target.trackId === trackId &&
      l.target.entryId &&
      l.target.paramKey,
  );
}

export type ParamEvent =
  | { type: 'set'; at: number; v: number }
  | { type: 'ramp'; at: number; v: number };

/** The AudioParam events that play `lane` from timeline `fromSec`, with `at`
 *  relative to the moment playback reaches `fromSec`. A set at 0 pins the
 *  interpolated value under the playhead, then one linear ramp per later point. */
export function laneParamEvents(
  lane: AutomationLane,
  fromSec: number,
): ParamEvent[] {
  const v0 = sampleLane(lane, fromSec);
  if (v0 === null) {
    return [];
  }
  const events: ParamEvent[] = [{ type: 'set', at: 0, v: v0 }];
  for (const p of lane.points) {
    if (p.t > fromSec) {
      events.push({ type: 'ramp', at: p.t - fromSec, v: p.v });
    }
  }
  return events;
}

/** Write a lane onto an AudioParam so the audio thread follows it
 *  sample-accurately; `ctxStart` is the context time at timeline `fromSec`. */
export function scheduleLaneOnParam(
  param: AudioParam,
  lane: AutomationLane,
  fromSec: number,
  ctxStart: number,
  range: AutomationRange,
): void {
  param.cancelScheduledValues(0);
  for (const e of laneParamEvents(lane, fromSec)) {
    const v = clampToRange(e.v, range);
    if (e.type === 'set') {
      param.setValueAtTime(v, ctxStart + e.at);
    } else {
      param.linearRampToValueAtTime(v, ctxStart + e.at);
    }
  }
}

/** Timeline times at which an offline render pauses to push an FX lane's value
 *  into the effect (rack params are plain values, not AudioParams). */
export function fxWriteTimes(
  lane: AutomationLane,
  stepSec: number,
  endSec: number,
): number[] {
  const pts = lane.points;
  if (pts.length < 2) {
    return [];
  }
  const from = Math.max(0, pts[0].t);
  const to = Math.min(endSec, pts[pts.length - 1].t);
  const times: number[] = [];
  for (let t = from; t <= to + 1e-9; t += stepSec) {
    times.push(t);
  }
  return times;
}

/* Serialized lanes travel inside the editor-projects `timeline` JSON, which the
   API caps at 500,000 bytes for the whole document. Points are rounded and the
   automation block is held to a budget well under that cap so clips never fail
   to save because of automation. */
export const AUTOMATION_SYNC_MAX_BYTES = 200_000;
const MAX_POINTS_PER_LANE = 4000;

export interface SerializedAutomationLane {
  id: string;
  target: AutomationTarget;
  enabled: boolean;
  points: Array<[number, number]>;
}

export interface SerializedAutomation {
  version: 1;
  lanes: SerializedAutomationLane[];
}

const round = (n: number, places: number): number => {
  const f = 10 ** places;
  return Math.round(n * f) / f;
};

/** Compact form for metadata sync. Returns null when there is nothing to sync
 *  or the lanes exceed AUTOMATION_SYNC_MAX_BYTES (they then stay OPFS-only). */
export function serializeAutomation(
  lanes: readonly AutomationLane[],
): SerializedAutomation | null {
  const out: SerializedAutomationLane[] = lanes
    .filter((l) => l.points.length > 0)
    .map((l) => ({
      id: l.id,
      target: { ...l.target },
      enabled: l.enabled,
      points: l.points
        .slice(0, MAX_POINTS_PER_LANE)
        .map((p): [number, number] => [round(p.t, 3), round(p.v, 4)]),
    }));
  if (!out.length) {
    return null;
  }
  const data: SerializedAutomation = { version: 1, lanes: out };
  return JSON.stringify(data).length <= AUTOMATION_SYNC_MAX_BYTES ? data : null;
}

const TARGET_KINDS = new Set([
  'trackVolume',
  'trackPan',
  'trackFx',
  'masterFx',
]);

const optString = (v: unknown): string | undefined =>
  typeof v === 'string' && v ? v : undefined;

function parseTarget(raw: unknown): AutomationTarget | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.kind !== 'string' || !TARGET_KINDS.has(r.kind)) {
    return null;
  }
  const target: AutomationTarget = {
    kind: r.kind as AutomationTarget['kind'],
  };
  const trackId = optString(r.trackId);
  const entryId = optString(r.entryId);
  const paramKey = optString(r.paramKey);
  if (trackId) {
    target.trackId = trackId;
  }
  if (entryId) {
    target.entryId = entryId;
  }
  if (paramKey) {
    target.paramKey = paramKey;
  }
  return target;
}

function parsePoints(raw: unknown): AutomationPoint[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const pts: AutomationPoint[] = [];
  for (const p of raw.slice(0, MAX_POINTS_PER_LANE)) {
    if (
      Array.isArray(p) &&
      Number.isFinite(p[0]) &&
      Number.isFinite(p[1]) &&
      (p[0] as number) >= 0
    ) {
      pts.push({ t: p[0] as number, v: p[1] as number });
    }
  }
  return pts.sort((a, b) => a.t - b.t);
}

/** Inverse of serializeAutomation. Tolerates foreign or damaged JSON: anything
 *  malformed is dropped, and lanes for tracks not in `trackIds` are skipped. */
export function parseAutomation(
  raw: unknown,
  trackIds?: ReadonlySet<string>,
): AutomationLane[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  const lanes = (raw as { lanes?: unknown }).lanes;
  if (!Array.isArray(lanes)) {
    return [];
  }
  const out: AutomationLane[] = [];
  for (const l of lanes) {
    if (!l || typeof l !== 'object') {
      continue;
    }
    const r = l as Record<string, unknown>;
    const target = parseTarget(r.target);
    const id = optString(r.id);
    if (!target || !id) {
      continue;
    }
    if (trackIds && target.trackId && !trackIds.has(target.trackId)) {
      continue;
    }
    const points = parsePoints(r.points);
    if (!points.length) {
      continue;
    }
    out.push({ id, target, enabled: r.enabled !== false, points });
  }
  return out;
}
