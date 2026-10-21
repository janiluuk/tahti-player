import type { SmartLinkTrack } from './release-download';

export type SmartLinkView = {
  release: {
    id: string;
    title: string;
    type?: string;
    artworkUrl?: string | null;
    visualPreset?: string | null;
    slideshowImages?: string[];
    galleryMode?: string | null;
    releaseDate?: string | null;
    genre?: string | null;
    description?: string | null;
    smartLinkSlug?: string;
    showPoweredByFooter?: boolean;
    tracks?: SmartLinkTrack[];
    pLine?: string | null;
    cLine?: string | null;
    musicbrainzUrl?: string | null;
    discogsUrl?: string | null;
  };
  artist: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  featuredCollections: Array<{
    slug: string;
    name: string;
    coverUrl?: string | null;
    itemCount?: number;
    url?: string;
  }>;
  profileUrl: string;
  releaseUrl: string;
  targets: Record<string, string>;
  embedUrl: string;
};
