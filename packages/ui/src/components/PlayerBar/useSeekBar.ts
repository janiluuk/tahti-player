import {
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

type UseSeekBarParams = {
  progress: number;
  isLoading?: boolean;
  onSeek?: (percent: number) => void;
};

const ARROW_STEP_PERCENT = 2;
const PAGE_STEP_PERCENT = 10;

export const useSeekBar = ({
  progress,
  isLoading = false,
  onSeek,
}: UseSeekBarParams) => {
  const clamped = useMemo(
    () => Math.max(0, Math.min(100, progress)),
    [progress],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const isInteractive = Boolean(onSeek) && !isLoading;

  const [dragPercent, setDragPercent] = useState<number | null>(null);
  const seekedOnPointerUp = useRef(false);

  const percentAt = useCallback((clientX: number) => {
    const target = containerRef.current;
    if (!target) {
      return null;
    }
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) {
      return null;
    }
    const percent = ((clientX - rect.left) / rect.width) * 100;
    return Math.max(0, Math.min(100, percent));
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      setDragPercent(null);
      if (seekedOnPointerUp.current) {
        seekedOnPointerUp.current = false;
        return;
      }
      if (!isInteractive) {
        return;
      }
      const percent = percentAt(e.clientX);
      if (percent !== null) {
        onSeek?.(percent);
      }
    },
    [isInteractive, onSeek, percentAt],
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (!isInteractive || e.button > 0) {
        return;
      }
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDragPercent(percentAt(e.clientX));
    },
    [isInteractive, percentAt],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (dragPercent === null) {
        return;
      }
      setDragPercent(percentAt(e.clientX));
    },
    [dragPercent, percentAt],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (dragPercent === null) {
        return;
      }
      setDragPercent(null);
      const percent = percentAt(e.clientX) ?? dragPercent;
      seekedOnPointerUp.current = true;
      onSeek?.(percent);
    },
    [dragPercent, onSeek, percentAt],
  );

  const handlePointerCancel = useCallback(() => setDragPercent(null), []);

  const shown = dragPercent ?? clamped;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isInteractive) {
        return;
      }
      const deltas: Record<string, number> = {
        ArrowRight: ARROW_STEP_PERCENT,
        ArrowUp: ARROW_STEP_PERCENT,
        ArrowLeft: -ARROW_STEP_PERCENT,
        ArrowDown: -ARROW_STEP_PERCENT,
        PageUp: PAGE_STEP_PERCENT,
        PageDown: -PAGE_STEP_PERCENT,
      };
      const delta = deltas[e.key];
      if (typeof delta === 'number') {
        e.preventDefault();
        onSeek?.(Math.max(0, Math.min(100, clamped + delta)));
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        onSeek?.(0);
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        onSeek?.(100);
      }
    },
    [isInteractive, clamped, onSeek],
  );

  return {
    clamped,
    shown,
    dragging: dragPercent !== null,
    containerRef,
    handleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleKeyDown,
    isInteractive,
  } as const;
};

export type UseSeekBarReturn = ReturnType<typeof useSeekBar>;
