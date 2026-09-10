/** Artist studio / catalog / editor types (mirrors Tahti /api/me/*). */

export type StudioChannel = {
  slug: string;
  state: string;
  goneLiveAt?: string | null;
  customDomain?: string | null;
  customDomainVerified?: boolean;
};

export type StudioSound = {
  id: string;
  title: string;
  status: string;
  durationSec?: number | null;
  sourceFormat?: string | null;
  sourceBitrateKbps?: number | null;
  sourceSampleRateHz?: number | null;
  sourceBitDepth?: number | null;
  sourceChannels?: number | null;
  description?: string | null;
  artistName?: string | null;
  genre?: string | null;
  subGenres?: string[];
  /** Role-based credits when this track differs from the channel's
   * Members/Credits roster — same role vocabulary as release credits. */
  credits?: ReleaseCredit[] | null;
  contentType?: string | null;
  license?: string | null;
  isPublic?: boolean;
  isFallback?: boolean;
  selectsOptIn?: boolean;
  topListsEligible?: boolean;
  commentsEnabled?: boolean;
  downloadsEnabled?: boolean;
  visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' | 'STASH';
  fanTierIds?: string[];
  /** One-time-purchase gate — set via `setSoundPurchaseAccess`, not part
   * of the general `patchStudioSound` body. */
  accessMode?: 'FREE' | 'SUBSCRIBERS_ONLY' | 'PURCHASE';
  purchaseTierId?: string | null;
  releaseDate?: string | null;
  pinnedAt?: string | null;
  effectiveBpm?: number | null;
  effectiveKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
  bannerUrl?: string | null;
  /** Wide backdrop image — real Prisma/API field name is `backgroundUrl`
   * (ChannelSoundItem.backgroundUrl); named to match here on purpose so the
   * request/response bodies round-trip without a translation layer. */
  backgroundUrl?: string | null;
  /** Set for EMBED_ONLY items imported by reference (hearthis.at, Mixcloud,
   * Spotify, Bandcamp) — Tahti holds no audio file, so playback only works
   * through the provider's own widget, not the normal editor-source stream. */
  embedProvider?: 'HEARTHIS' | 'MIXCLOUD' | 'SPOTIFY' | 'BANDCAMP' | null;
  embedUri?: string | null;
  /** [0..255] amplitude buckets for the real waveform — null/absent when not yet decoded. */
  peaks?: number[] | null;
  tracklist?: TracklistEntry[] | null;
  tracklistOverlay?: TracklistOverlaySettings | null;
};

export type TracklistEntry = {
  id: string;
  title: string;
  artist?: string | null;
  /** Tahti member handle; saving this creates a tracklist mention. */
  artistUsername?: string | null;
  startSec?: number | null;
};

export type TracklistOverlaySettings = {
  enabled: boolean;
  preset: 'minimal' | 'cards' | 'ticker';
};

export type StudioSoundPatch = {
  title?: string;
  description?: string;
  artistName?: string | null;
  genre?: string | null;
  subGenres?: string[];
  credits?: ReleaseCredit[] | null;
  contentType?: string;
  license?: string;
  isPublic?: boolean;
  isFallback?: boolean;
  selectsOptIn?: boolean;
  topListsEligible?: boolean;
  commentsEnabled?: boolean;
  downloadsEnabled?: boolean;
  visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' | 'STASH';
  fanTierIds?: string[];
  releaseDate?: string | null;
  pinned?: boolean;
  bannerUrl?: string | null;
  backgroundUrl?: string | null;
  replaceFallbackItemId?: string;
  tracklist?: TracklistEntry[] | null;
  tracklistOverlay?: TracklistOverlaySettings | null;
};

export type FingerprintMatch = {
  acoustidId: string;
  score: number;
  recordingId?: string;
  title?: string;
  artist?: string;
};

export type StudioReleaseTrack = {
  id: string;
  position: number;
  title: string;
  status?: string;
  durationSec?: number | null;
  soundId?: string | null;
  sourceKey?: string | null;
  fingerprintMatch?: FingerprintMatch | null;
};

