mod metadata;
pub mod backup;
pub mod catalog;
pub mod m3u;
pub mod playlists;
pub mod tag_writer;
#[cfg(test)]
mod catalog_tests;
#[cfg(test)]
mod backup_tests;
#[cfg(test)]
mod tag_writer_tests;
#[cfg(test)]
mod tests;

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};

use serde::{Deserialize, Serialize};
use specta_typescript::Number;
use sqlx::{FromRow, SqlitePool};
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;
use tokio::sync::OnceCell;

/// Event emitted during `library_import`/`library_import_folder`/
/// `library_import_paths` so the frontend can render a live progress bar
/// instead of blocking behind a single opaque "Working..." state.
const IMPORT_PROGRESS_EVENT: &str = "library://import-progress";

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LibraryTrack {
    pub id: String,
    pub path: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub format: String,
    pub duration: f64,
    #[specta(type = Number<i64>)]
    pub sample_rate: i64,
    #[specta(type = Number<i64>)]
    pub channels: i64,
    #[specta(type = Option<Number<i64>>)]
    pub bits_per_sample: Option<i64>,
    #[specta(type = Number<i64>)]
    pub size_bytes: i64,
    pub available: bool,
    pub unavailable_since: Option<String>,
    pub album_artist: String,
    #[specta(type = Option<Number<i64>>)]
    pub track_no: Option<i64>,
    #[specta(type = Option<Number<i64>>)]
    pub disc_no: Option<i64>,
    #[specta(type = Option<Number<i64>>)]
    pub year: Option<i64>,
    pub genre: String,
    pub comment: String,
    #[specta(type = Option<Number<i64>>)]
    pub bitrate_kbps: Option<i64>,
    /// When the track first entered the catalog (UTC, `YYYY-MM-DD HH:MM:SS`).
    /// Filled by the database, so extraction leaves it empty.
    #[sqlx(default)]
    pub added_at: String,
    /// 0 = unrated, 1-5 stars. User data, never read from files.
    #[sqlx(default)]
    #[specta(type = Number<i64>)]
    pub rating: i64,
    /// One of `catalog::COLORS`, or empty.
    #[sqlx(default)]
    pub color: String,
    #[sqlx(default)]
    #[specta(type = Number<i64>)]
    pub play_count: i64,
    #[sqlx(default)]
    pub last_played_at: Option<String>,
}

/// Sortable track-table columns. A closed enum, never user text, so the
/// ORDER BY below is assembled from fixed SQL only.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum SortColumn {
    Title,
    Artist,
    Album,
    Genre,
    Year,
    TrackNo,
    Duration,
    Format,
    Size,
    Bitrate,
    Added,
    Rating,
    Plays,
    LastPlayed,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct TrackSort {
    pub column: SortColumn,
    pub descending: bool,
}

/// Stable ORDER BY: the chosen column, blanks/NULLs always last, then title
/// and id so paging never repeats or skips a row between requests.
fn order_clause(sort: Option<&TrackSort>) -> String {
    const TIE_BREAK: &str = "title COLLATE NOCASE, id";
    let Some(sort) = sort else {
        return format!("ORDER BY {TIE_BREAK}");
    };
    let dir = if sort.descending { "DESC" } else { "ASC" };
    let text = |expr: &str| format!("({expr} = ''), {expr} COLLATE NOCASE {dir}");
    let nullable = |expr: &str| format!("({expr} IS NULL), {expr} {dir}");
    let primary = match sort.column {
        SortColumn::Title => return format!("ORDER BY title COLLATE NOCASE {dir}, id"),
        SortColumn::Artist => text(ARTIST_KEY),
        SortColumn::Album => format!(
            "{}, (disc_no IS NULL), disc_no, (track_no IS NULL), track_no",
            text("album")
        ),
        SortColumn::Genre => text("genre"),
        SortColumn::Year => nullable("year"),
        SortColumn::TrackNo => nullable("track_no"),
        SortColumn::Bitrate => nullable("bitrate_kbps"),
        SortColumn::Duration => format!("duration {dir}"),
        SortColumn::Format => format!("format {dir}"),
        SortColumn::Size => format!("size_bytes {dir}"),
        SortColumn::Added => format!("added_at {dir}"),
        SortColumn::Rating => format!("rating {dir}"),
        SortColumn::Plays => format!("play_count {dir}"),
        SortColumn::LastPlayed => nullable("last_played_at"),
    };
    format!("ORDER BY {primary}, {TIE_BREAK}")
}

#[derive(Serialize, specta::Type)]
pub struct LibraryPage {
    pub tracks: Vec<LibraryTrack>,
    #[specta(type = Number<i64>)]
    pub total: i64,
}

#[derive(Debug, Serialize, specta::Type)]
pub struct ImportFailure {
    pub path: String,
    pub error: String,
}

#[derive(Serialize, specta::Type, Default)]
pub struct ImportResult {
    #[specta(type = Number<usize>)]
    pub imported: usize,
    /// Files walked (folder import / drag-drop) that were neither imported
    /// nor errored -- unsupported extensions, silently ignored before this
    /// counter existed.
    #[specta(type = Number<usize>)]
    pub skipped: usize,
    pub errors: Vec<ImportFailure>,
    /// True when `library_import_cancel` interrupted the loop before every
    /// path was processed. Paths not yet reached are neither imported,
    /// skipped nor counted as errors.
    pub cancelled: bool,
}

/// Progress event payload for `IMPORT_PROGRESS_EVENT`. `current_path` is
/// `None` on the final (100%) event.
#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ImportProgress {
    #[specta(type = Number<usize>)]
    pub done: usize,
    #[specta(type = Number<usize>)]
    pub total: usize,
    #[specta(type = Number<usize>)]
    pub imported: usize,
    #[specta(type = Number<usize>)]
    pub failed: usize,
    #[specta(type = Number<usize>)]
    pub skipped: usize,
    pub current_path: Option<String>,
}

/// What a browse tab groups by.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum FacetKind {
    Artists,
    Albums,
    Genres,
    Folders,
}

/// One group in a browse tab. For albums `secondary` is the album artist.
#[derive(Debug, Clone, Serialize, specta::Type, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct FacetGroup {
    pub name: String,
    pub secondary: String,
    #[specta(type = Option<Number<i64>>)]
    pub year: Option<i64>,
    #[specta(type = Number<i64>)]
    pub track_count: i64,
    pub duration_sec: f64,
    #[specta(type = Number<i64>)]
    pub size_bytes: i64,
}

/// Narrows the track list to one group from `library_facets`.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FacetFilter {
    pub kind: FacetKind,
    pub value: String,
    /// Album artist, for `Albums`.
    pub secondary: Option<String>,
}

/// Everything in the catalog, for the "on this device" totals line --
/// deliberately separate from cloud storage usage.
#[derive(Debug, Serialize, specta::Type, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LibraryTotals {
    #[specta(type = Number<i64>)]
    pub track_count: i64,
    pub duration_sec: f64,
    #[specta(type = Number<i64>)]
    pub size_bytes: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum Availability {
    Available,
    Missing,
}

