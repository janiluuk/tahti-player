/** Types for importing an iTunes / Music.app library XML into the native library. */

import type { NativeRootMapping } from './catalog';

export type NativeItunesPreview = {
  /** The library's `Music Folder` as a local path: the prefix to remap when the music has moved. */
  musicFolder: string | null;
  tracks: number;
  /** Found in the catalog by path; will be linked, nothing imported. */
  tracksInCatalog: number;
  /** On disk but not in the catalog yet; will be imported. */
  tracksToImport: number;
  tracksMissing: number;
  /** A file the importer cannot read (protected AAC, video, ...). */
  tracksUnsupported: number;
  /** No local file at all (streams, cloud-only items). */
  tracksNotLocal: number;
  /** XML tracks pointing at a file another XML track already points at. */
  duplicateTracks: number;
  /** XML tracks a previous import already linked. */
  previouslyImported: number;
  playlists: number;
  playlistEntries: number;
  playlistFolders: number;
  playlistsAlreadyImported: number;
  /** Library, Music, Podcasts and the other lists Music.app makes itself. */
  builtinPlaylistsSkipped: number;
  missingExamples: string[];
  unsupportedExamples: string[];
};

export type NativeItunesImportResult = {
  /** XML tracks linked to a track that was already in the catalog. */
  tracksLinked: number;
  /** Files imported into the catalog by this run. */
  tracksImported: number;
  tracksFailed: number;
  tracksMissing: number;
  tracksUnsupported: number;
  tracksNotLocal: number;
  duplicateTracks: number;
  /** Plays added to local play counts (growth since the last import only). */
  playsAdded: number;
  skipsAdded: number;
  ratingsApplied: number;
  lovedTagged: number;
  /** Empty tag fields filled from the XML. */
  fieldsFilled: number;
  /** Fields where the file's own tag differs from the XML and was kept. */
  fieldsKeptFromFile: number;
  bpmApplied: number;
  playlistsCreated: number;
  /** Created under a new name because the name was taken. */
  playlistsRenamed: number;
  playlistsAlreadyImported: number;
  playlistEntries: number;
  /** Entries kept but not linked to a catalog track yet; they link up by path later. */
  playlistEntriesUnavailable: number;
  /** Entries with no local file at all, left out. */
  playlistEntriesSkipped: number;
  /** First import failures (the rest are only counted). */
  errors: Array<{ path: string; error: string }>;
};

export type NativeItunesImport = {
  /** Asks for the library XML; `null` if cancelled. */
  pick: () => Promise<string | null>;
  /** What an import would do with these folder remaps; nothing is written. */
  preview: (
    sourcePath: string,
    mappings: NativeRootMapping[],
  ) => Promise<NativeItunesPreview>;
  /** Links, imports and overlays metadata; safe to run again on the same XML. */
  commit: (
    sourcePath: string,
    mappings: NativeRootMapping[],
  ) => Promise<NativeItunesImportResult>;
};
