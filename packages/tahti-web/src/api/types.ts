export type ChannelDirectoryItem = {
  slug: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  genres: string[];
  /** True while live or replaying — API field from `/api/v1/channels/directory`. */
  isActive?: boolean;
  /** Older alias; prefer `isActive`. */
  live?: boolean;
  /** Self-selected artist roles (dj/producer/band/etc) — see
   * ARTIST_ROLE_OPTIONS in views/settings/SettingsPanels.tsx. */
  artistRoles?: string[];
  /** True while the channel is live right now — the directory's "radio
   * host" filter is defined as having an active running show. */
  hasActiveShows?: boolean;
};

export function isDirectoryArtistActive(item: ChannelDirectoryItem): boolean {
  return item.isActive === true || item.live === true;
}

export type ChannelDirectoryResponse = {
  items: ChannelDirectoryItem[];
};

export type OnAirChannel = {
  slug: string;
  state: string;
  fallbackEnabled: boolean;
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

export type OnAirChannelResponse = {
  live: OnAirChannel[];
  replaying: OnAirChannel[];
  recent: OnAirChannel[];
};

export type ChannelNowPlaying = {
  title: string;
  artistName: string;
  artistUsername: string | null;
  artworkUrl: string | null;
};

export type PublicChannel = {
  slug: string;
  state: 'LIVE' | 'OFFLINE' | string;
  hlsUrl: string | null;
  /** When false, channel chat is off — right rail chat unavailable. */
  chatEnabled?: boolean;
  visualPreset?: string | null;
  visualSettingsJson?: string | null;
  /** Channel page header banner treatment — GRADIENT/SOLID/VIDEO_LOOP. */
  headerStyle?: string | null;
  /** VIDEO_LOOP's clip — reused from the backend's Gallery & backdrop field. */
  videoBackgroundUrl?: string | null;
  galleryMode?: string | null;
  slideshowImages?: string[];
  colorSchemeJson?: string | null;
  colorScheme?: {
    accent?: string;
    highlight?: string;
    /** Canonical API key (ColorSchemeSchema). */
    bg?: string;
    text?: string;
    muted?: string;
    /** Legacy aliases — prefer `bg` / `text`. */
    background?: string;
    foreground?: string;
  } | null;
  /** Channel Designer brand accent id (aurora/ember/…) — drives GRADIENT
   * header wash when present on the public channel DTO. */
  brandAccentPreset?: string | null;
  /** Now-playing title/artist overlay layout — see
   * content/nowPlayingOverlayPresets.ts. Defaults to 'classic' when unset. */
  nowPlayingOverlayStyle?: string | null;
  nowPlayingOverlaySettingsJson?: string | null;
  /** Outbound links shown in the channel page's Links block. */
  channelLinks?: Array<{ label: string; url: string }> | null;
  /** Stylized headline shown in the channel page's Text overlay block.
   * Live API returns these as `textLayer*`; fetchChannel normalizes. */
  textOverlayMode?: string | null;
  textOverlayText?: string | null;
  textOverlayAlign?: string | null;
  /** Headline shown inside the player stage itself (Player design →
   * Overlay tab) — distinct from the channel page's Text overlay block. */
  playerOverlayMode?: string | null;
  playerOverlayText?: string | null;
  playerOverlayAlign?: string | null;
  /** Client/mock look extras — live API may omit until columns land. */
  usePlayerGradient?: boolean;
  playerColorSchemeJson?: string | null;
  useBackgroundGradient?: boolean;
  backgroundColorSchemeJson?: string | null;
  backgroundVisualPreset?: string | null;
  user: {
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
  };
  nowPlaying: ChannelNowPlaying | null;
  /** Public follower count for the channel's Stats block — sourced from the
   * artist profile (GET /api/v1/u/:username/profile), fetched alongside the
   * channel so the backdrop's Stats element has something real to show. */
  followerCount?: number | null;
};

export type RadioNowPlaying = {
  live: boolean;
  channel: null | {
    slug: string;
    displayName?: string;
    hlsUrl?: string | null;
    title?: string | null;
    artworkUrl?: string | null;
    visualPreset?: string | null;
  };
};

/** GET /api/v1/radio/recently-played — track history on Tahti Radio. */
export type RadioRecentlyPlayedItem = {
  id: string;
  title: string;
  artistName: string;
  artistUsername: string | null;
  artworkUrl: string | null;
  playedAt: string;
  /** Present when the track is independently replayable from the archive. */
  audioUrl?: string | null;
};

/** Public archive row from GET /api/channels/:slug/items */
export type ArchiveItem = {
  id: string;
  title: string;
  artistName?: string | null;
  durationSec?: number | null;
  bannerUrl?: string | null;
  audioUrl?: string | null;
  genre?: string | null;
  createdAt?: string;
  /** Origin provider when imported (soundcloud, bandcamp, …). */
  sourceProvider?: string | null;
  /** Present when API serializes Stage pins (profile always; channel items may omit). */
  pinnedAt?: string | null;
  /** Set for items Tahti references but never hosts (EMBED_ONLY) — the API
   * already returns these (see routes/channels/items.ts), this type just
   * hadn't declared them. */
  embedProvider?: 'HEARTHIS' | 'MIXCLOUD' | 'SPOTIFY' | 'BANDCAMP' | null;
  embedUri?: string | null;
};

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
  license: string;
  releasedAt: string;
  effectiveBpm: number | null;
  effectiveKey: string | null;
  /** [0..255] amplitude buckets for the real waveform — null when not yet decoded. */
  peaks: number[] | null;
  commentCount: number;
  downloadCount: number;
  accessMode?: 'FREE' | 'SUBSCRIBERS_ONLY' | 'PURCHASE';
  purchaseTierId?: string | null;
  purchaseTierName?: string | null;
  purchaseTierPriceCents?: number | null;
  downloadsEnabled?: boolean;
};

