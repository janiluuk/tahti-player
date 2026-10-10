import {
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { cn } from '@tahti-player/ui';

import {
  addNote,
  deleteNote,
  floorBeat,
  isBlackKey,
  MIN_NOTE_BEATS,
  moveNote,
  pitchName,
  resizeNote,
  snapBeat,
  type PianoNote,
} from './noteEditing';

export type PianoRollProps = {
  notes: readonly PianoNote[];
  onChange: (notes: PianoNote[]) => void;
  /** First source beat shown; a split clip's window starts past zero. */
  fromBeat?: number;
  lengthBeats: number;
  gridBeats: number;
  lowPitch?: number;
  highPitch?: number;
  pxPerBeat?: number;
  rowHeight?: number;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  className?: string;
};

type Drag = {
  id: string;
  mode: 'move' | 'resize';
  x0: number;
  y0: number;
  start0: number;
  pitch0: number;
  duration0: number;
};

const KEYS_WIDTH = 44;
const RESIZE_HANDLE_PX = 6;

export function PianoRoll({
  notes,
  onChange,
  fromBeat = 0,
  lengthBeats,
  gridBeats,
  lowPitch = 48,
  highPitch = 84,
  pxPerBeat = 48,
  rowHeight = 12,
  selectedId = null,
  onSelect,
  className,
}: PianoRollProps) {
  const dragRef = useRef<Drag | null>(null);
  const pitches: number[] = [];
  for (let p = highPitch; p >= lowPitch; p -= 1) {
    pitches.push(p);
  }
  const width = lengthBeats * pxPerBeat;
  const height = pitches.length * rowHeight;
  const step = gridBeats > 0 ? gridBeats : MIN_NOTE_BEATS;
  const toBeat = fromBeat + lengthBeats;

  const onGridPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const localBeat = (e.clientX - rect.left) / pxPerBeat;
    const row = Math.floor((e.clientY - rect.top) / rowHeight);
    const pitch = highPitch - row;
    if (pitch < lowPitch || localBeat < 0 || localBeat >= lengthBeats) {
      return;
    }
    const next = addNote(notes, {
      pitch,
      start: fromBeat + floorBeat(localBeat, gridBeats),
      duration: step,
    });
    onChange(next);
    const added = next.find((n) => !notes.some((o) => o.id === n.id));
    onSelect?.(added?.id ?? null);
  };

  const onNotePointerDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    note: PianoNote,
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onSelect?.(note.id);
    const onHandle =
      e.target instanceof HTMLElement && e.target.dataset.resize === 'true';
    dragRef.current = {
      id: note.id,
      mode: onHandle ? 'resize' : 'move',
      x0: e.clientX,
      y0: e.clientY,
      start0: note.start,
      pitch0: note.pitch,
      duration0: note.duration,
    };
  };

  const onNotePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    const dBeats = (e.clientX - drag.x0) / pxPerBeat;
    if (drag.mode === 'resize') {
      const duration = Math.max(
        step,
        snapBeat(drag.duration0 + dBeats, gridBeats),
      );
      onChange(resizeNote(notes, drag.id, duration));
      return;
    }
    const dRows = Math.round((e.clientY - drag.y0) / rowHeight);
    const start = Math.min(
      toBeat - step,
      Math.max(fromBeat, snapBeat(drag.start0 + dBeats, gridBeats)),
    );
    const pitch = Math.min(highPitch, Math.max(lowPitch, drag.pitch0 - dRows));
    onChange(moveNote(notes, drag.id, { start, pitch }));
  };

  const onNotePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) {
      return;
    }
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      /* already released */
    }
    dragRef.current = null;
  };

  const onNoteKeyDown = (
    e: ReactKeyboardEvent<HTMLDivElement>,
    note: PianoNote,
  ) => {
    let next: PianoNote[];
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        next = deleteNote(notes, note.id);
        onSelect?.(null);
        break;
      case 'ArrowUp':
      case 'ArrowDown': {
        const dir = e.key === 'ArrowUp' ? 1 : -1;
        const pitch = note.pitch + dir * (e.shiftKey ? 12 : 1);
        next = moveNote(notes, note.id, {
          pitch: Math.min(highPitch, Math.max(lowPitch, pitch)),
        });
        break;
      }
      case 'ArrowLeft':
      case 'ArrowRight': {
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        next = e.shiftKey
          ? resizeNote(
              notes,
              note.id,
              Math.max(step, note.duration + dir * step),
            )
          : moveNote(notes, note.id, {
              start: Math.min(
                toBeat - step,
                Math.max(fromBeat, note.start + dir * step),
              ),
            });
        break;
      }
      default:
        return;
    }
    e.preventDefault();
    onChange(next);
  };

  return (
    <div
      className={cn(
        'border-border bg-background flex overflow-auto rounded-lg border',
        className,
      )}
    >
      <div
        className="border-border bg-background-secondary sticky left-0 z-10 shrink-0 border-r"
        style={{ width: KEYS_WIDTH, height }}
        aria-hidden
      >
        {pitches.map((p) => (
          <div
            key={p}
            className={cn(
              'border-border/40 text-foreground-secondary flex items-center justify-end border-b pr-1 font-mono text-[9px]',
              isBlackKey(p) && 'bg-foreground/15',
            )}
            style={{ height: rowHeight }}
          >
            {p % 12 === 0 ? pitchName(p) : null}
          </div>
        ))}
      </div>
      <div
        role="grid"
        aria-label={`Piano roll, ${lengthBeats} beats. Click an empty cell to add a note.`}
        className="relative shrink-0 cursor-crosshair"
        style={{
          width,
          height,
          backgroundImage: [
            `repeating-linear-gradient(to right, var(--color-border) 0 1px, transparent 1px ${pxPerBeat * 4}px)`,
            `repeating-linear-gradient(to right, color-mix(in srgb, var(--color-border) 45%, transparent) 0 1px, transparent 1px ${pxPerBeat}px)`,
            `repeating-linear-gradient(to bottom, color-mix(in srgb, var(--color-border) 35%, transparent) 0 1px, transparent 1px ${rowHeight}px)`,
          ].join(','),
        }}
        onPointerDown={onGridPointerDown}
      >
        {notes.map((note) => {
          if (
            note.pitch < lowPitch ||
            note.pitch > highPitch ||
            note.start + note.duration <= fromBeat ||
            note.start >= toBeat
          ) {
            return null;
          }
          const selected = note.id === selectedId;
          return (
            <div
              key={note.id}
              role="gridcell"
              tabIndex={0}
              aria-selected={selected}
              aria-label={`${pitchName(note.pitch)} at beat ${+(note.start - fromBeat + 1).toFixed(3)}, ${+note.duration.toFixed(3)} beats`}
              className={cn(
                'bg-primary absolute cursor-grab rounded-[3px] border active:cursor-grabbing',
                selected
                  ? 'border-foreground ring-primary/50 ring-2'
                  : 'border-primary/60',
              )}
              style={{
                left: (note.start - fromBeat) * pxPerBeat,
                top: (highPitch - note.pitch) * rowHeight + 1,
                width: Math.max(4, note.duration * pxPerBeat - 1),
                height: rowHeight - 2,
                opacity: 0.45 + (note.velocity / 127) * 0.55,
              }}
              onPointerDown={(e) => onNotePointerDown(e, note)}
              onPointerMove={onNotePointerMove}
              onPointerUp={onNotePointerUp}
              onDoubleClick={() => {
                onChange(deleteNote(notes, note.id));
                onSelect?.(null);
              }}
              onFocus={() => onSelect?.(note.id)}
              onKeyDown={(e) => onNoteKeyDown(e, note)}
            >
              <span
                aria-hidden
                data-resize="true"
                className="hover:bg-foreground/40 border-foreground/40 absolute top-0 right-0 bottom-0 cursor-ew-resize border-r-2"
                style={{ width: RESIZE_HANDLE_PX }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
