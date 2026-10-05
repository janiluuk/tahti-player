import type { FetchMeta } from '../../api/client';
import type {
  BandcampAlbum,
  ConnectionStatus,
  HearthisLibrary,
  HearthisTrack,
  IntegrationId,
  MixcloudCloudcast,
  SoundcloudTrack,
  SourceDef,
  SpotifyTrack,
} from '../../api/sources';

/**
 * Shared metadata every import source exposes. Kind-specific behavior lives
 * on OAuth, search, and tool/upload adapters — do not add a fake universal
 * start/status/import method here.
 */
export type ImportSourcePlugin = SourceDef & {
  /** Full OAuth authorize URL, or null if this source isn't OAuth-based. */
  oauthUrl: string | null;
  /** Live connection/configuration state for this source. */
  checkStatus(): Promise<{ data: ConnectionStatus; meta: FetchMeta }>;
};

export type DisconnectResult = { ok: true } | { ok: false; error: string };

export type OAuthDisconnectId = Extract<
  IntegrationId,
  'bandcamp' | 'soundcloud' | 'google-drive' | 'mixcloud' | 'musicbrainz'
>;

type OAuthAdapterBase = ImportSourcePlugin & {
  kind: 'oauth';
  oauthUrl: string;
  disconnect(): Promise<DisconnectResult>;
};

export type BandcampSourceAdapter = OAuthAdapterBase & {
  id: 'bandcamp';
  listAlbums(): Promise<{
    data: BandcampAlbum[];
    connected: boolean;
    message?: string;
    importAvailable?: boolean;
    meta: FetchMeta;
  }>;
  importAlbum(
    album: BandcampAlbum,
  ): Promise<{ ok: true; count: number } | { ok: false; error: string }>;
};

export type SoundcloudSourceAdapter = OAuthAdapterBase & {
  id: 'soundcloud';
  listTracks(): Promise<{ data: SoundcloudTrack[]; meta: FetchMeta }>;
  importTracks(
    tracks: Array<{ trackId: string; title: string }>,
  ): Promise<{ ok: true; count: number } | { ok: false; error: string }>;
};

export type GoogleDriveSourceAdapter = OAuthAdapterBase & {
  id: 'google-drive';
};

export type MixcloudSourceAdapter = OAuthAdapterBase & {
  id: 'mixcloud';
};

export type FallbackOAuthAdapter = OAuthAdapterBase & {
  id: 'musicbrainz';
};

export type OAuthSourceAdapter =
  | BandcampSourceAdapter
  | SoundcloudSourceAdapter
  | GoogleDriveSourceAdapter
  | MixcloudSourceAdapter
  | FallbackOAuthAdapter;

type SearchAdapterBase = ImportSourcePlugin & {
  kind: 'search';
};

export type SpotifySourceAdapter = SearchAdapterBase & {
  id: 'spotify';
  search(
    query: string,
  ): Promise<{ ok: true; data: SpotifyTrack[] } | { ok: false; error: string }>;
  addToCollection(
    collectionId: string,
    spotifyUri: string,
  ): Promise<
    { ok: true; data: { soundId: string } } | { ok: false; error: string }
  >;
};

export type HearthisImportResult = {
  imported: number;
  failed: number;
  artworkFailed: number;
  items: Array<{ trackId: string; soundId: string }>;
};

export type HearthisSourceAdapter = SearchAdapterBase & {
  id: 'hearthis';
  search(query: string): Promise<{ data: HearthisTrack[]; meta: FetchMeta }>;
  library(): Promise<{ data: HearthisLibrary; meta: FetchMeta }>;
  collectionTracks(permalink: string): Promise<HearthisTrack[]>;
  importTracks(
    destinationId: string,
    tracks: HearthisTrack[],
  ): Promise<HearthisImportResult>;
};

export type MixcloudEmbedSourceAdapter = SearchAdapterBase & {
  id: 'mixcloud-embed';
  search(
    query: string,
  ): Promise<
    { ok: true; data: MixcloudCloudcast[] } | { ok: false; error: string }
  >;
  addToCollection(
    collectionId: string,
    cloudcastUrl: string,
  ): Promise<
    { ok: true; data: { soundId: string } } | { ok: false; error: string }
  >;
};

export type SearchSourceAdapter =
  SpotifySourceAdapter | HearthisSourceAdapter | MixcloudEmbedSourceAdapter;

export type ToolSourceAdapter = ImportSourcePlugin & {
  kind: 'tool' | 'upload';
};

export type SourceAdapter =
  OAuthSourceAdapter | SearchSourceAdapter | ToolSourceAdapter;
