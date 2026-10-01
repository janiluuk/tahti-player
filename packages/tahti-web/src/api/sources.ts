export type {
  IntegrationId,
  ConnectionStatus,
  SourceDef,
  SourceCapabilities,
} from './sources/catalog';
export {
  SOURCE_DEFS,
  sourceCapabilities,
  oauthStartUrl,
  fetchConnectionStatus,
} from './sources/catalog';
export type {
  SoundcloudTrack,
  SoundcloudPlaylist,
  SoundcloudPlaylistTrack,
} from './sources/soundcloud';
export {
  fetchSoundcloudPlaylists,
  fetchSoundcloudPlaylistTracks,
  isSoundcloudLink,
  resolveSoundcloudPlaylist,
  fetchSoundcloudTracks,
  importSoundcloudTracks,
  playableFromSoundcloud,
} from './sources/soundcloud';
export type { SpotifyTrack } from './sources/spotify-collection';
export {
  addSpotifyTrack,
  fetchMySpotifyTracks,
  fetchSpotifyArtistTracks,
  searchSpotify,
  spotifyCoverUrl,
} from './sources/spotify-collection';
export type { BandcampAlbum } from './sources/bandcamp';
export { fetchBandcampAlbums, importBandcampAlbum } from './sources/bandcamp';
export type {
  HearthisTrack,
  HearthisCollection,
  HearthisLibrary,
} from './sources/hearthis';
export {
  fetchHearthisLibrary,
  fetchHearthisCollectionTracks,
  parseHearthisSetPermalink,
  importHearthisTracks,
  searchHearthisTracks,
  fetchHearthisTrackById,
  fetchHearthisArtistTracks,
  hearthisProfileFromQuery,
  playableFromHearthis,
} from './sources/hearthis';
export type { TrackExportStatus } from './sources/export-status';
export { fetchTrackExportStatus, exportTrack } from './sources/export-status';
export type { StashShare, StashFile } from './sources/stash';
export {
  fetchStashFiles,
  fetchStashDownload,
  uploadStashFile,
  deleteStashFile,
  createStashShare,
  revokeStashShare,
} from './sources/stash';
export {
  connectIntegrationMock,
  disconnectIntegration,
} from './sources/connections';
