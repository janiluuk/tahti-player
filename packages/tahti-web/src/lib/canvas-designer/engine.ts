import type { CanvasDesignPreset } from './design-presets';

type Vec2 = { readonly x: number; readonly y: number };

interface TrailFrame {
  pathA: Vec2[];
  pathB: Vec2[];
}

export interface TrailConfig {
  preset: CanvasDesignPreset;
  colors: string[];
  bgColor: string;
  brushSize: number;
  glowIntensity: number;
}

export interface CanvasState {
  trail: TrailFrame[];
  cursorX: number;
  cursorY: number;
  frameCount: number;
  time: number;
}

const MAX_TRAIL_FRAMES = 360;

export function createCanvasState(): CanvasState {
  return {
    trail: [],
    cursorX: 0,
    cursorY: 0,
    frameCount: 0,
    time: 0,
  };
}

/**
 * Advance one parametric curve frame. Called per animation frame while mouse is down.
 */
export function advanceTrail(
  canvas: CanvasState,
  config: TrailConfig,
  mouseX: number,
  mouseY: number,
): void {
  const { preset } = config;
  const time = canvas.time + canvas.frameCount * 0.016;

  // Number of symmetry sectors
  const numAxes = Math.max(2, Math.min(preset.symmetryAxes, 16));
  const angleStep = (Math.PI * 2) / numAxes;

  const halfFrameA: Vec2[] = [];
  const halfFrameB: Vec2[] = [];
  const cx = mouseX;
  const cy = mouseY;
  const normX = cx / Math.max(mouseX, mouseY, 1);

  for (let i = 0; i < numAxes; i++) {
    const baseAngle = i * angleStep + preset.baseAngle;

    for (let j = 0; j < 40; j++) {
      const t = time + j * 0.012;

      // Radial distance from cursor — lissajous-like with parametric noise
      const r =
        Math.min(canvas.cursorX, canvas.cursorY) * 0.15 +
        Math.sin(t * preset.noiseFactor) * 40 +
        Math.cos(t * (preset.noiseFactor - 0.3)) * 25;

      // Angle with spiral component and parametric wobble
      const angle =
        baseAngle +
        t * preset.decayRate * 18 +
        Math.sin(t * 1.7 + i) * 0.4 +
        Math.cos(normX * j * 0.05) * Math.sin(preset.colorShiftSpeed * 20);

      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;

      if (j <= 20) {
        halfFrameA.push({ x: px, y: py });
      } else {
        // Mirror for Weave Silk's signature bilateral symmetry
        halfFrameB.push({ x: cx - (px - cx), y: cy - (py - cy) });
      }
    }
  }

  canvas.trail.push({ pathA: halfFrameA, pathB: halfFrameB });

  while (canvas.trail.length > MAX_TRAIL_FRAMES) {
    canvas.trail.shift();
  }

  canvas.cursorX = Math.max(0, Math.min(canvas.cursorX, mouseX));
  canvas.cursorY = Math.max(0, Math.min(canvas.cursorY, mouseY));
  canvas.frameCount += 1;
  canvas.time = time;
}

/**
 * Render all accumulated trails with additive blending for glow.
 */
export function renderTrail(
  ctx: CanvasRenderingContext2D,
  canvas: CanvasState,
  config: TrailConfig,
): void {
  const { colors, bgColor, brushSize, glowIntensity } = config;

  // Fade overlay — trail persistence (Weave Silk's fade-by-redraw trick)
  if (canvas.trail.length > 3) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = hexToRgba(bgColor, 0.06);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  // Additive blending for glow
  ctx.globalCompositeOperation = 'lighter';

  if (glowIntensity > 0) {
    ctx.shadowBlur = glowIntensity * 6;
  }

  const numAxes = config.preset.symmetryAxes;

  const totalFrames = canvas.trail.length;
  const visibleFrom = Math.max(0, totalFrames - 200);

  for (let fi = visibleFrom; fi < totalFrames; fi++) {
    const frame = canvas.trail[fi];
    if (!frame) {
      continue;
    }

    // Older frames more transparent
    const ageRatio =
      totalFrames > visibleFrom
        ? (fi - visibleFrom) / Math.max(1, totalFrames - visibleFrom)
        : 1;
    const alpha = Math.pow(ageRatio, 0.5) * 0.7;
    ctx.globalAlpha = alpha;

    for (const pathSet of [frame.pathA, frame.pathB]) {
      if (pathSet.length < 2) {
        continue;
      }

      for (let p = 0; p < pathSet.length - 1; p++) {
        const pts = pathSet[p]!;
        const nxt = pathSet[p + 1]!;

        // Color cycling along the trail
        const colorIdx = (fi * 3 + numAxes + Math.floor(p / 4)) % colors.length;
        const strokeColor = colors[Math.abs(colorIdx)];

        ctx.strokeStyle = hexToRgba(strokeColor, alpha * 0.85);

        // Tapering line width (Weave Silk — thin at edges)
        ctx.lineWidth = brushSize * (0.2 + ageRatio * 0.8);

        ctx.beginPath();
        ctx.moveTo(pts.x, pts.y);
        ctx.lineTo(nxt.x, nxt.y);
        ctx.stroke();
      }
    }
  }

  // Reset
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16) || 108;
  const g = parseInt(hex.slice(3, 5), 16) || 92;
  const b = parseInt(hex.slice(5, 7), 16) || 231;
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}
