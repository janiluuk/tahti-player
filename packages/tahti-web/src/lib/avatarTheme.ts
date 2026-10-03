import { placeholderArtworkUrl } from './placeholderArt';

/** Solid fill or gradient drawn in place of a missing avatar image. Mirrors
 * `AvatarThemeSchema` in `../tahti-org` `@tahti/shared`. */
export type AvatarTheme = {
  kind: 'solid' | 'gradient';
  colors: string[];
  angle?: number;
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Same curated list as `AVATAR_THEME_PRESETS` in `@tahti/shared`. */
export const AVATAR_THEME_PRESETS: readonly AvatarTheme[] = [
  { kind: 'gradient', colors: ['#A78BFA', '#22D3EE'], angle: 135 },
  { kind: 'gradient', colors: ['#F87171', '#FFB840'], angle: 135 },
  { kind: 'gradient', colors: ['#5B6BC4', '#22D3EE'], angle: 135 },
  { kind: 'gradient', colors: ['#8B5CF6', '#6366F1'], angle: 135 },
  { kind: 'gradient', colors: ['#3FE07A', '#22D3EE'], angle: 135 },
  { kind: 'gradient', colors: ['#F472B6', '#8B5CF6'], angle: 135 },
  { kind: 'gradient', colors: ['#0EA5E9', '#6366F1'], angle: 145 },
  { kind: 'gradient', colors: ['#F59E0B', '#EF4444'], angle: 135 },
  { kind: 'gradient', colors: ['#14B8A6', '#3B82F6'], angle: 120 },
  { kind: 'gradient', colors: ['#A855F7', '#EC4899'], angle: 135 },
  { kind: 'gradient', colors: ['#22D3EE', '#3FE07A', '#A78BFA'], angle: 135 },
  { kind: 'solid', colors: ['#22D3EE'] },
  { kind: 'solid', colors: ['#A78BFA'] },
  { kind: 'solid', colors: ['#3FE07A'] },
  { kind: 'solid', colors: ['#F87171'] },
  { kind: 'solid', colors: ['#FFB840'] },
  { kind: 'solid', colors: ['#5B6BC4'] },
  { kind: 'solid', colors: ['#F472B6'] },
];

/** The theme from an API payload, or null when it is missing or malformed. */
export function readAvatarTheme(raw: unknown): AvatarTheme | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const { kind, colors, angle } = raw as Record<string, unknown>;
  if (kind !== 'solid' && kind !== 'gradient') {
    return null;
  }
  if (
    !Array.isArray(colors) ||
    colors.length < 1 ||
    colors.length > 3 ||
    !colors.every((color) => typeof color === 'string' && HEX_COLOR.test(color))
  ) {
    return null;
  }
  if (
    angle !== undefined &&
    (typeof angle !== 'number' || angle < 0 || angle > 360)
  ) {
    return null;
  }
  return angle === undefined ? { kind, colors } : { kind, colors, angle };
}

/** CSS `background` value, matching `avatarThemeCss` in `@tahti/shared`. */
export function avatarThemeCss(theme: AvatarTheme): string {
  if (theme.kind === 'solid' || theme.colors.length === 1) {
    return theme.colors[0]!;
  }
  return `linear-gradient(${theme.angle ?? 135}deg, ${theme.colors.join(', ')})`;
}

export function sameAvatarTheme(
  left: AvatarTheme | null | undefined,
  right: AvatarTheme | null | undefined,
): boolean {
  if (!left || !right) {
    return !left && !right;
  }
  return avatarThemeCss(left) === avatarThemeCss(right);
}

/** Fill for an artist avatar without an image, or null to keep the
 * generated placeholder artwork. */
export function avatarThemeFallback(raw: unknown): string | null {
  const theme = readAvatarTheme(raw);
  return theme ? avatarThemeCss(theme) : null;
}

/** Header avatar for an artist: their picture, else their avatar theme,
 * else the generated placeholder artwork. */
export function artistHeroImage(artist: {
  username: string;
  avatarUrl: string | null;
  avatarTheme?: unknown;
}): { imageUrl: string | null; imageFallback: string | null } {
  if (artist.avatarUrl) {
    return { imageUrl: artist.avatarUrl, imageFallback: null };
  }
  const fallback = avatarThemeFallback(artist.avatarTheme);
  return fallback
    ? { imageUrl: null, imageFallback: fallback }
    : { imageUrl: placeholderArtworkUrl(artist.username), imageFallback: null };
}
