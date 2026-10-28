/** One track row inside a Discover dashboard widget — a common shape the
 * three backing tahti-org endpoints (top-lists, latest-tracks, new-to-you)
 * all get mapped into. */
export type DiscoverTrackItem = {
  id: string;
  title: string;
  artist: string;
  artistUsername?: string | null;
  channelSlug: string;
  coverUrl?: string | null;
  durationSec?: number | null;
  audioUrl?: string | null;
  genre?: string | null;
  /** Only present for the two top-lists-backed widgets. */
  listens?: number;
  /** Aggregate LOVE reactions from the community. */
  loves?: number;
  /** Track-row extras from /api/discover/latest-tracks. */
  peaks?: number[] | null;
  createdAt?: string;
  downloadsEnabled?: boolean;
  likeCount?: number;
  playCount?: number;
  downloadCount?: number;
  commentCount?: number;
};

export type DiscoverCollection = {
  slug: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  itemCount: number;
  ownerUsername: string;
  ownerDisplayName: string;
};
