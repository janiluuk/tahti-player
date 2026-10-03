import type { SmartLinkTrack } from '../../api/release-download';
import type { SmartLinkView } from '../../api/smart-link-types';
import type { TahtiPlayable, TrackAccessGate } from '../../api/types';

const EMAIL_PATTERN = /[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}/i;
const USERNAME_PATTERN = /^[a-z0-9_-]{2,32}$/i;

export type SmartLinkCredit = {
  role: string;
  name: string;
  artistUsername: string | null;
};

export type SmartLinkTrackCredits = {
  key: string;
  title: string;
  credits: SmartLinkCredit[];
};

export type SmartLinkLockedTrack = {
  key: string;
  title: string;
  soundId: string | null;
  gate: TrackAccessGate;
};

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function trackKey(releaseId: string, track: SmartLinkTrack): string {
  return track.id ?? `${releaseId}-${track.position}`;
}

function parseCredit(row: unknown): SmartLinkCredit | null {
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

function isGate(value: unknown): value is TrackAccessGate {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const { reason } = value as { reason?: unknown };
  return reason === 'PURCHASE' || reason === 'SUBSCRIBERS_ONLY';
}

function tracksOf(data: SmartLinkView): SmartLinkTrack[] {
  return Array.isArray(data.release.tracks) ? data.release.tracks : [];
}

export function smartLinkPlayables(data: SmartLinkView): TahtiPlayable[] {
  const { release, artist } = data;
  return tracksOf(data).flatMap((track): TahtiPlayable[] => {
    const streamUrl = text(track.audioUrl);
    if (!streamUrl) {
      return [];
    }
    return [
      {
        id: `sound:${track.soundId ?? trackKey(release.id, track)}`,
        kind: 'sound',
        title: track.title,
        artist: artist.displayName,
        coverUrl: release.artworkUrl ?? undefined,
        streamUrl,
        protocol: streamUrl.includes('.m3u8') ? 'hls' : 'https',
        durationSec: track.durationSec ?? null,
        releaseDate: release.releaseDate ?? null,
      },
    ];
  });
}

export function smartLinkLockedTracks(
  data: SmartLinkView,
): SmartLinkLockedTrack[] {
  return tracksOf(data).flatMap((track): SmartLinkLockedTrack[] =>
    !text(track.audioUrl) && isGate(track.gate)
      ? [
          {
            key: trackKey(data.release.id, track),
            title: track.title,
            soundId: track.soundId ?? null,
            gate: track.gate,
          },
        ]
      : [],
  );
}

export function smartLinkTrackCredits(
  data: SmartLinkView,
): SmartLinkTrackCredits[] {
  return tracksOf(data).flatMap((track): SmartLinkTrackCredits[] => {
    const credits = Array.isArray(track.credits)
      ? track.credits
          .map(parseCredit)
          .filter((c): c is SmartLinkCredit => c !== null)
      : [];
    return credits.length > 0
      ? [{ key: trackKey(data.release.id, track), title: track.title, credits }]
      : [];
  });
}
