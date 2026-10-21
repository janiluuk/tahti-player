export type ChannelEmbedView = {
  slug: string;
  state: string;
  artist: { username: string; displayName: string; avatarUrl: string | null };
  embedUrl?: string;
  profileUrl?: string;
  hlsUrl: string | null;
};

export type ReleaseEmbedTrack = {
  id: string;
  position: number;
  title: string;
  durationSec?: number | null;
  hasStream?: boolean;
};

export type ReleaseEmbedView = {
  id: string;
  title: string;
  type?: string;
  artworkUrl?: string | null;
  smartLinkSlug?: string | null;
  artist: { username: string; displayName: string };
  tracks: ReleaseEmbedTrack[];
  embedUrl?: string;
  profileUrl?: string;
};

export type CollectionEmbedTrack = {
  id: string;
  title: string;
  durationSec?: number | null;
  hasStream?: boolean;
};

export type CollectionEmbedView = {
  slug: string;
  name: string;
  coverUrl?: string | null;
  embedUrl?: string;
  profileUrl?: string;
  artist: { username: string; displayName: string };
  tracks: CollectionEmbedTrack[];
};