export type StudioRelease = {
  id: string;
  title: string;
  type: string;
  state: string;
  releaseDate: string;
  description?: string | null;
  artworkUrl?: string | null;
  visualPreset?: string | null;
  colorSchemeJson?: string | null;
  smartLinkSlug: string;
  smartLinkViewCount?: number;
  smartLinkTargets?: Record<string, string> | null;
  tracks?: StudioReleaseTrack[];
  _count?: { tracks: number };
  upc?: string | null;
  revelatorId?: string | null;
  revelatorStatus?: string | null;
};

export type StudioReleaseList = {
  page: number;
  limit: number;
  total: number;
  releases: StudioRelease[];
};

export type StudioCollectionItem = {
  id: string;
  position: number;
  soundId?: string | null;
  releaseId?: string | null;
  sound?: {
    id: string;
    title: string;
    durationSec?: number | null;
    genre?: string | null;
    /** Set for EMBED_ONLY items — Tahti holds only the reference, so the
     * provider's widget is the only way to play them. */
    embedProvider?: 'HEARTHIS' | 'MIXCLOUD' | 'SPOTIFY' | 'BANDCAMP' | null;
    embedUri?: string | null;
  } | null;
  release?: {
    id: string;
    title: string;
    smartLinkSlug?: string;
  } | null;
};

export type StudioCollection = {
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  type?: string;
  style?: string;
  isPublic?: boolean;
  visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  releaseDate?: string | null;
  genres?: string[];
  /** Public playlists only — logged-in listeners can add catalog tracks. */
  collaborative?: boolean;
  coverUrl?: string | null;
  backdropUrl?: string | null;
  items?: StudioCollectionItem[];
  itemCount?: number;
};

export type EditorProjectRow = {
  id: string;
  title: string;
  soundId?: string | null;
  updatedAt: string;
};

export type EditorProjectDetail = EditorProjectRow & {
  timeline?: EditorTimeline | null;
  sources?: Array<{ id: string; title: string; url?: string }>;
};

export type EditorTimelineClip = {
  id: string;
  sourceSoundId: string;
  startSec: number;
  sourceOffsetSec: number;
  durationSec: number;
};

export type EditorTimelineTrack = {
  id: string;
  name: string;
  color: string;
  gainDb: number;
  muted: boolean;
  solo: boolean;
  clips: EditorTimelineClip[];
};

export type EditorTimeline = {
  version: 1;
  durationSec: number;
  tracks: EditorTimelineTrack[];
};

export type EditCut = { start: number; end: number };

/** Addable mastering plugins in the pro editor's chain -- gain and
 * loudness normalization are always-on quick controls, not chain
 * members. */
export type ProEditorPluginId = 'eq' | 'comp' | 'limiter' | 'filter';

export type EditList = {
  version: 1;
  sourceDuration: number;
  cuts: EditCut[];
  /** Order the active plugins render/process in -- a subset of the
   * addable ProEditorPluginId set. Absent on older drafts; callers treat
   * that the same as an empty chain. */
  pluginChain?: ProEditorPluginId[];
  fades: Array<{
    type: 'in' | 'out';
    at: number;
    duration: number;
    curve?: 'tri' | 'exp';
  }>;
  gainDb: number;
  eq: {
    enabled: boolean;
    bands: Array<{ freq: number; gainDb: number; q: number }>;
  };
  comp: {
    enabled: boolean;
    thresholdDb: number;
    ratio: number;
    attackMs: number;
    releaseMs: number;
    makeupDb: number;
  };
  limiter: { enabled: boolean; ceilingDb: number; releaseMs: number };
  filter: {
    enabled: boolean;
    mode: 'highpass' | 'highshelf' | 'lowpass' | 'lowshelf';
    freq: number;
    slope: '12db' | '24db' | 'brickwall';
  };
  loudnorm: { enabled: boolean; targetLufs: number; targetTp: number };
  highPassHz: number;
  lowPassHz: number;
};

export type EditorDraft = {
  editList: EditList;
  updatedAt: string | null;
  tracklist?: unknown;
  editorPeaks?: {
    sampleRate: number;
    durationSec: number;
    levels: number[][];
  } | null;
};