export type TrackComment = {
  id: string;
  body: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  createdAt: string;
};

export type PublicProfileArtist = {
  username: string;
  displayName: string;
  bio: string | null;
  /** Optional longer-form history, shown expanded below the short bio. */
  fullBio: string | null;
  avatarUrl: string | null;
  tipJarUrl?: string | null;
  tier?: string;
  pronouns?: string | null;
  followerCount?: number | null;
  followingCount?: number | null;
  freeSubscriptionsEnabled?: boolean;
  socialLinks?: Record<string, string> | null;
};

export type PublicProfileTrack = {
  id: string;
  title: string;
  artistName?: string | null;
  durationSec?: number | null;
  bannerUrl?: string | null;
  playUrl?: string | null;
  releaseSlug?: string | null;
  /** Same field as ArchiveItem.createdAt -- carried onto the profile track
   * DTO so the catalog table can show a release date. */
  createdAt?: string;
  /** Stage pin — GET /api/v1/u/:username/profile */
  pinned?: boolean;
  pinnedAt?: string | null;
  /** Optional public engagement totals returned by newer profile APIs. */
  likeCount?: number;
  commentCount?: number;
  repostCount?: number;
};

export type PublicProfileRelease = {
  id: string;
  title: string;
  type?: string;
  artworkUrl?: string | null;
  smartLinkSlug?: string | null;
  releaseDate?: string | null;
  genre?: string | null;
  description?: string | null;
  pinned?: boolean;
  pinnedAt?: string | null;
  tracks?: Array<{
    position: number;
    title: string;
    durationSec?: number | null;
    soundId?: string | null;
    playUrl?: string | null;
  }>;
};

export type PublicProfileCollection = {
  slug: string;
  name: string;
  type: string;
  style: string;
  description: string | null;
  coverUrl: string | null;
  isFeatured: boolean;
  itemCount: number;
  url: string;
  rssUrl: string;
};

export type PublicProfile = {
  artist: PublicProfileArtist;
  channel: { slug: string; state: string; artistKind?: string } | null;
  releases: PublicProfileRelease[];
  tracks: PublicProfileTrack[];
  fanTiers: Array<{ id: string; name: string; amountCents: number }>;
  collections: PublicProfileCollection[];
  links: {
    channel: string | null;
    subscribe: string;
    feeds: { archive: string | null };
    presskit: string;
  };
  backgroundMusicUrl?: string | null;
};

export type CollectionSound = {
  id: string;
  title: string;
  durationSec?: number | null;
  bannerUrl?: string | null;
  audioUrl?: string | null;
  channel?: { slug: string } | null;
  /** Set for items Tahti references but never hosts (EMBED_ONLY) — the
   * provider's widget supplies the audio and artwork. */
  embedProvider?: 'HEARTHIS' | 'MIXCLOUD' | 'SPOTIFY' | 'BANDCAMP' | null;
  embedUri?: string | null;
};

