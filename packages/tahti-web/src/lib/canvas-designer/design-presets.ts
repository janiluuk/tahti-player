export type CanvasDesignPreset = {
  id: string;
  label: string;
  description: string;
  symmetryAxes: number;
  trailLength: number;
  baseAngle: number;
  decayRate: number;
  noiseFactor: number;
  colorShiftSpeed: number;
  maxStrokeWidth: number;
};

export const DESIGN_PRESETS: CanvasDesignPreset[] = [
  {
    id: 'weave-silk',
    label: 'Weave Silk',
    description:
      'Symmetrical flower-of-life fractal tracers with glowing trails',
    symmetryAxes: 8,
    trailLength: 0.975,
    baseAngle: 0.35,
    decayRate: 0.002,
    noiseFactor: 1.6,
    colorShiftSpeed: 0.008,
    maxStrokeWidth: 4,
  },
  {
    id: 'kaleidoscope',
    label: 'Kaleidoscope',
    description: 'Sharp mirrored geometry with crisp lines and vivid colors',
    symmetryAxes: 6,
    trailLength: 0.985,
    baseAngle: 0.25,
    decayRate: 0.004,
    noiseFactor: 1.0,
    colorShiftSpeed: 0.015,
    maxStrokeWidth: 3,
  },
  {
    id: 'mandala',
    label: 'Mandala',
    description: 'Soft concentric circles blooming from center point',
    symmetryAxes: 12,
    trailLength: 0.98,
    baseAngle: 0.5,
    decayRate: 0.003,
    noiseFactor: 0.8,
    colorShiftSpeed: 0.005,
    maxStrokeWidth: 2.5,
  },
  {
    id: 'spirograph',
    label: 'Spirograph',
    description: 'Geometric gear-based curves with mathematical precision',
    symmetryAxes: 4,
    trailLength: 0.96,
    baseAngle: 0.15,
    decayRate: 0.006,
    noiseFactor: 2.0,
    colorShiftSpeed: 0.012,
    maxStrokeWidth: 2,
  },
  {
    id: 'nebula',
    label: 'Nebula',
    description:
      'Ethereal cloud-like swirls with heavy bloom and soft diffusion',
    symmetryAxes: 5,
    trailLength: 0.99,
    baseAngle: 0.42,
    decayRate: 0.001,
    noiseFactor: 2.5,
    colorShiftSpeed: 0.003,
    maxStrokeWidth: 6,
  },
];

export function getDesignPreset(id: string): CanvasDesignPreset {
  return DESIGN_PRESETS.find((p) => p.id === id) ?? DESIGN_PRESETS[0]!;
}