export type EditorSource = {
  url: string;
  durationSec: number | null;
  title: string;
  sourceKey?: string;
  sourceFileSizeBytes?: number;
};

/** GET /api/me/releases/:id/revelator — M7 DSP submission status. */
export type RevelatorReleaseStatus = {
  revelatorId: string | null;
  revelatorStatus: string | null;
  title: string;
};

/** GET /api/me/releases/:id/revelator/billing — distribution fee status. */
export type RevelatorBillingStatus = {
  paid: boolean;
  feeCents: number;
  waived: boolean;
  studioIncludedRemaining: number | null;
  distributionPaidAt: string | null;
};

export type RevelatorCheckoutResponse =
  | { checkoutUrl: string; sessionId: string }
  | { paid: true; feeCents: number; waived: boolean };

export type RevelatorSubmitAccepted = {
  releaseId: string;
  revelatorStatus: 'pending';
};

export type RevelatorRoyaltyReportRow = {
  id: string;
  releaseId: string;
  releaseTitle: string;
  periodStart: string;
  periodEnd: string;
  amountCents: number;
  currency: string;
  streams: number | null;
  syncedAt: string;
};

export const RELEASE_CREDIT_ROLES = [
  'writer',
  'composer',
  'performer',
  'producer',
  'remixer',
  'engineer',
  'label',
] as const;

export type ReleaseCreditRole = (typeof RELEASE_CREDIT_ROLES)[number];

export type ReleaseCredit = {
  role: ReleaseCreditRole;
  name: string;
  artistUsername?: string;
};

export type ReleaseChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  hint?: string;
};

/** GET/PATCH /api/me/releases/:id/catalog */
export type ReleaseCatalog = {
  id: string;
  title: string;
  type: string;
  state: string;
  releaseDate: string;
  description: string | null;
  artworkUrl: string | null;
  smartLinkSlug: string;
  smartLinkTargets: Record<string, string> | null;
  upc: string | null;
  musicbrainzReleaseId: string | null;
  musicbrainzArtistId: string | null;
  discogsReleaseId: string | null;
  pLine: string | null;
  cLine: string | null;
  labelImprint: string | null;
  credits: ReleaseCredit[] | null;
  revelatorId: string | null;
  revelatorStatus: string | null;
  tracks: Array<{
    id: string;
    position: number;
    title: string;
    isrc: string | null;
    musicbrainzRecordingId?: string | null;
    durationSec: number | null;
  }>;
  checklist: ReleaseChecklistItem[];
};

export type ReleaseCatalogPatch = {
  upc?: string | null;
  musicbrainzReleaseId?: string | null;
  musicbrainzArtistId?: string | null;
  discogsReleaseId?: string | null;
  pLine?: string | null;
  cLine?: string | null;
  labelImprint?: string | null;
  credits?: ReleaseCredit[];
};

export type SpotifyArtistProfile = {
  artistId: string;
  name: string;
  imageUrl: string | null;
};

export type SpotifyProfileStatus = {
  configured: boolean;
  profile: SpotifyArtistProfile | null;
};

export function createDefaultEditList(sourceDuration: number): EditList {
  return {
    version: 1,
    sourceDuration: Math.max(sourceDuration, 0.001),
    cuts: [],
    fades: [],
    pluginChain: [],
    gainDb: 0,
    eq: {
      enabled: false,
      bands: [
        { freq: 80, gainDb: 0, q: 1 },
        { freq: 1200, gainDb: 0, q: 1 },
        { freq: 9000, gainDb: 0, q: 1 },
      ],
    },
    comp: {
      enabled: false,
      thresholdDb: -18,
      ratio: 3,
      attackMs: 25,
      releaseMs: 250,
      makeupDb: 0,
    },
    limiter: { enabled: false, ceilingDb: -1, releaseMs: 50 },
    filter: { enabled: false, mode: 'highpass', freq: 80, slope: '12db' },
    loudnorm: { enabled: false, targetLufs: -14, targetTp: -1.5 },
    highPassHz: 0,
    lowPassHz: 0,
  };
}
