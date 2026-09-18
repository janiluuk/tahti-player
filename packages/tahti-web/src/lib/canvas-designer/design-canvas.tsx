import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import type { CanvasDesignPreset } from './design-presets';
import {
  advanceTrail,
  createCanvasState,
  renderTrail,
  type TrailConfig,
} from './engine';

type Props = {
  preset: CanvasDesignPreset;
  colors: string[];
  bgColor: string;
  brushSize: number;
  glowIntensity: number;
};

export type DesignCanvasHandle = {
  /** Renders the current drawing to a 3000x3000 PNG data URL (album art size). */
  exportPng: () => string | null;
};

function trailConfig(
  preset: CanvasDesignPreset,
  colors: string[],
  bgColor: string,
  brushSize: number,
  glowIntensity: number,
): TrailConfig {
  return { preset, colors, bgColor, brushSize, glowIntensity };
}

export const DesignCanvas = forwardRef<DesignCanvasHandle, Props>(
  function DesignCanvas(
    { preset, colors, bgColor, brushSize, glowIntensity },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef(createCanvasState());
    const rafRef = useRef<number>(0);
    const configRef = useRef(
      trailConfig(preset, colors, bgColor, brushSize, glowIntensity),
    );
    const bgRef = useRef(bgColor);

    // Keep config ref in sync with props
    useEffect(() => {
      configRef.current = trailConfig(
        preset,
        colors,
        bgColor,
        brushSize,
        glowIntensity,
      );
    }, [preset, colors, bgColor, brushSize, glowIntensity]);

    /** Resize canvas to CSS dimensions at proper DPR. */
    const ensureSize = useCallback((canvas: HTMLCanvasElement) => {
      const dpr = window.devicePixelRatio ?? 1;
      const w = Math.floor(canvas.clientWidth);
      const h = Math.floor(canvas.clientHeight);
      if (w === 0 || h === 0) {
        return false;
      }
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        // Background changed: fill with bg color on resize
        const ctxF = canvas.getContext('2d');
        if (ctxF && bgRef.current !== configRef.current.bgColor) {
          ctxF.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctxF.fillStyle = configRef.current.bgColor;
          ctxF.fillRect(0, 0, w, h);
          stateRef.current.trail.length = 0;
          bgRef.current = configRef.current.bgColor;
        }
      }
      return true;
    }, []);

    /** Get normalized pointer position inside canvas coordinates. */
    const getPointerPos = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        const el = canvasRef.current;
        if (!el) {
          return null;
        }
        const rect = el.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
      },
      [],
    );

    /** Pointer down — first interaction seeds the trail at the cursor. */
    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        const pos = getPointerPos(e);
        if (!pos || !canvasRef.current) {
          return;
        }

        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);

        const s = stateRef.current;
        s.cursorX = pos.x;
        s.cursorY = pos.y;

        // Seed initial trail frames at current position so drawing starts immediately
        for (let i = 0; i < 80; i++) {
          advanceTrail(s, configRef.current, pos.x, pos.y);
        }
      },
      [getPointerPos],
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        const pos = getPointerPos(e);
        if (!pos) {
          return;
        }
        advanceTrail(stateRef.current, configRef.current, pos.x, pos.y);
      },
      [getPointerPos],
    );

    /** Main render loop. Redraws trails every frame even when not drawing. */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      ensureSize(canvas);
      const dpr = window.devicePixelRatio ?? 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = bgRef.current;
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      function loop() {
        if (!canvasRef.current) {
          return;
        }
        ensureSize(canvasRef.current);
        renderTrail(ctx!, stateRef.current, configRef.current);
        rafRef.current = requestAnimationFrame(loop);
      }

      rafRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafRef.current);
    }, [ensureSize]);

    useImperativeHandle(
      ref,
      () => ({
        exportPng: () => {
          const mainCvs = canvasRef.current;
          if (!mainCvs) {
            return null;
          }

          const exportCanvas = document.createElement('canvas');
          exportCanvas.width = 3000;
          exportCanvas.height = 3000;
          const ectx = exportCanvas.getContext('2d');
          if (!ectx) {
            return null;
          }

          ectx.fillStyle = bgRef.current;
          ectx.fillRect(0, 0, 3000, 3000);

          // Cover-fit: scale so the shorter source dimension fills 3000,
          // centering (and cropping) the longer one.
          const scale =
            3000 / Math.min(mainCvs.clientWidth, mainCvs.clientHeight || 1);
          const drawW = mainCvs.clientWidth * scale;
          const drawH = mainCvs.clientHeight * scale;
          const offsetX = (3000 - drawW) / 2;
          const offsetY = (3000 - drawH) / 2;

          ectx.drawImage(mainCvs, offsetX, offsetY, drawW, drawH);
          return exportCanvas.toDataURL('image/png');
        },
      }),
      [],
    );

    return (
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      />
    );
  },
);
