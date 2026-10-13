import { Trash2Icon } from 'lucide-react';
import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { Button, cn, SegmentedControl, Toggle } from '@tahti-player/ui';

import {
  automationTargetFor,
  clampToRange,
  PAN_RANGE,
  trackFxAutomationParam,
  VOLUME_RANGE,
  type AutomationLaneKind,
  type AutomationRange,
} from '../lib/automation';
import {
  automationTargetKey,
  useEditorStore,
  type AudioClip,
  type AutomationLane,
  type EditorTrack,
} from '../state/editorStore';

const LANE_HEIGHT = 56;
const PAD_Y = 6;
const POINT_R = 5;
/* Dragged points stay this far inside their neighbors: the store merges points
   closer than 20 ms, which would otherwise shift the dragged point's index. */
const NEIGHBOR_GAP_SEC = 0.025;
const MIN_LANE_WIDTH = 800;
const TAIL_SEC = 10;
const DOUBLE_PRESS_MS = 350;

type LaneView = 'off' | AutomationLaneKind;

export type TrackAutomationLaneProps = {
  track: EditorTrack;
  clips: AudioClip[];
  pxPerSec: number;
  /** Starting view; the lane opens on Volume when a track already has points. */
  defaultView?: LaneView;
};

function formatValue(kind: AutomationLaneKind, v: number): string {
  if (kind === 'volume') {
    return `${Math.round(v * 100)}%`;
  }
  if (kind === 'pan') {
    if (Math.abs(v) < 0.05) {
      return 'C';
    }
    return v < 0 ? `L${Math.round(-v * 100)}` : `R${Math.round(v * 100)}`;
  }
  return v.toFixed(2);
}

