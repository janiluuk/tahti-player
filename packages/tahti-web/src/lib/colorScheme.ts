/**
 * Normalize channel/artist color schemes from API (`bg`/`text`) or legacy
 * public DTOs (`background`/`foreground`) into one shape for UI/visualizers.
 */
export type NormalizedColorScheme = {
  accent: string;
  highlight: string;
  bg: string;
  text: string;
  muted: string;
  /** Aliases for older call sites. */
  background: string;
  foreground: string;
};

const FALLBACK: NormalizedColorScheme = {
  accent: '#22D3EE',
  highlight: '#A78BFA',
  bg: '#0B1220',
  text: '#F8FAFC',
  muted: '#64748B',
  background: '#0B1220',
  foreground: '#F8FAFC',
};

export type LooseColorScheme =
  | {
      accent?: string | null;
      highlight?: string | null;
      bg?: string | null;
      text?: string | null;
      muted?: string | null;
      background?: string | null;
      foreground?: string | null;
    }
  | null
  | undefined;

/** Relative luminance of a `#rrggbb` hex color, or `null` if unparseable. */
function luminance(hex: string): number | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return null;
  }
  const value = match[1];
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * A custom `bg` with no matching `text` override would otherwise fall back
 * to FALLBACK.text (white) regardless of how light the custom bg is,
 * producing invisible text on a light background — pick based on the
 * actual bg's luminance instead.
 */
export function contrastingText(bg: string): string {
  const l = luminance(bg);
  if (l === null) {
    return FALLBACK.text;
  }
  return l > 0.6 ? FALLBACK.bg : FALLBACK.text;
}

export function normalizeColorScheme(
  scheme: LooseColorScheme,
): NormalizedColorScheme {
  if (!scheme) {
    return { ...FALLBACK };
  }
  const customBg = scheme.bg ?? scheme.background ?? null;
  const bg = customBg ?? FALLBACK.bg;
  const text =
    scheme.text ??
    scheme.foreground ??
    (customBg ? contrastingText(customBg) : FALLBACK.text);
  const accent = scheme.accent ?? FALLBACK.accent;
  const highlight = scheme.highlight ?? FALLBACK.highlight;
  const muted = scheme.muted ?? FALLBACK.muted;
  return {
    accent,
    highlight,
    bg,
    text,
    muted,
    background: bg,
    foreground: text,
  };
}

/** CSS variables for painting channel-branded chrome (header card, sections). */
export function colorSchemeCssVars(
  scheme: LooseColorScheme,
): Record<string, string> {
  const n = normalizeColorScheme(scheme);
  return {
    '--channel-bg': n.bg,
    '--channel-text': n.text,
    '--channel-accent': n.accent,
    '--channel-highlight': n.highlight,
    '--channel-muted': n.muted,
  };
}

function relativeLuminance(hex: string): number | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return null;
  }
  const [r, g, b] = [0, 2, 4].map((offset) => {
    const channel = parseInt(match[1].slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number | null {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) {
    return null;
  }
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** The scheme's muted color when small text in it stays readable on its background (WCAG AA, 4.5:1); otherwise its text color. */
export function readableMuted(scheme: NormalizedColorScheme): string {
  const ratio = contrastRatio(scheme.muted, scheme.bg);
  return ratio === null || ratio >= 4.5 ? scheme.muted : scheme.text;
}
