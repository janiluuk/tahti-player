export type ChannelNowPlaying = {
  title: string;
  artistName: string;
  artistUsername: string | null;
  artworkUrl: string | null;
  /** Null when the track's length is unknown, e.g. an embed. Optional
   * because older API deploys omit it. */
  durationSec?: number | null;
  /** ISO time the track started; elapsed = now - startedAt. */
  startedAt?: string;
};

/** Curated-rotation channels only: the track after `nowPlaying`. */
export type ChannelNowPlayingNext = {
  title: string;
  artistName: string;
  artistUsername: string | null;
};
