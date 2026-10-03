/** GET /api/tracks/:id — full detail for a standalone track page, reached
 * only by track id (favorites, an artist's catalog, a shared link) rather
 * than a page already scoped to the owning channel. */
export type PublicTrackDetail = {
  id: string;
  title: string;
  artistName: string;
  channelSlug: string;
  channel: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
  };
  durationSec: number | null;
  audioUrl: string | null;
  /** Set for items Tahti references but never hosts (EMBED_ONLY) — the
   * provider's widget is the only way to play them. */
  embedProvider?: 'HEARTHIS' | 'MIXCLOUD' | 'SPOTIFY' | 'BANDCAMP' | null;
  embedUri?: string | null;
  bannerUrl: string | null;
  /** Wide backdrop image set in Studio's track editor — shown behind the
   * player hero when present; falls back to a gradient built from the
   * cover art otherwise. */
  backgroundUrl?: string | null;
  /** Gallery images for the track page backdrop when `galleryMode` is
   * STATIC_SLIDESHOW — same shape as the channel page's own gallery. */
  slideshowUrls?: string[];
  galleryMode?: string | null;
  genre: string | null;
  subGenres: string[];
  contentType: string;
  mixVersion: string | null;
  description: string | null;
  commentary: string | null;
  tracklist?: unknown;
  /** `[{ role, name, artistUsername? }]` as stored on the sound; parse with
   * `trackDetailFacts` before rendering. */
  credits?: unknown;
  license: string;
  releasedAt: string;
  effectiveBpm: number | null;
  effectiveKey: string | null;
  isAiGenerated?: boolean;
  /** [0..255] amplitude buckets for the real waveform — null when not yet decoded. */
  peaks: number[] | null;
  commentCount: number;
  downloadCount: number;
  accessMode?: 'FREE' | 'SUBSCRIBERS_ONLY' | 'PURCHASE';
  purchaseTierId?: string | null;
  purchaseTierName?: string | null;
  purchaseTierPriceCents?: number | null;
  /** True = buyer may enter any amount >= 0 ("pay what you want", incl.
   * free) instead of paying purchaseTierPriceCents exactly. */
  purchaseTierPriceOptional?: boolean;
  downloadsEnabled?: boolean;
  /** Set (with `audioUrl: null`) when the viewer may not stream this track;
   * null when they may. Absent from API builds that predate the gate. */
  gate?: TrackAccessGate | null;
};

export type TrackAccessGate = {
  reason: 'SUBSCRIBERS_ONLY' | 'PURCHASE';
  tierId?: string;
};
