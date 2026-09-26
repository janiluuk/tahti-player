/** Generated cover art for tracks/artists/channels that haven't uploaded
 * their own — one of a fixed set of abstract gradient "blob" covers, picked
 * deterministically by hashing an id so the same item always gets the same
 * placeholder rather than a different one on every render. */

const PALETTES: Array<{ from: string; to: string }> = [
  { from: '#22D3EE', to: '#A78BFA' },
  { from: '#FB7185', to: '#FBBF24' },
  { from: '#34D399', to: '#64748B' },
  { from: '#60A5FA', to: '#FBBF24' },
  { from: '#A78BFA', to: '#22D3EE' },
  { from: '#FBBF24', to: '#FB7185' },
  { from: '#34D399', to: '#A78BFA' },
  { from: '#A78BFA', to: '#FB7185' },
  { from: '#22D3EE', to: '#34D399' },
  { from: '#FB7185', to: '#A78BFA' },
];

export const PLACEHOLDER_ARTWORK_COUNT = PALETTES.length;

function blobsForIndex(
  index: number,
): Array<{ cx: number; cy: number; r: number }> {
  const count = 3 + (index % 3);
  return Array.from({ length: count }, (_, b) => {
    const angle = ((b * 137.508 + index * 41) * Math.PI) / 180;
    const dist = 18 + ((index * 11 + b * 17) % 26);
    return {
      cx: 50 + Math.cos(angle) * dist,
      cy: 50 + Math.sin(angle) * dist,
      r: 16 + ((index * 7 + b * 13) % 22),
    };
  });
}

function svgForIndex(index: number): string {
  const { from, to } = PALETTES[index % PALETTES.length]!;
  const circles = blobsForIndex(index)
    .map(
      (b, j) =>
        `<circle cx="${b.cx.toFixed(1)}" cy="${b.cy.toFixed(1)}" r="${b.r.toFixed(1)}" fill="#fff" opacity="${(0.07 + (j % 3) * 0.05).toFixed(2)}" />`,
    )
    .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">` +
    `<stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="100" height="100" fill="url(#g)"/>${circles}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const cache = new Map<number, string>();
export const GENERATED_ARTWORK_COUNT = 16;

function seedToIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  }
  return hash % PLACEHOLDER_ARTWORK_COUNT;
}

/** Deterministic placeholder cover URL for an item with no real artwork —
 * pass a stable id (track id, channel slug, username) as `seed`. */
export function placeholderArtworkUrl(seed: string): string {
  return cachedSvg(seedToIndex(seed));
}

export function isPlaceholderArtworkUrl(url: string): boolean {
  if (!url.startsWith('data:image/svg+xml,')) {
    return false;
  }
  for (let index = 0; index < PLACEHOLDER_ARTWORK_COUNT; index++) {
    if (cachedSvg(index) === url) {
      return true;
    }
  }
  return false;
}

function cachedSvg(index: number): string {
  let svg = cache.get(index);
  if (!svg) {
    svg = svgForIndex(index);
    cache.set(index, svg);
  }
  return svg;
}

export function generatedArtworkUrl(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000;
  }
  const preset = (hash % GENERATED_ARTWORK_COUNT) + 1;
  const fallback = `/artwork-presets/artwork-${String(preset).padStart(2, '0')}.webp`;
  if (typeof window === 'undefined') {
    return fallback;
  }
  const stored = window.localStorage.getItem('tahti-admin-artwork-presets');
  if (!stored) {
    return fallback;
  }
  try {
    const overrides: unknown = JSON.parse(stored);
    return Array.isArray(overrides) && typeof overrides[preset - 1] === 'string'
      ? overrides[preset - 1]
      : fallback;
  } catch {
    return fallback;
  }
}