/// Range and attribute filters that combine with search and a browse group.
/// Every field is optional; an unset field never restricts anything.
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct TrackFilters {
    pub year_min: Option<i32>,
    pub year_max: Option<i32>,
    /// Seconds.
    pub duration_min: Option<f64>,
    pub duration_max: Option<f64>,
    pub bitrate_min: Option<i32>,
    #[serde(default)]
    pub formats: Vec<String>,
    pub root_id: Option<String>,
    /// `YYYY-MM-DD`; tracks added on or after this day.
    pub added_since: Option<String>,
    pub availability: Option<Availability>,
    /// At least this many stars (1-5).
    pub rating_min: Option<i32>,
    /// One of `catalog::COLORS`.
    pub color: Option<String>,
    /// Tracks carrying this tag (case-insensitive).
    pub tag: Option<String>,
}

/// Values available to build filter controls from the current catalog.
#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FilterOptions {
    pub formats: Vec<String>,
    pub year_min: Option<i32>,
    pub year_max: Option<i32>,
}

/// A bound WHERE parameter (filters mix text, integers and reals).
#[derive(Debug, Clone)]
enum Bind {
    Text(String),
    Int(i64),
    Real(f64),
}

macro_rules! bind_all {
    ($query:expr, $binds:expr) => {{
        let mut query = $query;
        for value in $binds {
            query = match value {
                Bind::Text(v) => query.bind(v.clone()),
                Bind::Int(v) => query.bind(*v),
                Bind::Real(v) => query.bind(*v),
            };
        }
        query
    }};
}

/// Everything that decides which tracks match and in what order.
#[derive(Debug, Clone, Copy, Default)]
pub struct ListQuery<'a> {
    pub search: &'a str,
    pub filter: Option<&'a FacetFilter>,
    pub filters: Option<&'a TrackFilters>,
    pub sort: Option<&'a TrackSort>,
}

/// Grouping key shared by the artist facet, the album facet and their
/// filters. Album artist wins over track artist so compilations stay
/// together. Keep identical to `0005_browse_indexes.sql`.
const ARTIST_KEY: &str = "COALESCE(NULLIF(album_artist, ''), NULLIF(artist, ''), '')";

/// Directory part of `path`, trailing separator included (either style).
fn folder_of(path: &str) -> String {
    match path.rfind(['/', '\\']) {
        Some(index) => path[..=index].to_owned(),
        None => String::new(),
    }
}

/// A folder the user asked the library to keep in sync. `track_count` /
/// `missing_count` are aggregated on read; `available` is whether the folder
/// itself currently exists on disk (false for a disconnected drive).
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LibraryRoot {
    pub id: String,
    pub path: String,
    pub created_at: String,
    pub last_scanned_at: Option<String>,
    #[specta(type = Number<i64>)]
    pub track_count: i64,
    #[specta(type = Number<i64>)]
    pub missing_count: i64,
    #[sqlx(skip)]
    pub available: bool,
}

/// Outcome of scanning one or more roots: new files imported, plus how many
/// already-known tracks changed availability.
#[derive(Serialize, specta::Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct RootScanResult {
    #[specta(type = Number<usize>)]
    pub imported: usize,
    #[specta(type = Number<usize>)]
    pub skipped: usize,
    /// Known tracks whose file is no longer there.
    #[specta(type = Number<usize>)]
    pub missing: usize,
    /// Previously-missing tracks whose file is back.
    #[specta(type = Number<usize>)]
    pub recovered: usize,
    pub errors: Vec<ImportFailure>,
    pub cancelled: bool,
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct RelinkRootResult {
    pub root: LibraryRoot,
    /// Tracks re-pointed at the new folder (same relative path and size).
    #[specta(type = Number<usize>)]
    pub relinked: usize,
    /// Tracks with no proven match in the new folder; left untouched.
    #[specta(type = Number<usize>)]
    pub unmatched: usize,
}

pub(crate) fn is_supported_audio_file(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|value| value.to_str())
            .map(str::to_ascii_lowercase)
            .as_deref(),
        Some("flac") | Some("wav")
    )
}

/// Recursively walks `root`, returning supported audio files (stable path
/// order, symlinks not followed) plus a count of files seen but skipped
/// (present but unsupported extension).
fn collect_audio_paths_with_skipped(root: &Path) -> Result<(Vec<PathBuf>, usize), String> {
    if !root.is_dir() {
        return Err("Selected path is not a folder".into());
    }
    let mut paths = Vec::new();
    let mut skipped = 0usize;
    let mut pending = vec![root.to_path_buf()];
    while let Some(directory) = pending.pop() {
        for entry in std::fs::read_dir(&directory).map_err(|err| err.to_string())? {
            let entry = entry.map_err(|err| err.to_string())?;
            let path = entry.path();
            let file_type = entry.file_type().map_err(|err| err.to_string())?;
            if file_type.is_dir() {
                pending.push(path);
            } else if file_type.is_file() {
                if is_supported_audio_file(&path) {
                    paths.push(path);
                } else {
                    skipped += 1;
                }
            }
        }
    }
    paths.sort();
    Ok((paths, skipped))
}

#[cfg(test)]
fn collect_audio_paths(root: &Path) -> Result<Vec<PathBuf>, String> {
    collect_audio_paths_with_skipped(root).map(|(paths, _skipped)| paths)
}

#[derive(Default)]
pub struct LibraryState {
    pool: OnceCell<SqlitePool>,
    /// Checked once per batch inside `import_paths_with_progress`; set by
    /// `library_import_cancel`, reset at the start of every new import.
    cancel_import: AtomicBool,
    /// Same for the on-demand duplicate hashing job.
    cancel_hash: AtomicBool,
}

/// Migration and backup policy (desktop-pro-library.md Phase 0):
///
/// - **Migrations** are plain numbered `sqlx::migrate!` SQL files under
///   `./migrations/library/` (`0001_init.sql`, `0002_availability.sql`, ...),
///   applied forward-only, in order, exactly once each, tracked by sqlx in
///   its own `_sqlx_migrations` table inside `library.db` itself -- the same
///   mechanism `./migrations/history/` already uses for play history, so
///   there's one convention across both native catalogs, not two. A new
///   column/table is always additive with a `DEFAULT` (see `0002`'s
///   `available`/`unavailable_since`) so older code paths and existing rows
///   keep working; there is no down-migration story, matching sqlx's own
///   forward-only model -- rolling back means restoring a file backup below,
///   not running a generated inverse SQL file.
/// - **Backup** of the *catalog* is `backup.rs` (a portable JSON export of
///   roots, edits, ratings, tags and playlists, restorable with a root
///   mapping); it does not contain audio. The database file itself is one
///   file (WAL mode, so a live copy also needs the `-wal`/`-shm` sidecars, or
///   a `VACUUM INTO` snapshot) under the OS app-data dir resolved in `pool()`
///   below. There is still no down-migration: rolling back means restoring a
///   backup, not running a generated inverse SQL file.
pub async fn open(path: &Path) -> Result<SqlitePool, String> {
    let pool = crate::db::open(path).await?;
    sqlx::migrate!("./migrations/library")
        .run(&pool)
        .await
        .map_err(|err| err.to_string())?;
    Ok(pool)
}

