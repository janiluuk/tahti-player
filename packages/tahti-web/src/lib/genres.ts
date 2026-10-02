/** Preset genre list — mirrors ARCHIVE_GENRES in the main tahti repo
 * (packages/shared/src/dto/archive-metadata.ts), the same set archive
 * items pick from. Genres are stored as a comma-joined string in the
 * profile's socialLinks.genres bag, which the channel directory reads. */
export const PRESET_GENRES = [
  'Electronic',
  'House',
  'Techno',
  'Trance',
  'Drum & Bass',
  'Dubstep',
  'Ambient',
  'Hip-Hop',
  'Pop',
  'Rock',
  'Jazz',
  'Classical',
  'Podcast',
  'Other',
] as const;

export const MAX_GENRES = 5;

export function parseGenreTags(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);
}

export function formatGenreTags(genres: string[]): string {
  return genres.join(', ');
}

/** Capitalizes a genre consistently, word by word (hyphenated segments
 * counted separately, "&" left as-is) -- e.g. "drum & bass" -> "Drum &
 * Bass", "hip-hop" -> "Hip-Hop". Used everywhere a genre is displayed
 * or stored so free-typed and preset genres read the same way. */
export function capitalizeGenre(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) =>
      word
        .split('-')
        .map((part) =>
          part === '' || part === '&'
            ? part
            : part[0]!.toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join('-'),
    )
    .join(' ');
}

/** Maps free-text genre tags onto the picker's preset list where
 * possible (case-insensitively), and capitalizes anything else instead
 * of dropping it -- older data, or a genre a user previously typed in
 * before this normalization existed, still shows up as a removable
 * chip rather than silently vanishing. */
export function normalizeGenresForPicker(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of raw) {
    const trimmed = tag.trim();
    if (!trimmed) {
      continue;
    }
    const preset = PRESET_GENRES.find(
      (g) => g.toLowerCase() === trimmed.toLowerCase(),
    );
    const value = preset ?? capitalizeGenre(trimmed);
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
    if (out.length >= MAX_GENRES) {
      break;
    }
  }
  return out;
}
