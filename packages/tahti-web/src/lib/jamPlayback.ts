import type { JamSession, JamTrack, TahtiPlayable } from '../api/types';

/** The host always controls a jam; a guest only once the host has given
 * them control. A participant row without `canControl` reads as no. */
export function canControlJam(
  session: JamSession,
  userId: string | null | undefined,
): boolean {
  if (!userId) {
    return false;
  }
  if (session.hostUserId === userId) {
    return true;
  }
  return session.participants.some(
    (p) => p.userId === userId && p.canControl === true,
  );
}

/** What a listener would notice changing: the track and play/pause.
 * Position is left out - it moves on every tick. */
export function jamStateSignature(
  isPlaying: boolean,
  trackId: string | null,
): string {
  return `${isPlaying}:${trackId ?? ''}`;
}

export function sessionSignature(session: JamSession): string {
  return jamStateSignature(session.isPlaying, session.currentTrack?.id ?? null);
}

export function estimatedPositionSec(
  session: JamSession,
  now: number = Date.now(),
): number {
  if (!session.isPlaying) {
    return session.positionSec;
  }
  const elapsedSec =
    (now - new Date(session.positionUpdatedAt).getTime()) / 1000;
  return session.positionSec + Math.max(0, elapsedSec);
}

/** Keeps the jam track's id as the local queue id, so a device following
 * the jam and the session agree on which track is current - that is how a
 * co-controller's own play/pause is told apart from simply following. */
export function jamPlayable(track: JamTrack, streamUrl: string): TahtiPlayable {
  return {
    id: track.id,
    kind: track.id.startsWith('radio:')
      ? 'radio'
      : track.id.startsWith('live:')
        ? 'live'
        : 'sound',
    title: track.title,
    artist: track.artistName,
    coverUrl: track.coverUrl ?? undefined,
    streamUrl,
    protocol: track.protocol ?? 'https',
    channelSlug: track.channelSlug ?? undefined,
    durationSec: track.durationSec ?? undefined,
  };
}

/** The state update for a "play/pause for everyone" press: flips play/pause
 * on the jam's current track, from where everyone is right now. */
export function toggledJamState(
  session: JamSession,
  now: number = Date.now(),
): { isPlaying: boolean; currentTrack: JamTrack | null; positionSec: number } {
  return {
    isPlaying: !session.isPlaying,
    currentTrack: session.currentTrack,
    positionSec: estimatedPositionSec(session, now),
  };
}