async fn pool(app: &tauri::AppHandle) -> Result<SqlitePool, String> {
    let state = app.state::<LibraryState>();
    let pool = state
        .pool
        .get_or_try_init(|| async {
            let path = app
                .path()
                .app_data_dir()
                .map_err(|err| err.to_string())?
                .join("databases/library.db");
            open(&path).await
        })
        .await?;
    Ok(pool.clone())
}

/// Files read + written per batch. Tag extraction runs concurrently across a
/// batch (each on the blocking pool) and the whole batch commits in one
/// transaction: one WAL commit per 16 files instead of one per file, which is
/// what makes a several-thousand-file import fast. Also the granularity of
/// progress events and cancellation.
const IMPORT_BATCH: usize = 16;

async fn insert_track(
    conn: &mut sqlx::SqliteConnection,
    track: &LibraryTrack,
    root_id: Option<&str>,
) -> Result<(), sqlx::Error> {
    // A successful (re)import proves the file exists right now -- clear
    // any stale missing state a prior resolve/re-scan had persisted,
    // same self-heal `resolve_path` does on a direct resolve. Re-importing
    // an ad hoc track under a root adopts it into that root; an existing
    // root membership is never stolen.
    sqlx::query("INSERT INTO library_tracks (id,path,title,artist,album,format,duration,sample_rate,channels,bits_per_sample,size_bytes,root_id,album_artist,track_no,disc_no,year,genre,comment,bitrate_kbps,folder) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(path) DO UPDATE SET title=excluded.title, artist=excluded.artist, album=excluded.album, album_artist=excluded.album_artist, track_no=excluded.track_no, disc_no=excluded.disc_no, year=excluded.year, genre=excluded.genre, comment=excluded.comment, bitrate_kbps=excluded.bitrate_kbps, folder=excluded.folder, format=excluded.format, duration=excluded.duration, sample_rate=excluded.sample_rate, channels=excluded.channels, bits_per_sample=excluded.bits_per_sample, size_bytes=excluded.size_bytes, available=1, unavailable_since=NULL, root_id=COALESCE(library_tracks.root_id, excluded.root_id)")
        .bind(&track.id).bind(&track.path).bind(&track.title).bind(&track.artist).bind(&track.album).bind(&track.format).bind(track.duration).bind(track.sample_rate).bind(track.channels).bind(track.bits_per_sample).bind(track.size_bytes).bind(root_id)
        .bind(&track.album_artist).bind(track.track_no).bind(track.disc_no).bind(track.year).bind(&track.genre).bind(&track.comment).bind(track.bitrate_kbps).bind(folder_of(&track.path))
        .execute(&mut *conn).await?;
    catalog::reapply_overrides(conn, track).await?;
    Ok(())
}

pub(crate) async fn import_batch(
    pool: &SqlitePool,
    paths: Vec<PathBuf>,
    root_id: Option<&str>,
    result: &mut ImportResult,
) {
    let reads = futures::future::join_all(paths.into_iter().map(|path| async move {
        let display = path.to_string_lossy().into_owned();
        tauri::async_runtime::spawn_blocking(move || metadata::read(&path))
            .await
            .map_err(|err| err.to_string())
            .and_then(|track| track)
            .map_err(|error| ImportFailure {
                path: display,
                error,
            })
    }))
    .await;
    let mut tracks = Vec::with_capacity(reads.len());
    for read in reads {
        match read {
            Ok(track) => tracks.push(track),
            Err(failure) => result.errors.push(failure),
        }
    }
    if tracks.is_empty() {
        return;
    }
    let mut tx = match pool.begin().await {
        Ok(tx) => tx,
        Err(error) => {
            for track in tracks {
                result.errors.push(ImportFailure {
                    path: track.path,
                    error: error.to_string(),
                });
            }
            return;
        }
    };
    let mut written = 0usize;
    for track in &tracks {
        match insert_track(&mut tx, track, root_id).await {
            Ok(()) => written += 1,
            Err(error) => result.errors.push(ImportFailure {
                path: track.path.clone(),
                error: error.to_string(),
            }),
        }
    }
    match tx.commit().await {
        Ok(()) => result.imported += written,
        Err(error) => result.errors.push(ImportFailure {
            path: tracks.first().map(|t| t.path.clone()).unwrap_or_default(),
            error: format!("Could not save {written} tracks: {error}"),
        }),
    }
}

pub async fn import_paths(pool: &SqlitePool, paths: Vec<PathBuf>) -> ImportResult {
    let mut result = ImportResult::default();
    for batch in paths.chunks(IMPORT_BATCH) {
        import_batch(pool, batch.to_vec(), None, &mut result).await;
    }
    result
}

/// Same import as `import_paths`, plus a `skipped` starting count (files
/// already excluded during folder walking), an optional root to tag/adopt
/// tracks into and, for the Tauri command-driven paths, a live
/// `IMPORT_PROGRESS_EVENT` per batch and cooperative cancellation via
/// `LibraryState::cancel_import` (checked between batches).
async fn import_paths_with_progress(
    app: &tauri::AppHandle,
    pool: &SqlitePool,
    paths: Vec<PathBuf>,
    skipped: usize,
    root_id: Option<&str>,
) -> ImportResult {
    let total = paths.len();
    let mut result = ImportResult {
        skipped,
        ..Default::default()
    };
    let mut done = 0usize;
    for batch in paths.chunks(IMPORT_BATCH) {
        if app
            .state::<LibraryState>()
            .cancel_import
            .load(Ordering::Relaxed)
        {
            result.cancelled = true;
            break;
        }
        let _ = app.emit(
            IMPORT_PROGRESS_EVENT,
            ImportProgress {
                done,
                total,
                imported: result.imported,
                failed: result.errors.len(),
                skipped: result.skipped,
                current_path: batch
                    .first()
                    .map(|path| path.to_string_lossy().into_owned()),
            },
        );
        import_batch(pool, batch.to_vec(), root_id, &mut result).await;
        done += batch.len();
    }
    let _ = app.emit(
        IMPORT_PROGRESS_EVENT,
        ImportProgress {
            done: total,
            total,
            imported: result.imported,
            failed: result.errors.len(),
            skipped: result.skipped,
            current_path: None,
        },
    );
    result
}

/// Builds the FTS5 trigram MATCH expression for a search box value: every
/// whitespace-separated term becomes a quoted substring that must appear in
/// some column (AND across terms). Trigram indexes can't answer terms under
/// 3 characters, so those searches return `None` and use the LIKE scan.
fn fts_match_query(search: &str) -> Option<String> {
    let terms: Vec<&str> = search.split_whitespace().collect();
    if terms.is_empty() || terms.iter().any(|term| term.chars().count() < 3) {
        return None;
    }
    Some(
        terms
            .iter()
            .map(|term| format!("\"{}\"", term.replace('"', "\"\"")))
            .collect::<Vec<_>>()
            .join(" "),
    )
}

pub async fn list(pool: &SqlitePool, search: &str, offset: i64) -> Result<LibraryPage, String> {
    list_filtered(pool, search, None, None, offset).await
}

