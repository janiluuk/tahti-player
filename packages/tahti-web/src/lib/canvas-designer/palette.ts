export const COLOR_PALETTES: Palette[] = [
  {
    id: 'aurora',
    label: 'Aurora',
    colors: ['#6C5CE7', '#00CEC9', '#FD79A8', '#FDCB6E', '#00B894'],
  },
  {
    id: 'coral',
    label: 'Coral Reef',
    colors: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#A29BFE', '#2D3436'],
  },
  {
    id: 'deep',
    label: 'Deep Space',
    colors: ['#0F0C29', '#302B63', '#24243E', '#E8B4F3', '#FF6B6B'],
  },
  {
    id: 'amber',
    label: 'Amber Glow',
    colors: ['#FF6348', '#FF9F43', '#FECA57', '#FF6B6B', '#C8D6E5'],
  },
  {
    id: 'violet',
    label: 'Violet Dreams',
    colors: ['#6F1E51', '#AB83A1', '#E1B1C7', '#F19066', '#FDCAE3'],
  },
];

export interface Palette {
  readonly id: string;
  readonly label: string;
  readonly colors: Readonly<string[]>;
}

/** Find palette colors by ID string. */
export function getPaletteColors(paletteId: string): string[] {
  const pal = COLOR_PALETTES.find((p) => p.id === paletteId);
  return pal ? [...pal.colors] : [...COLOR_PALETTES[0]!.colors];
}

/** Default preset id used when none is specified. */
export const DEFAULT_PRESET_ID = 'weave-silk';

/** Background color presets for the canvas. */
export const BACKGROUND_COLORS: ReadonlyArray<{
  readonly id: string;
  readonly hex: string;
}> = [
  { id: 'dark', hex: '#1a1030' },
  { id: 'midnight', hex: '#0B0B1A' },
  { id: 'black', hex: '#000000' },
  { id: 'cream', hex: '#FDF3E7' },
  { id: 'white', hex: '#FFFFFF' },
];

/** Default background when user hasn't changed it. */
export const DEFAULT_BG = BACKGROUND_COLORS[0]!.hex;
