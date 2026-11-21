import type { PostCategory } from './community-stories';

/** GET /api/me/feed — recent activity from artists the current user follows. */
export type FeedArtist = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type FeedItem =
  | {
      kind: 'post';
      id: string;
      date: string;
      artist: FeedArtist;
      title: string | null;
      body: string;
      images?: string[];
      linkUrl?: string | null;
      linkLabel?: string | null;
      /** Sent once tahti-org ships post categories; older APIs leave it out. */
      category?: PostCategory;
    }
  | {
      kind: 'track';
      id: string;
      date: string;
      artist: FeedArtist;
      title: string;
      bannerUrl: string | null;
      channelSlug: string;
      /** Present when the track is independently playable from the feed. */
      audioUrl?: string | null;
      peaks?: number[] | null;
    }
  | {
      kind: 'release';
      id: string;
      date: string;
      artist: FeedArtist;
      title: string;
      releaseType: string;
      artworkUrl: string | null;
      smartLinkSlug: string | null;
    };

export type FeedResponse = {
  items: FeedItem[];
  followingCount: number;
};