/// WHERE clause (with its bound text parameters) for a search and/or browse
/// group. Shared by paging and by select-all so both always agree on what
/// "matching" means.
fn where_clause(query: &ListQuery) -> (String, Vec<Bind>) {
    let search = query.search.trim();
    let filter = query.filter;
    let mut conditions: Vec<String> = Vec::new();
    let mut binds: Vec<Bind> = Vec::new();
    if let Some(filter) = filter {
        match filter.kind {
            FacetKind::Artists => {
                conditions.push(format!("{ARTIST_KEY} COLLATE NOCASE = ?"));
                binds.push(Bind::Text(filter.value.clone()));
            }
            FacetKind::Albums => {
                conditions.push("album COLLATE NOCASE = ?".into());
                binds.push(Bind::Text(filter.value.clone()));
                conditions.push(format!("{ARTIST_KEY} COLLATE NOCASE = ?"));
                binds.push(Bind::Text(filter.secondary.clone().unwrap_or_default()));
            }
            FacetKind::Genres => {
                conditions.push("genre COLLATE NOCASE = ?".into());
                binds.push(Bind::Text(filter.value.clone()));
            }
            FacetKind::Folders => {
                conditions.push("folder = ?".into());
                binds.push(Bind::Text(filter.value.clone()));
            }
        }
    }
    if !search.is_empty() {
        if let Some(query) = fts_match_query(search) {
            conditions.push(
                "rowid IN (SELECT rowid FROM library_tracks_fts WHERE library_tracks_fts MATCH ?)"
                    .into(),
            );
            binds.push(Bind::Text(query));
        } else {
            let like = format!(
                "%{}%",
                search
                    .replace('\\', "\\\\")
                    .replace('%', "\\%")
                    .replace('_', "\\_")
            );
            conditions.push("(title LIKE ? ESCAPE '\\' OR artist LIKE ? ESCAPE '\\' OR album LIKE ? ESCAPE '\\' OR path LIKE ? ESCAPE '\\')".into());
            binds.extend(std::iter::repeat(Bind::Text(like)).take(4));
        }
    }
    if let Some(f) = query.filters {
        if let Some(v) = f.year_min {
            conditions.push("year >= ?".into());
            binds.push(Bind::Int(v.into()));
        }
        if let Some(v) = f.year_max {
            conditions.push("year <= ?".into());
            binds.push(Bind::Int(v.into()));
        }
        if let Some(v) = f.duration_min {
            conditions.push("duration >= ?".into());
            binds.push(Bind::Real(v));
        }
        if let Some(v) = f.duration_max {
            conditions.push("duration <= ?".into());
            binds.push(Bind::Real(v));
        }
        if let Some(v) = f.bitrate_min {
            conditions.push("bitrate_kbps >= ?".into());
            binds.push(Bind::Int(v.into()));
        }
        if !f.formats.is_empty() {
            let marks = vec!["?"; f.formats.len()].join(",");
            conditions.push(format!("format IN ({marks})"));
            binds.extend(f.formats.iter().map(|v| Bind::Text(v.to_ascii_lowercase())));
        }
        if let Some(v) = &f.root_id {
            conditions.push("root_id = ?".into());
            binds.push(Bind::Text(v.clone()));
        }
        if let Some(v) = &f.added_since {
            conditions.push("added_at >= ?".into());
            binds.push(Bind::Text(v.clone()));
        }
        match f.availability {
            Some(Availability::Available) => conditions.push("available = 1".into()),
            Some(Availability::Missing) => conditions.push("available = 0".into()),
            None => {}
        }
        if let Some(v) = f.rating_min.filter(|v| *v > 0) {
            conditions.push("rating >= ?".into());
            binds.push(Bind::Int(v.into()));
        }
        if let Some(v) = f.color.as_ref().filter(|v| !v.is_empty()) {
            conditions.push("color = ?".into());
            binds.push(Bind::Text(v.clone()));
        }
        if let Some(v) = f.tag.as_ref().filter(|v| !v.trim().is_empty()) {
            conditions.push("id IN (SELECT tt.track_id FROM library_track_tags tt JOIN library_tags t ON t.id = tt.tag_id WHERE t.name = ?)".into());
            binds.push(Bind::Text(v.trim().to_owned()));
        }
    }
    let where_sql = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };
    (where_sql, binds)
}

/// One page of tracks (100) matching `query`, in its sort.
pub async fn list_query(
    pool: &SqlitePool,
    query: &ListQuery<'_>,
    offset: i64,
) -> Result<LibraryPage, String> {
    let (where_sql, binds) = where_clause(query);
    let count_sql = format!("SELECT COUNT(*) FROM library_tracks {where_sql}");
    let total = bind_all!(sqlx::query_scalar::<_, i64>(&count_sql), &binds)
        .fetch_one(pool)
        .await
        .map_err(|err| err.to_string())?;
    let page_sql = format!(
        "SELECT * FROM library_tracks {where_sql} {} LIMIT 100 OFFSET ?",
        order_clause(query.sort)
    );
    let tracks = bind_all!(sqlx::query_as::<_, LibraryTrack>(&page_sql), &binds)
        .bind(offset.max(0))
        .fetch_all(pool)
        .await
        .map_err(|err| err.to_string())?;
    Ok(LibraryPage { tracks, total })
}

pub async fn list_filtered(
    pool: &SqlitePool,
    search: &str,
    filter: Option<&FacetFilter>,
    sort: Option<&TrackSort>,
    offset: i64,
) -> Result<LibraryPage, String> {
    let query = ListQuery {
        search,
        filter,
        filters: None,
        sort,
    };
    list_query(pool, &query, offset).await
}

/// Every id matching `query`, in exactly the order paging shows them -- the
/// basis of "select all N" and "play all" across pages.
pub async fn matching_ids_query(
    pool: &SqlitePool,
    query: &ListQuery<'_>,
) -> Result<Vec<String>, String> {
    let (where_sql, binds) = where_clause(query);
    let sql = format!(
        "SELECT id FROM library_tracks {where_sql} {}",
        order_clause(query.sort)
    );
    bind_all!(sqlx::query_scalar::<_, String>(&sql), &binds)
        .fetch_all(pool)
        .await
        .map_err(|err| err.to_string())
}

pub async fn matching_ids(
    pool: &SqlitePool,
    search: &str,
    filter: Option<&FacetFilter>,
    sort: Option<&TrackSort>,
) -> Result<Vec<String>, String> {
    let query = ListQuery {
        search,
        filter,
        filters: None,
        sort,
    };
    matching_ids_query(pool, &query).await
}

pub async fn filter_options(pool: &SqlitePool) -> Result<FilterOptions, String> {
    let formats = sqlx::query_scalar::<_, String>(
        "SELECT DISTINCT format FROM library_tracks ORDER BY format",
    )
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?;
    let (year_min, year_max) = sqlx::query_as::<_, (Option<i32>, Option<i32>)>(
        "SELECT MIN(year), MAX(year) FROM library_tracks",
    )
    .fetch_one(pool)
    .await
    .map_err(|err| err.to_string())?;
    Ok(FilterOptions {
        formats,
        year_min,
        year_max,
    })
}

/// A track ready to hand to the player: its row plus the verified file path.
#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PlaybackItem {
    pub track: LibraryTrack,
    pub path: String,
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PlaybackBatch {
    /// Playable tracks, in the order the ids were given.
    pub items: Vec<PlaybackItem>,
    /// Requested tracks whose file is missing (now persisted as unavailable).
    #[specta(type = Number<usize>)]
    pub unavailable: usize,
}