export type CollectionItem = {
  id?: string;
  position: number;
  sound: CollectionSound | null;
  release: {
    id: string;
    title: string;
    type?: string;
    smartLinkSlug?: string | null;
    artworkUrl?: string | null;
    description?: string | null;
  } | null;
};

export type PublicCollection = {
  slug: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  backdropUrl?: string | null;
  videoBackgroundUrl?: string | null;
  galleryMode?: string | null;
  slideshowImages?: string[];
  visualPreset?: string | null;
  isPublic: boolean;
  collaborative: boolean;
  user: { username: string; displayName: string };
  items: CollectionItem[];
  links: { page: string; rss: string };
};

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
    tracks?: Array<{ title: string; position: number; isrc?: string | null }>;
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

export type VenueDirectoryItem = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  countryCode: string | null;
  capacity: number | null;
  description: string | null;
  externalLinks?: Record<string, string> | null;
  photos?: string[];
};

export type VenueUpcomingBroadcast = {
  id: string;
  startAt: string;
  endAt: string | null;
  description: string | null;
};

export type VenueProfile = VenueDirectoryItem & {
  address: string;
  latitude: number | null;
  longitude: number | null;
  broadcasts: VenueUpcomingBroadcast[];
};

/** Playable item in the Tahti listen client (live channel, radio, or archive URL). */
export type TahtiPlayable = {
  id: string;
  kind: 'live' | 'radio' | 'archive';
  title: string;
  artist: string;
  coverUrl?: string;
  streamUrl: string;
  protocol: 'hls' | 'https';
  embed?: {
    provider: 'hearthis';
    embedUri: string;
  };
  channelSlug?: string;
  /** Nuclear ProviderRef.provider — e.g. tahti, soundcloud, bandcamp, spotify. */
  sourceProvider?: string;
  durationSec?: number | null;
  /** ISO date this track/release went live — shown as a "Released" column
   * in track listings when present. */
  releaseDate?: string | null;
};

export type ChatMessage = {
  id: string;
  handle: string;
  text: string;
  ts: number;
  supporter?: boolean;
  channelRole?: 'owner' | 'moderator' | null;
  countryCode?: string | null;
  system?: boolean;
};

export type ChatAccess = {
  fanChatEnabled: boolean;
  isSupporter: boolean;
  canJoinFanChat: boolean;
  subscribersOnly: boolean;
  canPostInChat: boolean;
};

export type ChatTokenResponse = {
  token: string;
  handle: string;
  fingerprint?: string;
  supporter?: boolean;
  countryCode?: string | null;
  channelRole?: 'owner' | 'moderator' | null;
};

export type AccountRole = 'BOARD' | 'ARTIST' | 'LISTENER';

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role?: AccountRole;
  roles?: AccountRole[];
  tier?: string;
  avatarUrl?: string | null;
  isMember?: boolean;
  isBoard?: boolean;
  channel?: {
    slug: string;
    state: string;
    goneLiveAt?: string | null;
    customDomain?: string | null;
    customDomainVerified?: boolean;
  } | null;
};

export type FanTierPublic = {
  id: string;
  name: string;
  amountCents: number;
  description?: string | null;
  perks?: string[];
};

export type FanTiersResponse = {
  artist: {
    id: string;
    displayName: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
  };
  tiers: FanTierPublic[];
  paymentsReady: boolean;
};

export type TransparencyYtd = {
  year: string;
  byCategory: Record<string, string>;
  runningSurplus: string;
  monthsFinalized: number;
};

export type TransparencyGrantReport = {
  year: number;
  totalCents: string;
  grantCount: number;
  disbursedAt: string | null;
  grants: Array<{
    publishedAs: string;
    units: number;
    amountCents: string;
    state: string;
  }>;
};

export type TransparencyLedgerEntry = {
  id: string;
  description: string;
  category: string;
  amountCents: string;
  createdAt: string;
};

export type FollowListUser = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

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

export type PlatformStatusCheck = {
  state: 'ok' | 'degraded' | 'down' | string;
  critical?: boolean;
  latencyMs?: number;
  detail?: string;
};

export type PlatformStatus = {
  status: 'ok' | 'degraded' | 'down' | string;
  version?: string;
  uptimeSec?: number;
  checks: Record<string, PlatformStatusCheck>;
  ts?: string;
};

