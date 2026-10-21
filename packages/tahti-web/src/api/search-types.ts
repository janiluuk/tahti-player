/** GET /api/v1/search response shapes. */

export type SearchTrackResult = {
  id: string;
  title: string;
  artistName: string;
  channelSlug: string;
  durationSec: number | null;
  coverUrl: string | null;
};

export type SearchArtistResult = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  channelSlug: string | null;
};

export type SearchCollectionResult = {
  slug: string;
  name: string;
  coverUrl: string | null;
  ownerUsername: string;
  ownerDisplayName: string;
};

export type SearchResponse = {
  tracks: SearchTrackResult[];
  artists: SearchArtistResult[];
  collections: SearchCollectionResult[];
};