/// Loads rows for `ids` (chunked under SQLite's variable limit), keeps the
/// requested order, checks each file exists in one blocking pass and persists
/// any availability change. Unknown ids are ignored.
pub async fn prepare_playback(pool: &SqlitePool, ids: &[String]) -> Result<PlaybackBatch, String> {
    let mut rows: std::collections::HashMap<String, LibraryTrack> =
        std::collections::HashMap::with_capacity(ids.len());
    for chunk in ids.chunks(500) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!("SELECT * FROM library_tracks WHERE id IN ({marks})");
        let mut query = sqlx::query_as::<_, LibraryTrack>(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        for track in query.fetch_all(pool).await.map_err(|err| err.to_string())? {
            rows.insert(track.id.clone(), track);
        }
    }
    let ordered: Vec<LibraryTrack> = ids.iter().filter_map(|id| rows.remove(id)).collect();
    let checked = tauri::async_runtime::spawn_blocking(move || {
        ordered
            .into_iter()
            .map(|track| {
                let exists = std::fs::metadata(&track.path)
                    .map(|meta| meta.is_file())
                    .unwrap_or(false);
                (track, exists)
            })
            .collect::<Vec<_>>()
    })
    .await
    .map_err(|err| err.to_string())?;
    let mut batch = PlaybackBatch {
        items: Vec::with_capacity(checked.len()),
        unavailable: 0,
    };
    for (track, exists) in checked {
        if exists != track.available {
            mark_availability(pool, &track.id, exists).await?;
        }
        if exists {
            batch.items.push(PlaybackItem {
                path: track.path.clone(),
                track,
            });
        } else {
            batch.unavailable += 1;
        }
    }
    Ok(batch)
}

/// Groups the whole catalog for a browse tab, straight from the indexes in
/// `0005_browse_indexes.sql`.
pub async fn facets(pool: &SqlitePool, kind: FacetKind) -> Result<Vec<FacetGroup>, String> {
    let totals = "COUNT(*) AS track_count, COALESCE(SUM(duration), 0.0) AS duration_sec, COALESCE(SUM(size_bytes), 0) AS size_bytes";
    let sql = match kind {
        FacetKind::Artists => format!("SELECT MIN({ARTIST_KEY}) AS name, '' AS secondary, NULL AS year, {totals} FROM library_tracks GROUP BY {ARTIST_KEY} COLLATE NOCASE ORDER BY name COLLATE NOCASE"),
        FacetKind::Albums => format!("SELECT MIN(album) AS name, MIN({ARTIST_KEY}) AS secondary, MAX(year) AS year, {totals} FROM library_tracks GROUP BY album COLLATE NOCASE, {ARTIST_KEY} COLLATE NOCASE ORDER BY name COLLATE NOCASE, secondary COLLATE NOCASE"),
        FacetKind::Genres => format!("SELECT MIN(genre) AS name, '' AS secondary, NULL AS year, {totals} FROM library_tracks GROUP BY genre COLLATE NOCASE ORDER BY name COLLATE NOCASE"),
        FacetKind::Folders => format!("SELECT folder AS name, '' AS secondary, NULL AS year, {totals} FROM library_tracks GROUP BY folder ORDER BY name COLLATE NOCASE"),
    };
    sqlx::query_as::<_, FacetGroup>(&sql)
        .fetch_all(pool)
        .await
        .map_err(|err| err.to_string())
}

pub async fn totals(pool: &SqlitePool) -> Result<LibraryTotals, String> {
    sqlx::query_as::<_, LibraryTotals>(
        "SELECT COUNT(*) AS track_count, COALESCE(SUM(duration), 0.0) AS duration_sec, COALESCE(SUM(size_bytes), 0) AS size_bytes FROM library_tracks",
    )
    .fetch_one(pool)
    .await
    .map_err(|err| err.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn library_list(
    app: tauri::AppHandle,
    search: String,
    offset: i32,
    filter: Option<FacetFilter>,
    filters: Option<TrackFilters>,
    sort: Option<TrackSort>,
) -> Result<LibraryPage, String> {
    let query = ListQuery {
        search: &search,
        filter: filter.as_ref(),
        filters: filters.as_ref(),
        sort: sort.as_ref(),
    };
    list_query(&pool(&app).await?, &query, offset.into()).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_filter_options(app: tauri::AppHandle) -> Result<FilterOptions, String> {
    filter_options(&pool(&app).await?).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_matching_ids(
    app: tauri::AppHandle,
    search: String,
    filter: Option<FacetFilter>,
    filters: Option<TrackFilters>,
    sort: Option<TrackSort>,
) -> Result<Vec<String>, String> {
    let query = ListQuery {
        search: &search,
        filter: filter.as_ref(),
        filters: filters.as_ref(),
        sort: sort.as_ref(),
    };
    matching_ids_query(&pool(&app).await?, &query).await
}

/// Verifies and orders a batch of tracks for the player and grants the
/// asset protocol access to each file (same as `library_resolve`, in bulk).
#[tauri::command]
#[specta::specta]
pub async fn library_prepare_playback(
    app: tauri::AppHandle,
    ids: Vec<String>,
) -> Result<PlaybackBatch, String> {
    let batch = prepare_playback(&pool(&app).await?, &ids).await?;
    let scope = app.asset_protocol_scope();
    for item in &batch.items {
        scope.allow_file(&item.path).map_err(|err| err.to_string())?;
    }
    Ok(batch)
}

#[tauri::command]
#[specta::specta]
pub async fn library_facets(
    app: tauri::AppHandle,
    kind: FacetKind,
) -> Result<Vec<FacetGroup>, String> {
    facets(&pool(&app).await?, kind).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_totals(app: tauri::AppHandle) -> Result<LibraryTotals, String> {
    totals(&pool(&app).await?).await
}

fn reset_cancel_import(app: &tauri::AppHandle) {
    app.state::<LibraryState>()
        .cancel_import
        .store(false, Ordering::Relaxed);
}

#[tauri::command]
#[specta::specta]
pub async fn library_import(app: tauri::AppHandle) -> Result<ImportResult, String> {
    let dialog_app = app.clone();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        dialog_app
            .dialog()
            .file()
            .add_filter("FLAC and WAV audio", &["flac", "wav"])
            .blocking_pick_files()
    })
    .await
    .map_err(|err| err.to_string())?;
    let Some(files) = selected else {
        return Ok(ImportResult::default());
    };
    let paths = files
        .into_iter()
        .map(|file| file.into_path().map_err(|err| err.to_string()))
        .collect::<Result<Vec<_>, _>>()?;
    reset_cancel_import(&app);
    let pool = pool(&app).await?;
    Ok(import_paths_with_progress(&app, &pool, paths, 0, None).await)
}

#[tauri::command]
#[specta::specta]
pub async fn library_import_folder(app: tauri::AppHandle) -> Result<ImportResult, String> {
    let dialog_app = app.clone();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        dialog_app.dialog().file().blocking_pick_folder()
    })
    .await
    .map_err(|err| err.to_string())?;
    let Some(folder) = selected else {
        return Ok(ImportResult::default());
    };
    let root = folder.into_path().map_err(|err| err.to_string())?;
    let (paths, skipped) =
        tauri::async_runtime::spawn_blocking(move || collect_audio_paths_with_skipped(&root))
            .await
            .map_err(|err| err.to_string())??;
    reset_cancel_import(&app);
    let pool = pool(&app).await?;
    Ok(import_paths_with_progress(&app, &pool, paths, skipped, None).await)
}

/// Imports an explicit list of files/folders -- the entry point for native
/// drag-drop, which hands over absolute paths directly rather than going
/// through a picker dialog. Directories are walked the same way folder
/// import does; unsupported files are counted as skipped, not errored.
#[tauri::command]
#[specta::specta]
pub async fn library_import_paths(
    app: tauri::AppHandle,
    paths: Vec<String>,
) -> Result<ImportResult, String> {
    reset_cancel_import(&app);
    let mut collected = Vec::new();
    let mut skipped = 0usize;
    let mut result = ImportResult::default();
    for raw in paths {
        let path = PathBuf::from(&raw);
        match tokio::fs::metadata(&path).await {
            Ok(meta) if meta.is_dir() => {
                let dir = path.clone();
                match tauri::async_runtime::spawn_blocking(move || {
                    collect_audio_paths_with_skipped(&dir)
                })
                .await
                .map_err(|err| err.to_string())
                {
                    Ok(Ok((mut found, found_skipped))) => {
                        collected.append(&mut found);
                        skipped += found_skipped;
                    }
                    Ok(Err(error)) | Err(error) => result.errors.push(ImportFailure {
                        path: raw,
                        error,
                    }),
                }
            }
            Ok(meta) if meta.is_file() => {
                if is_supported_audio_file(&path) {
                    collected.push(path);
                } else {
                    skipped += 1;
                }
            }
            _ => result.errors.push(ImportFailure {
                path: raw,
                error: "Path not found".into(),
            }),
        }
    }
    collected.sort();
    let pool = pool(&app).await?;
    let imported = import_paths_with_progress(&app, &pool, collected, skipped, None).await;
    result.imported += imported.imported;
    result.skipped += imported.skipped;
    result.errors.extend(imported.errors);
    result.cancelled = imported.cancelled;
    Ok(result)
}

/// Interrupts the in-flight import loop before its next file. Checked
/// cooperatively, so a file already being read/inserted still completes.
#[tauri::command]
#[specta::specta]
pub async fn library_import_cancel(app: tauri::AppHandle) -> Result<(), String> {
    app.state::<LibraryState>()
        .cancel_import
        .store(true, Ordering::Relaxed);
    Ok(())
}

pub async fn resolve_path(pool: &SqlitePool, id: &str) -> Result<String, String> {
    let path = sqlx::query_scalar::<_, String>("SELECT path FROM library_tracks WHERE id=?")
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|err| err.to_string())?
        .ok_or("Track is not in the library")?;
    if !tokio::fs::try_exists(&path)
        .await
        .map_err(|err| err.to_string())?
    {
        mark_availability(pool, id, false).await?;
        return Err(
            "Original file is unavailable. Reconnect its drive or restore the file.".into(),
        );
    }
    // Self-heal: a track marked missing by an earlier resolve/re-scan is
    // available again (reconnected drive, restored file) -- clear the state
    // rather than leaving it stuck missing until a future Phase 1 re-scan.
    mark_availability(pool, id, true).await?;
    Ok(path)
}