export type MembershipStatus = {
  status: string;
  isMember: boolean;
  memberNumber?: number | null;
  memberSince?: string | null;
  tier?: string;
  priceCents?: number;
  emailVerified?: boolean;
  renewalDueAt?: string | null;
  hasStripeSubscription?: boolean;
  subscriptionMigrationRequired?: boolean;
};

export type FanSubscriptionRow = {
  id: string;
  tierName: string;
  amountCents: number;
  state: string;
  currentPeriodEnd?: string | null;
  canceledAt?: string | null;
  artist: { username: string; displayName: string };
};

export type GovernanceMotion = {
  id: string;
  title: string;
  state: string;
  advisory?: boolean;
  openAt?: string | null;
  closeAt?: string | null;
  proposer?: string;
  totalVotes?: number;
  youVoted?: boolean;
  yourChoice?: string | null;
  commentCount?: number;
  tally?: { YES: number; NO: number; ABSTAIN: number };
};

export type GovernanceMotionDraft = {
  id: string;
  state: string;
};

export type PublicGovernanceMotion = {
  id: string;
  title: string;
  description: string;
  closedAt: string;
  proposer: string;
  voteFor: number;
  voteAgainst: number;
  voteAbstain: number;
};

export type GovernanceMeeting = {
  id: string;
  title: string;
  type: 'GENERAL' | 'EXTRAORDINARY_GENERAL' | 'BOARD';
  state:
    | 'DRAFT'
    | 'SCHEDULED'
    | 'HELD'
    | 'MINUTES_DRAFT'
    | 'APPROVED'
    | 'CANCELLED';
  scheduledAt: string | null;
  location: string | null;
  remoteUrl: string | null;
  noticeAt: string | null;
  agenda?: unknown;
  minutesKey: string | null;
  minutesApprovedAt: string | null;
  eligibleMemberCount: number | null;
  quorumRequired: number | null;
  attendanceCount: number;
  presentCount: number;
  quorumMet: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type GovernanceAgendaItem = {
  title: string;
  description?: string;
};

export type GovernanceMember = {
  memberNumber: number | null;
  displayName: string;
  username: string;
  memberSince: string | null;
  isBoard: boolean;
  channelSlug: string | null;
};

export type GovernanceQuarterlyReport = {
  id: string;
  year: number;
  quarter: number;
  storageKey: string;
  generatedAt: string;
  generatedByDisplayName: string;
  downloadUrl: string | null;
};

export type GovernanceDocument = {
  id: string;
  title: string;
  type:
    | 'BYLAWS'
    | 'POLICY'
    | 'MEETING_NOTICE'
    | 'MINUTES'
    | 'ANNUAL_REPORT'
    | 'FINANCIAL_STATEMENT'
    | 'AUDIT_REPORT'
    | 'OTHER';
  description: string | null;
  version: number;
  effectiveAt: string | null;
  publishedAt: string | null;
  meetingId: string | null;
  downloadUrl: string | null;
  externalUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BoardResolution = {
  id: string;
  title: string;
  body: string;
  votedAt: string;
  outcome: string;
  voteFor: number;
  voteAgainst: number;
  voteAbstain: number;
  publishedAt?: string | null;
  createdAt?: string;
  createdByDisplayName?: string | null;
};

export type FeatureRequestStatus =
  | 'OPEN'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'DECLINED'
  | 'DUPLICATE';

/** Member-suggested feature board — GET/POST /api/v1/governance/feature-requests. */
export type FeatureRequest = {
  id: string;
  title: string;
  description: string;
  status: FeatureRequestStatus;
  proposer: string;
  voteCount: number;
  youVoted: boolean;
  commentCount: number;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  mergedIntoId?: string | null;
  mergedIntoTitle?: string | null;
  createdAt: string;
};

/** GET /api/v1/news — public homepage news feed, published from the admin
 * News panel (`/admin/news`), most recent first. */
export type Announcement = {
  id: string;
  headline: string;
  summary: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  authorName: string;
  publishedAt: string;
};

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
};

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

export type DiscoverCollection = {
  slug: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  itemCount: number;
  ownerUsername: string;
  ownerDisplayName: string;
};

export type SearchResponse = {
  tracks: SearchTrackResult[];
  artists: SearchArtistResult[];
  collections: SearchCollectionResult[];
};

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
  | { type: 'state'; session: JamSession }
  | { type: 'ended' };
