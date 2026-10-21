export type JamParticipant = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'HOST' | 'GUEST';
  canControl: boolean;
  joinedAt: string;
};

export type JamTrack = {
  id: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  /** Null for embed-only tracks (Mixcloud/Hearthis/Spotify) — guests see
   * "now playing" for those but can't auto-play them, same as elsewhere. */
  streamUrl: string | null;
  protocol: 'hls' | 'https' | null;
  channelSlug: string | null;
  durationSec: number | null;
};

export type JamSession = {
  id: string;
  code: string;
  hostUserId: string;
  collectionId: string | null;
  isPlaying: boolean;
  currentTrack: JamTrack | null;
  positionSec: number;
  positionUpdatedAt: string;
  createdAt: string;
  endedAt: string | null;
  participants: JamParticipant[];
};

export type JamEvent =
  { type: 'state'; session: JamSession } | { type: 'ended' };