/// Persists the availability state `resolve_path` (and, later, Phase 1's
/// re-scan) observes -- `unavailable_since` is set once on the transition to
/// missing and cleared on recovery, not bumped on every repeated failure.
async fn mark_availability(pool: &SqlitePool, id: &str, available: bool) -> Result<(), String> {
    if available {
        sqlx::query("UPDATE library_tracks SET available=1, unavailable_since=NULL WHERE id=? AND available=0")
            .bind(id).execute(pool).await.map_err(|err| err.to_string())?;
    } else {
        sqlx::query(
            "UPDATE library_tracks SET available=0, unavailable_since=? WHERE id=? AND available=1",
        )
        .bind(chrono::Utc::now().to_rfc3339())
        .bind(id)
        .execute(pool)
        .await
        .map_err(|err| err.to_string())?;
    }
    Ok(())
}

/// Tracks currently persisted as missing -- the primitive Phase 1's re-scan/
/// relink UI will list from; only reflects the last `resolve_path`/import
/// observation, not a live filesystem check (Phase 1's own job).
pub async fn list_unavailable(pool: &SqlitePool) -> Result<Vec<LibraryTrack>, String> {
    sqlx::query_as::<_, LibraryTrack>(
        "SELECT * FROM library_tracks WHERE available=0 ORDER BY unavailable_since DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())
}

pub async fn rescan_unavailable(pool: &SqlitePool) -> Result<Vec<LibraryTrack>, String> {
    let missing = list_unavailable(pool).await?;
    for track in &missing {
        let _ = resolve_path(pool, &track.id).await;
    }
    list_unavailable(pool).await
}

pub async fn remove(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM library_tracks WHERE id=?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|err| err.to_string())?;
    Ok(())
}

/// Removes many catalog rows in one transaction and returns how many
/// existed. Files on disk are never touched.
pub async fn remove_many(pool: &SqlitePool, ids: &[String]) -> Result<usize, String> {
    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;
    let mut removed = 0usize;
    for chunk in ids.chunks(500) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!("DELETE FROM library_tracks WHERE id IN ({marks})");
        let mut query = sqlx::query(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        removed += query
            .execute(&mut *tx)
            .await
            .map_err(|err| err.to_string())?
            .rows_affected() as usize;
    }
    tx.commit().await.map_err(|err| err.to_string())?;
    Ok(removed)
}

