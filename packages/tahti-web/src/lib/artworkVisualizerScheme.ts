export type Rgb = [number, number, number];

type AccentScheme = { accent: string; highlight: string };

/** Below this HSL saturation the artwork reads as grey, and a grey accent
 * looks worse than the channel's own colours. */
const GREYSCALE_SATURATION = 0.1;
const MIN_ACCENT_SATURATION = 0.55;
const ACCENT_LIGHTNESS_MIN = 0.5;
const ACCENT_LIGHTNESS_MAX = 0.65;
const HIGHLIGHT_HUE_SHIFT_DEGREES = 40;
const HIGHLIGHT_LIGHTNESS = 0.72;
const FULL_TURN_DEGREES = 360;
const CHANNEL_MAX = 255;

type Hsl = { hue: number; saturation: number; lightness: number };

function rgbToHsl([red, green, blue]: Rgb): Hsl {
  const r = red / CHANNEL_MAX;
  const g = green / CHANNEL_MAX;
  const b = blue / CHANNEL_MAX;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let sector: number;
  if (max === r) {
    sector = ((g - b) / delta) % 6;
  } else if (max === g) {
    sector = (b - r) / delta + 2;
  } else {
    sector = (r - g) / delta + 4;
  }
  const hue = (sector * 60 + FULL_TURN_DEGREES) % FULL_TURN_DEGREES;
  return { hue, saturation, lightness };
}

function hslToHex({ hue, saturation, lightness }: Hsl): string {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = hue / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const [r, g, b] =
    sector < 1
      ? [chroma, second, 0]
      : sector < 2
        ? [second, chroma, 0]
        : sector < 3
          ? [0, chroma, second]
          : sector < 4
            ? [0, second, chroma]
            : sector < 5
              ? [second, 0, chroma]
              : [chroma, 0, second];
  const offset = lightness - chroma / 2;
  const toHex = (channel: number) =>
    Math.round((channel + offset) * CHANNEL_MAX)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Accent and highlight from the artwork's average colour, brightened and
 * saturated enough to glow on a dark scene; the rest of the scheme (and
 * everything for missing or grey artwork) stays the channel's. */
export function artworkVisualizerScheme<Scheme extends AccentScheme>(
  scheme: Scheme,
  artworkRgb: Rgb | null,
): Scheme {
  if (!artworkRgb) {
    return scheme;
  }
  const { hue, saturation, lightness } = rgbToHsl(artworkRgb);
  if (saturation < GREYSCALE_SATURATION) {
    return scheme;
  }
  const accentSaturation = Math.max(saturation, MIN_ACCENT_SATURATION);
  return {
    ...scheme,
    accent: hslToHex({
      hue,
      saturation: accentSaturation,
      lightness: clamp(lightness, ACCENT_LIGHTNESS_MIN, ACCENT_LIGHTNESS_MAX),
    }),
    highlight: hslToHex({
      hue: (hue + HIGHLIGHT_HUE_SHIFT_DEGREES) % FULL_TURN_DEGREES,
      saturation: accentSaturation,
      lightness: HIGHLIGHT_LIGHTNESS,
    }),
  };
}
