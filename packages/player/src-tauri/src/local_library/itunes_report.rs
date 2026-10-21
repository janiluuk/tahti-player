//! What an iTunes / Music.app import reports back: the preview's counts and
//! unresolved tracks, commit progress, and the commit's result.

use serde::Serialize;
use specta_typescript::Number;

use super::ImportFailure;

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ItunesPreview {
    /// The library's `Music Folder`, as a local path: the prefix to remap
    /// when the music has moved since the export.
    pub music_folder: Option<String>,
    #[specta(type = Number<usize>)]
    pub tracks: usize,
    /// Per file: an XML track pointing at a file an earlier one already
    /// points at is only counted in `duplicate_tracks`.
    /// Found in the catalog by path; will be linked, nothing imported.
    #[specta(type = Number<usize>)]
    pub tracks_in_catalog: usize,
    /// On disk but not in the catalog yet; will be imported.
    #[specta(type = Number<usize>)]
    pub tracks_to_import: usize,
    #[specta(type = Number<usize>)]
    pub tracks_missing: usize,
    /// A file the importer cannot read (protected AAC, video, ...).
    #[specta(type = Number<usize>)]
    pub tracks_unsupported: usize,
    /// No local file at all (streams, cloud-only items).
    #[specta(type = Number<usize>)]
    pub tracks_not_local: usize,
    /// XML tracks pointing at a file another XML track already points at.
    #[specta(type = Number<usize>)]
    pub duplicate_tracks: usize,
    /// XML tracks a previous import already linked.
    #[specta(type = Number<usize>)]
    pub previously_imported: usize,
    #[specta(type = Number<usize>)]
    pub playlists: usize,
    #[specta(type = Number<usize>)]
    pub playlist_entries: usize,
    #[specta(type = Number<usize>)]
    pub playlist_folders: usize,
    #[specta(type = Number<usize>)]
    pub playlists_already_imported: usize,
    /// Library, Music, Podcasts and the other lists Music.app makes itself.
    #[specta(type = Number<usize>)]
    pub builtin_playlists_skipped: usize,
    /// Every XML track that will not be linked or imported (duplicates
    /// excluded), in XML order, up to `itunes_import::UNRESOLVED_KEPT`.
    pub unresolved: Vec<ItunesUnresolved>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum UnresolvedReason {
    Missing,
    Unsupported,
    NotLocal,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ItunesUnresolved {
    pub name: String,
    pub artist: String,
    /// The local path it points at after remapping; `None` when not local.
    pub path: Option<String>,
    pub reason: UnresolvedReason,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum ItunesImportStage {
    /// Importing files that are on disk but not in the catalog.
    Importing,
    /// Ratings, play counts, tags and BPM from the XML.
    Metadata,
    Playlists,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ItunesImportProgress {
    pub stage: ItunesImportStage,
    #[specta(type = Number<usize>)]
    pub done: usize,
    #[specta(type = Number<usize>)]
    pub total: usize,
}

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ItunesImportResult {
    /// XML tracks linked to a track that was already in the catalog.
    #[specta(type = Number<usize>)]
    pub tracks_linked: usize,
    /// Files imported into the catalog by this run.
    #[specta(type = Number<usize>)]
    pub tracks_imported: usize,
    #[specta(type = Number<usize>)]
    pub tracks_failed: usize,
    #[specta(type = Number<usize>)]
    pub tracks_missing: usize,
    #[specta(type = Number<usize>)]
    pub tracks_unsupported: usize,
    #[specta(type = Number<usize>)]
    pub tracks_not_local: usize,
    #[specta(type = Number<usize>)]
    pub duplicate_tracks: usize,
    /// Plays added to local play counts (growth since the last import only).
    #[specta(type = Number<i64>)]
    pub plays_added: i64,
    #[specta(type = Number<i64>)]
    pub skips_added: i64,
    #[specta(type = Number<usize>)]
    pub ratings_applied: usize,
    #[specta(type = Number<usize>)]
    pub loved_tagged: usize,
    /// Empty tag fields filled from the XML.
    #[specta(type = Number<usize>)]
    pub fields_filled: usize,
    /// Fields where the file's own tag differs from the XML and was kept.
    #[specta(type = Number<usize>)]
    pub fields_kept_from_file: usize,
    #[specta(type = Number<usize>)]
    pub bpm_applied: usize,
    #[specta(type = Number<usize>)]
    pub playlists_created: usize,
    /// Created under a new name because the name was taken.
    #[specta(type = Number<usize>)]
    pub playlists_renamed: usize,
    #[specta(type = Number<usize>)]
    pub playlists_already_imported: usize,
    #[specta(type = Number<usize>)]
    pub playlist_entries: usize,
    /// Entries kept but not linked to a catalog track (file missing or not
    /// importable); they link up by path when the file joins the catalog.
    #[specta(type = Number<usize>)]
    pub playlist_entries_unavailable: usize,
    /// Entries with no local file at all, left out.
    #[specta(type = Number<usize>)]
    pub playlist_entries_skipped: usize,
    /// First import failures (the rest are only counted).
    pub errors: Vec<ImportFailure>,
}