pub async fn relink(
    pool: &SqlitePool,
    id: &str,
    new_path: PathBuf,
) -> Result<LibraryTrack, String> {
    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM library_tracks WHERE id=?")
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(|err| err.to_string())?;
    if exists == 0 {
        return Err("Track is not in the library".into());
    }
    let extracted = tauri::async_runtime::spawn_blocking(move || metadata::read(&new_path))
        .await
        .map_err(|err| err.to_string())??;
    let updated = sqlx::query("UPDATE library_tracks SET path=?, title=?, artist=?, album=?, album_artist=?, track_no=?, disc_no=?, year=?, genre=?, comment=?, bitrate_kbps=?, folder=?, format=?, duration=?, sample_rate=?, channels=?, bits_per_sample=?, size_bytes=?, available=1, unavailable_since=NULL WHERE id=?")
        .bind(&extracted.path).bind(&extracted.title).bind(&extracted.artist).bind(&extracted.album).bind(&extracted.album_artist).bind(extracted.track_no).bind(extracted.disc_no).bind(extracted.year).bind(&extracted.genre).bind(&extracted.comment).bind(extracted.bitrate_kbps).bind(folder_of(&extracted.path)).bind(&extracted.format).bind(extracted.duration).bind(extracted.sample_rate).bind(extracted.channels).bind(extracted.bits_per_sample).bind(extracted.size_bytes)
        .bind(id)
        .execute(pool).await;
    if updated.is_ok() {
        let mut conn = pool.acquire().await.map_err(|err| err.to_string())?;
        catalog::reapply_overrides(&mut conn, &extracted).await.map_err(|err| err.to_string())?;
    }
    if let Err(error) = updated {
        let message = match error.as_database_error().map(|db| db.is_unique_violation()) {
            Some(true) => "This file is already in your library as a different track.".to_owned(),
            _ => error.to_string(),
        };
        return Err(message);
    }
    sqlx::query_as::<_, LibraryTrack>("SELECT * FROM library_tracks WHERE id=?")
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn library_resolve(app: tauri::AppHandle, id: String) -> Result<String, String> {
    let path = resolve_path(&pool(&app).await?, &id).await?;
    app.asset_protocol_scope()
        .allow_file(&path)
        .map_err(|err| err.to_string())?;
    Ok(path)
}

#[tauri::command]
#[specta::specta]
pub async fn library_remove(app: tauri::AppHandle, id: String) -> Result<(), String> {
    remove(&pool(&app).await?, &id).await
}

/// Reveals a track's original file in the OS file manager. Calls the
/// opener plugin's Rust API directly (`app.opener()`, bypassing the
/// IPC-scoped `reveal-item-in-dir` permission the same way `library_resolve`
/// bypasses the asset-protocol scope with a per-path `allow_file`) since the
/// user already granted access to this exact file by importing it -- a
/// static allow-list can't cover arbitrary import locations.
#[tauri::command]
#[specta::specta]
pub async fn library_reveal(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let path = resolve_path(&pool(&app).await?, &id).await?;
    app.opener()
        .reveal_item_in_dir(path)
        .map_err(|err| err.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn library_remove_many(
    app: tauri::AppHandle,
    ids: Vec<String>,
) -> Result<u32, String> {
    remove_many(&pool(&app).await?, &ids)
        .await
        .map(|removed| removed as u32)
}

#[tauri::command]
#[specta::specta]
pub async fn library_list_unavailable(app: tauri::AppHandle) -> Result<Vec<LibraryTrack>, String> {
    list_unavailable(&pool(&app).await?).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_rescan(app: tauri::AppHandle) -> Result<Vec<LibraryTrack>, String> {
    rescan_unavailable(&pool(&app).await?).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_relink(
    app: tauri::AppHandle,
    id: String,
) -> Result<Option<LibraryTrack>, String> {
    let dialog_app = app.clone();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        dialog_app
            .dialog()
            .file()
            .add_filter("FLAC and WAV audio", &["flac", "wav"])
            .blocking_pick_file()
    })
    .await
    .map_err(|err| err.to_string())?;
    let Some(file) = selected else {
        return Ok(None);
    };
    let path = file.into_path().map_err(|err| err.to_string())?;
    relink(&pool(&app).await?, &id, path).await.map(Some)
}

// --- Library roots -------------------------------------------------------

const ROOT_SELECT: &str = "SELECT r.id, r.path, r.created_at, r.last_scanned_at, \
    (SELECT COUNT(*) FROM library_tracks t WHERE t.root_id = r.id) AS track_count, \
    (SELECT COUNT(*) FROM library_tracks t WHERE t.root_id = r.id AND t.available = 0) AS missing_count \
    FROM library_roots r";

async fn with_root_availability(mut roots: Vec<LibraryRoot>) -> Vec<LibraryRoot> {
    for root in &mut roots {
        root.available = tokio::fs::metadata(&root.path)
            .await
            .map(|meta| meta.is_dir())
            .unwrap_or(false);
    }
    roots
}

pub async fn list_roots(pool: &SqlitePool) -> Result<Vec<LibraryRoot>, String> {
    let roots = sqlx::query_as::<_, LibraryRoot>(&format!("{ROOT_SELECT} ORDER BY r.path"))
        .fetch_all(pool)
        .await
        .map_err(|err| err.to_string())?;
    Ok(with_root_availability(roots).await)
}

pub async fn get_root(pool: &SqlitePool, id: &str) -> Result<LibraryRoot, String> {
    let root = sqlx::query_as::<_, LibraryRoot>(&format!("{ROOT_SELECT} WHERE r.id = ?"))
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|err| err.to_string())?
        .ok_or("Library root not found")?;
    Ok(with_root_availability(vec![root]).await.remove(0))
}

fn canonical_folder(path: &Path) -> Result<String, String> {
    let canonical = path.canonicalize().map_err(|err| err.to_string())?;
    if !canonical.is_dir() {
        return Err("Selected path is not a folder".into());
    }
    Ok(canonical.to_string_lossy().into_owned())
}

/// Registers `path` as a root (idempotent: an already-registered folder is
/// returned as-is). Does not scan; see `scan_root`.
pub async fn add_root(pool: &SqlitePool, path: &Path) -> Result<LibraryRoot, String> {
    let path = canonical_folder(path)?;
    let existing = sqlx::query_scalar::<_, String>("SELECT id FROM library_roots WHERE path = ?")
        .bind(&path)
        .fetch_optional(pool)
        .await
        .map_err(|err| err.to_string())?;
    let id = match existing {
        Some(id) => id,
        None => {
            let id = uuid::Uuid::new_v4().to_string();
            sqlx::query("INSERT INTO library_roots (id, path) VALUES (?, ?)")
                .bind(&id)
                .bind(&path)
                .execute(pool)
                .await
                .map_err(|err| err.to_string())?;
            id
        }
    };
    get_root(pool, &id).await
}

/// Stops tracking a root. Its tracks stay in the catalog (root_id becomes
/// NULL via ON DELETE SET NULL); nothing on disk is touched.
pub async fn remove_root(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM library_roots WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|err| err.to_string())?;
    Ok(())
}

/// Walks a root and returns supported files the catalog does not already
/// hold *as members of this root* (ad hoc imports under the folder are
/// re-read once so they get adopted), plus the unsupported-file count.
async fn discover_new_paths(
    pool: &SqlitePool,
    root: &LibraryRoot,
) -> Result<(Vec<PathBuf>, usize), String> {
    let folder = PathBuf::from(&root.path);
    let (walked, skipped) =
        tauri::async_runtime::spawn_blocking(move || collect_audio_paths_with_skipped(&folder))
            .await
            .map_err(|err| err.to_string())??;
    let known: std::collections::HashSet<String> =
        sqlx::query_scalar::<_, String>("SELECT path FROM library_tracks WHERE root_id = ?")
            .bind(&root.id)
            .fetch_all(pool)
            .await
            .map_err(|err| err.to_string())?
            .into_iter()
            .collect();
    let fresh = walked
        .into_iter()
        .filter(|path| !known.contains(path.to_string_lossy().as_ref()))
        .collect();
    Ok((fresh, skipped))
}

/// Re-checks every track in a root against the filesystem in one blocking
/// pass and persists the differences. Returns `(newly missing, recovered)`.
pub async fn refresh_root_availability(
    pool: &SqlitePool,
    root_id: &str,
) -> Result<(usize, usize), String> {
    let rows = sqlx::query_as::<_, (String, String, bool)>(
        "SELECT id, path, available FROM library_tracks WHERE root_id = ?",
    )
    .bind(root_id)
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?;
    let changed = tauri::async_runtime::spawn_blocking(move || {
        rows.into_iter()
            .filter_map(|(id, path, was_available)| {
                let exists = std::fs::metadata(&path).map(|m| m.is_file()).unwrap_or(false);
                (exists != was_available).then_some((id, exists))
            })
            .collect::<Vec<_>>()
    })
    .await
    .map_err(|err| err.to_string())?;
    if changed.is_empty() {
        return Ok((0, 0));
    }
    let now = chrono::Utc::now().to_rfc3339();
    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;
    let (mut missing, mut recovered) = (0usize, 0usize);
    for (id, exists) in changed {
        if exists {
            sqlx::query("UPDATE library_tracks SET available=1, unavailable_since=NULL WHERE id=?")
                .bind(&id)
                .execute(&mut *tx)
                .await
                .map_err(|err| err.to_string())?;
            recovered += 1;
        } else {
            sqlx::query("UPDATE library_tracks SET available=0, unavailable_since=? WHERE id=?")
                .bind(&now)
                .bind(&id)
                .execute(&mut *tx)
                .await
                .map_err(|err| err.to_string())?;
            missing += 1;
        }
    }
    tx.commit().await.map_err(|err| err.to_string())?;
    Ok((missing, recovered))
}

async fn scan_root(
    app: &tauri::AppHandle,
    pool: &SqlitePool,
    root: &LibraryRoot,
) -> RootScanResult {
    let mut result = RootScanResult::default();
    match discover_new_paths(pool, root).await {
        Ok((fresh, skipped)) => {
            let imported = import_paths_with_progress(app, pool, fresh, skipped, Some(&root.id)).await;
            result.imported = imported.imported;
            result.skipped = imported.skipped;
            result.errors = imported.errors;
            result.cancelled = imported.cancelled;
        }
        Err(error) => result.errors.push(ImportFailure {
            path: root.path.clone(),
            error,
        }),
    }
    if !result.cancelled {
        match refresh_root_availability(pool, &root.id).await {
            Ok((missing, recovered)) => {
                result.missing = missing;
                result.recovered = recovered;
            }
            Err(error) => result.errors.push(ImportFailure {
                path: root.path.clone(),
                error,
            }),
        }
        let _ = sqlx::query("UPDATE library_roots SET last_scanned_at = ? WHERE id = ?")
            .bind(chrono::Utc::now().to_rfc3339())
            .bind(&root.id)
            .execute(pool)
            .await;
    }
    result
}

/// Points a root (and every track proven to live under it) at a new folder.
/// A track is only re-pointed when the same relative path exists in the new
/// folder with the same byte size -- a proven relocation, never a guess.
/// Files the new folder doesn't prove are left untouched.
pub async fn relink_root(
    pool: &SqlitePool,
    id: &str,
    new_folder: &Path,
) -> Result<RelinkRootResult, String> {
    let root = get_root(pool, id).await?;
    let new_path = canonical_folder(new_folder)?;
    let taken = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM library_roots WHERE path = ? AND id != ?",
    )
    .bind(&new_path)
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|err| err.to_string())?;
    if taken > 0 {
        return Err("That folder is already a library root.".into());
    }
    let rows = sqlx::query_as::<_, (String, String, i64)>(
        "SELECT id, path, size_bytes FROM library_tracks WHERE root_id = ?",
    )
    .bind(id)
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?;
    let old_root = PathBuf::from(&root.path);
    let new_root = PathBuf::from(&new_path);
    let total = rows.len();
    let matches = tauri::async_runtime::spawn_blocking(move || {
        rows.into_iter()
            .filter_map(|(track_id, path, size)| {
                let relative = Path::new(&path).strip_prefix(&old_root).ok()?;
                let candidate = new_root.join(relative);
                let meta = std::fs::metadata(&candidate).ok()?;
                (meta.is_file() && meta.len() as i64 == size)
                    .then(|| (track_id, candidate.to_string_lossy().into_owned()))
            })
            .collect::<Vec<_>>()
    })
    .await
    .map_err(|err| err.to_string())?;
    if total > 0 && matches.is_empty() {
        return Err(format!(
            "None of this root's {total} tracks were found in that folder (files are matched by relative path and size)."
        ));
    }
    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;
    let mut relinked = 0usize;
    for (track_id, path) in matches {
        let updated = sqlx::query(
            "UPDATE library_tracks SET path=?, folder=?, available=1, unavailable_since=NULL WHERE id=?",
        )
        .bind(&path)
        .bind(folder_of(&path))
        .bind(&track_id)
        .execute(&mut *tx)
        .await;
        // A path already owned by another catalog row is a conflict, not a
        // relink: leave that track alone (counted as unmatched).
        if updated.is_ok() {
            relinked += 1;
        }
    }
    sqlx::query("UPDATE library_roots SET path = ? WHERE id = ?")
        .bind(&new_path)
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;
    tx.commit().await.map_err(|err| err.to_string())?;
    Ok(RelinkRootResult {
        root: get_root(pool, id).await?,
        relinked,
        unmatched: total - relinked,
    })
}

