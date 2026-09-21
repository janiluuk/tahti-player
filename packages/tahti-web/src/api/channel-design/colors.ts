export const BRAND_ACCENTS = [
  {
    id: 'aurora',
    label: 'Aurora',
    accent: '#22D3EE',
    highlight: '#A78BFA',
    gradient: 'linear-gradient(135deg,#A78BFA,#22D3EE,#3FE07A)',
  },
  {
    id: 'ember',
    label: 'Ember',
    accent: '#F97316',
    highlight: '#FBBF24',
    gradient: 'linear-gradient(135deg,#F97316,#FBBF24,#EF4444)',
  },
  {
    id: 'noir',
    label: 'Noir',
    accent: '#94A3B8',
    highlight: '#E2E8F0',
    gradient: 'linear-gradient(135deg,#0F172A,#334155,#94A3B8)',
  },
  {
    id: 'violet',
    label: 'Violet',
    accent: '#A855F7',
    highlight: '#EC4899',
    gradient: 'linear-gradient(135deg,#7C3AED,#A855F7,#EC4899)',
  },
  {
    id: 'tahti',
    label: 'Tahti',
    accent: '#FFB020',
    highlight: '#35D6C4',
    gradient: 'linear-gradient(135deg,#0A0E1A,#FFB020,#35D6C4)',
  },
  {
    id: 'rose-night',
    label: 'Rose night',
    accent: '#FB7185',
    highlight: '#F0ABFC',
    gradient: 'linear-gradient(135deg,#4C1D4F,#FB7185,#F0ABFC)',
  },
] as const;

/** Keys must match the backend's ColorSchemeSchema exactly (bg/accent/text/
 * muted/highlight, all 6-digit hex) -- when a colorScheme is included in a
 * PATCH at all, every key is required, so callers must fill defaults for
 * anything the user hasn't touched before sending (see save() below). */
export type ColorScheme = {
  accent?: string;
  highlight?: string;
  bg?: string;
  text?: string;
  muted?: string;
};

/** Accepts legacy `background`/`foreground` from older presets/mocks. */
export type LooseColorSchemeInput = ColorScheme & {
  background?: string;
  foreground?: string;
};

export const DEFAULT_COLOR_SCHEME: Required<ColorScheme> = {
  accent: '#22D3EE',
  highlight: '#A78BFA',
  bg: '#0B1220',
  text: '#F8FAFC',
  muted: '#64748B',
};

/** Fills every key with a default so the object always satisfies the
 * backend's all-required ColorSchemeSchema before it's sent in a PATCH.
 * Accepts legacy `background`/`foreground` aliases from older presets. */
export function fillColorScheme(
  scheme: LooseColorSchemeInput,
): Required<ColorScheme> {
  return {
    accent: scheme.accent ?? DEFAULT_COLOR_SCHEME.accent,
    highlight: scheme.highlight ?? DEFAULT_COLOR_SCHEME.highlight,
    bg: scheme.bg ?? scheme.background ?? DEFAULT_COLOR_SCHEME.bg,
    text: scheme.text ?? scheme.foreground ?? DEFAULT_COLOR_SCHEME.text,
    muted: scheme.muted ?? DEFAULT_COLOR_SCHEME.muted,
  };
}

export function parseColorScheme(json: string | null | undefined): ColorScheme {
  if (!json) {
    return { ...DEFAULT_COLOR_SCHEME };
  }
  try {
    return JSON.parse(json) as ColorScheme;
  } catch {
    return { ...DEFAULT_COLOR_SCHEME };
  }
}