export function TrackAutomationLane({
  track,
  clips,
  pxPerSec,
  defaultView,
}: TrackAutomationLaneProps) {
  const lanes = useEditorStore((s) => s.automationLanes);
  const recordAutomationPoint = useEditorStore((s) => s.recordAutomationPoint);
  const updateAutomationPoint = useEditorStore((s) => s.updateAutomationPoint);
  const removeAutomationPoint = useEditorStore((s) => s.removeAutomationPoint);
  const toggleAutomationLane = useEditorStore((s) => s.toggleAutomationLane);
  const removeAutomationLane = useEditorStore((s) => s.removeAutomationLane);

  const fx = useMemo(() => trackFxAutomationParam(track), [track]);
  const hasPoints = (kind: 'trackVolume' | 'trackPan' | 'trackFx') =>
    lanes.some(
      (l) =>
        l.target.trackId === track.id &&
        l.target.kind === kind &&
        l.points.length > 0,
    );
  const [view, setView] = useState<LaneView>(
    () =>
      defaultView ??
      (hasPoints('trackVolume')
        ? 'volume'
        : hasPoints('trackPan')
          ? 'pan'
          : 'off'),
  );

  const kind: AutomationLaneKind | null = view === 'off' ? null : view;
  const target = kind ? automationTargetFor(kind, track.id, fx) : null;
  const targetKey = target ? automationTargetKey(target) : null;
  const lane: AutomationLane | undefined = targetKey
    ? lanes.find((l) => automationTargetKey(l.target) === targetKey)
    : undefined;
  const range: AutomationRange =
    kind === 'pan' ? PAN_RANGE : kind === 'fx' && fx ? fx.range : VOLUME_RANGE;
  const staticValue =
    kind === 'pan'
      ? track.pan
      : kind === 'fx' && fx
        ? ((track.fxChain ?? []).find((e) => e.id === fx.entryId)?.params[
            fx.paramKey
          ] ?? range.min)
        : track.volume;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ index: number; pointerId: number } | null>(null);
  const lastPressRef = useRef<{ index: number; at: number } | null>(null);

  const contentEnd = Math.max(
    0,
    ...clips.map((c) => c.startSec + c.durationSec),
    ...(lane?.points.map((p) => p.t) ?? []),
  );
  const width = Math.max(MIN_LANE_WIDTH, (contentEnd + TAIL_SEC) * pxPerSec);
  const span = range.max - range.min || 1;
  const toY = (v: number) =>
    PAD_Y +
    (1 - (clampToRange(v, range) - range.min) / span) *
      (LANE_HEIGHT - 2 * PAD_Y);
  const fromY = (y: number) =>
    clampToRange(
      range.min + (1 - (y - PAD_Y) / (LANE_HEIGHT - 2 * PAD_Y)) * span,
      range,
    );

  const pointerToTv = (e: ReactPointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }
    return {
      t: Math.max(0, (e.clientX - rect.left) / pxPerSec),
      v: fromY(e.clientY - rect.top),
    };
  };

  const clampBetweenNeighbors = (index: number, t: number) => {
    const pts = lane?.points ?? [];
    const lo = index > 0 ? pts[index - 1].t + NEIGHBOR_GAP_SEC : 0;
    const hi =
      index < pts.length - 1 ? pts[index + 1].t - NEIGHBOR_GAP_SEC : Infinity;
    return Math.max(lo, Math.min(hi, t));
  };

  const onBackgroundPointerDown = (e: ReactPointerEvent<SVGRectElement>) => {
    if (!target || e.button !== 0) {
      return;
    }
    const tv = pointerToTv(e);
    if (tv) {
      recordAutomationPoint(target, tv.t, tv.v);
    }
  };

  const onPointPointerDown = (
    e: ReactPointerEvent<SVGCircleElement>,
    index: number,
  ) => {
    if (e.button !== 0) {
      return;
    }
    e.stopPropagation();
    // Detected here rather than with onDoubleClick: the drag's pointer capture
    // retargets click events to the <svg>, so the circle never sees them.
    const last = lastPressRef.current;
    if (
      lane &&
      last?.index === index &&
      e.timeStamp - last.at < DOUBLE_PRESS_MS
    ) {
      lastPressRef.current = null;
      removeAutomationPoint(lane.id, index);
      return;
    }
    lastPressRef.current = { index, at: e.timeStamp };
    dragRef.current = { index, pointerId: e.pointerId };
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || !lane || drag.pointerId !== e.pointerId) {
      return;
    }
    const tv = pointerToTv(e);
    if (tv) {
      updateAutomationPoint(
        lane.id,
        drag.index,
        clampBetweenNeighbors(drag.index, tv.t),
        tv.v,
      );
    }
  };

  const endDrag = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
      try {
        svgRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
  };

  const onPointKeyDown = (e: ReactKeyboardEvent, index: number) => {
    if (!lane) {
      return;
    }
    const p = lane.points[index];
    const vStep = span / 20;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removeAutomationPoint(lane.id, index);
      return;
    }
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, vStep],
      ArrowDown: [0, -vStep],
      ArrowLeft: [-0.1, 0],
      ArrowRight: [0.1, 0],
    };
    const move = moves[e.key];
    if (!move) {
      return;
    }
    e.preventDefault();
    updateAutomationPoint(
      lane.id,
      index,
      clampBetweenNeighbors(index, p.t + move[0]),
      clampToRange(p.v + move[1], range),
    );
  };

  const points = lane?.points ?? [];
  const path = points.length
    ? [
        `M 0 ${toY(points[0].v)}`,
        ...points.map((p) => `L ${p.t * pxPerSec} ${toY(p.v)}`),
        `L ${width} ${toY(points[points.length - 1].v)}`,
      ].join(' ')
    : `M 0 ${toY(staticValue)} L ${width} ${toY(staticValue)}`;

  const options: Array<{ id: LaneView; label: string }> = [
    { id: 'off', label: 'Off' },
    { id: 'volume', label: 'Volume' },
    { id: 'pan', label: 'Pan' },
    ...(fx ? [{ id: 'fx' as const, label: fx.label }] : []),
  ];
  const laneName =
    kind === 'fx' && fx ? fx.label : kind === 'pan' ? 'Pan' : 'Volume';

  return (
    <div className="border-b" data-testid={`automation-${track.id}`}>
      <div className="sticky left-0 flex w-max max-w-full flex-wrap items-center gap-2 px-2 py-1 text-xs">
        <span className="text-foreground-secondary">Automation</span>
        <SegmentedControl<LaneView>
          aria-label={`Automation lane for ${track.name}`}
          options={options}
          value={view === 'fx' && !fx ? 'off' : view}
          onChange={setView}
        />
        {lane ? (
          <>
            <Toggle
              label="Follow lane"
              checked={lane.enabled}
              onChange={() => toggleAutomationLane(lane.id)}
            />
            <Button
              size="xs"
              variant="text"
              onClick={() => removeAutomationLane(lane.id)}
            >
              <Trash2Icon className="size-3.5" aria-hidden />
              Clear lane
            </Button>
          </>
        ) : kind ? (
          <span className="text-foreground-secondary">
            Click the lane to add a point
          </span>
        ) : null}
      </div>
      {kind ? (
        <svg
          ref={svgRef}
          role="group"
          aria-label={`${laneName} automation for ${track.name}. Click to add a point, drag to move, double-click or Delete to remove.`}
          width={width}
          height={LANE_HEIGHT}
          className={cn(
            'bg-surface-secondary/40 block touch-none',
            lane && !lane.enabled && 'opacity-50',
          )}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <rect
            x={0}
            y={0}
            width={width}
            height={LANE_HEIGHT}
            fill="transparent"
            className="cursor-crosshair"
            onPointerDown={onBackgroundPointerDown}
          />
          <path
            d={path}
            fill="none"
            stroke={track.color || 'currentColor'}
            strokeWidth={2}
            strokeDasharray={points.length ? undefined : '4 4'}
            className="pointer-events-none"
          />
          {points.map((p, i) => (
            <circle
              key={`${i}-${p.t}`}
              cx={p.t * pxPerSec}
              cy={toY(p.v)}
              r={POINT_R}
              role="slider"
              tabIndex={0}
              aria-label={`${laneName} point at ${p.t.toFixed(2)}s`}
              aria-valuemin={range.min}
              aria-valuemax={range.max}
              aria-valuenow={p.v}
              aria-valuetext={formatValue(kind, p.v)}
              className="fill-background focus-visible:stroke-primary cursor-grab stroke-2 outline-none"
              stroke={track.color || 'currentColor'}
              onPointerDown={(e) => onPointPointerDown(e, i)}
              onKeyDown={(e) => onPointKeyDown(e, i)}
            >
              <title>{`${p.t.toFixed(2)}s · ${formatValue(kind, p.v)}`}</title>
            </circle>
          ))}
        </svg>
      ) : null}
    </div>
  );
}