#[tauri::command]
#[specta::specta]
pub async fn library_list_roots(app: tauri::AppHandle) -> Result<Vec<LibraryRoot>, String> {
    list_roots(&pool(&app).await?).await
}

/// Folder picker -> register as root -> initial scan (imports everything
/// under it, tagged to the root).
#[tauri::command]
#[specta::specta]
pub async fn library_add_root(app: tauri::AppHandle) -> Result<Option<RootScanResult>, String> {
    let dialog_app = app.clone();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        dialog_app.dialog().file().blocking_pick_folder()
    })
    .await
    .map_err(|err| err.to_string())?;
    let Some(folder) = selected else {
        return Ok(None);
    };
    let folder = folder.into_path().map_err(|err| err.to_string())?;
    let pool = pool(&app).await?;
    let root = add_root(&pool, &folder).await?;
    reset_cancel_import(&app);
    Ok(Some(scan_root(&app, &pool, &root).await))
}

#[tauri::command]
#[specta::specta]
pub async fn library_remove_root(app: tauri::AppHandle, id: String) -> Result<(), String> {
    remove_root(&pool(&app).await?, &id).await
}

/// Re-scans every root: imports files that appeared since the last scan and
/// refreshes missing/recovered state. Idempotent -- a second run with no
/// filesystem changes imports and changes nothing.
#[tauri::command]
#[specta::specta]
pub async fn library_rescan_roots(app: tauri::AppHandle) -> Result<RootScanResult, String> {
    let pool = pool(&app).await?;
    reset_cancel_import(&app);
    let mut total = RootScanResult::default();
    for root in list_roots(&pool).await? {
        let scanned = scan_root(&app, &pool, &root).await;
        total.imported += scanned.imported;
        total.skipped += scanned.skipped;
        total.missing += scanned.missing;
        total.recovered += scanned.recovered;
        total.errors.extend(scanned.errors);
        if scanned.cancelled {
            total.cancelled = true;
            break;
        }
    }
    Ok(total)
}

#[tauri::command]
#[specta::specta]
pub async fn library_relink_root(
    app: tauri::AppHandle,
    id: String,
) -> Result<Option<RelinkRootResult>, String> {
    let dialog_app = app.clone();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        dialog_app.dialog().file().blocking_pick_folder()
    })
    .await
    .map_err(|err| err.to_string())?;
    let Some(folder) = selected else {
        return Ok(None);
    };
    let folder = folder.into_path().map_err(|err| err.to_string())?;
    relink_root(&pool(&app).await?, &id, &folder)
        .await
        .map(Some)
}
