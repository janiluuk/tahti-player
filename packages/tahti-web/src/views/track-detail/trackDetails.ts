import type { PublicTrackDetail } from '../../api/types';

const EMAIL_PATTERN = /[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}/i;
const USERNAME_PATTERN = /^[a-z0-9_-]{2,32}$/i;

// ALL_RIGHTS_RESERVED is the column default, so it says nothing the artist
// chose and would keep the block visible on every track.
const LICENSE_LABELS: Record<string, string> = {
  CC0: 'No rights reserved (CC0)',
  CC_BY: 'CC BY',
  CC_BY_SA: 'CC BY-SA',
  CC_BY_NC: 'CC BY-NC',
  CC_BY_NC_SA: 'CC BY-NC-SA',
  CC_BY_NC_ND: 'CC BY-NC-ND',
};

export type TrackDetailCredit = {
  role: string;
  name: string;
  artistUsername: string | null;
};

export type TrackDetailFacts = {
  genres: string[];
  bpm: number | null;
  musicalKey: string | null;
  license: string | null;
  credits: TrackDetailCredit[];
  commentary: string | null;
};

type DetailFields = Partial<
  Pick<
    PublicTrackDetail,
    | 'genre'
    | 'subGenres'
    | 'effectiveBpm'
    | 'effectiveKey'
    | 'license'
    | 'credits'
    | 'commentary'
  >
>;

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseCredit(row: unknown): TrackDetailCredit | null {
  if (!row || typeof row !== 'object') {
    return null;
  }
  const { role, name, artistUsername } = row as Record<string, unknown>;
  const username =
    typeof artistUsername === 'string' && USERNAME_PATTERN.test(artistUsername)
      ? artistUsername
      : null;
  const rawName = text(name);
  const safeName = rawName && !EMAIL_PATTERN.test(rawName) ? rawName : username;
  const roleText = text(role);
  if (!safeName || !roleText || EMAIL_PATTERN.test(roleText)) {
    return null;
  }
  return {
    role: roleText.charAt(0).toUpperCase() + roleText.slice(1),
    name: safeName,
    artistUsername: username,
  };
}

export function trackDetailFacts(detail: DetailFields): TrackDetailFacts {
  const genres = [detail.genre, ...(detail.subGenres ?? [])]
    .map(text)
    .filter((genre): genre is string => genre !== null)
    .filter(
      (genre, index, all) =>
        all.findIndex((g) => g.toLowerCase() === genre.toLowerCase()) === index,
    );
  const bpm =
    typeof detail.effectiveBpm === 'number' &&
    Number.isFinite(detail.effectiveBpm) &&
    detail.effectiveBpm > 0
      ? Math.round(detail.effectiveBpm)
      : null;
  const credits = Array.isArray(detail.credits)
    ? detail.credits
        .map(parseCredit)
        .filter((c): c is TrackDetailCredit => c !== null)
    : [];
  return {
    genres,
    bpm,
    musicalKey: text(detail.effectiveKey),
    license: detail.license ? (LICENSE_LABELS[detail.license] ?? null) : null,
    credits,
    commentary: text(detail.commentary),
  };
}

export function hasTrackDetailFacts(facts: TrackDetailFacts): boolean {
  return (
    facts.genres.length > 0 ||
    facts.bpm !== null ||
    facts.musicalKey !== null ||
    facts.license !== null ||
    facts.credits.length > 0 ||
    facts.commentary !== null
  );
}

/** The mix version to show beside the title, without the parentheses an
 * artist may have typed, or null when it is empty or already in the title. */
export function mixVersionLabel(
  title: string,
  mixVersion: string | null | undefined,
): string | null {
  const label = text(mixVersion)
    ?.replace(/^\((.*)\)$/, '$1')
    .trim();
  if (!label || title.toLowerCase().includes(label.toLowerCase())) {
    return null;
  }
  return label;
}
