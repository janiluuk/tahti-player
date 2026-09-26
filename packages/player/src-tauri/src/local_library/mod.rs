//! The desktop music library: catalog database, import, queries, roots and
//! everything built on them. `LibraryTrack`, the shared state and the database
//! open/recovery path live here; the rest is split by concern:
//! `import` (folder walk + batched insert), `query` (sort/filter/facets/search),
//! `roots` (watched folders), `tracks` (availability/relink), plus the feature
//! modules below.

pub mod analysis;
pub mod analysis_dsp;
pub mod backup;
pub mod catalog;
pub mod import;
pub mod import_jobs;
pub mod itunes_import;
pub mod itunes_xml;
pub mod m3u;
mod metadata;
pub mod organize;
pub mod playlists;
pub mod provider_import;
pub mod provider_space;
pub mod query;
pub mod reconcile;
pub mod roots;
pub mod smart_playlists;
pub mod tag_writer;
pub mod tracks;
pub mod watcher;

pub use import::*;
pub use import_jobs::{discard_pending_imports, pending_imports, PendingImport};
pub use query::*;
pub use roots::*;
pub use tracks::*;

#[cfg(test)]
mod analysis_tests;
#[cfg(test)]
mod catalog_tests;
#[cfg(test)]
mod backup_tests;
#[cfg(test)]
mod tag_writer_tests;
#[cfg(test)]
mod import_tests;
#[cfg(test)]
mod import_jobs_tests;
#[cfg(test)]
mod itunes_tests;
#[cfg(test)]
mod provider_import_tests;
#[cfg(test)]
mod m3u_tests;
#[cfg(test)]
mod open_tests;
#[cfg(test)]
mod playlists_tests;
#[cfg(test)]
mod query_tests;
#[cfg(test)]
mod reconcile_tests;
#[cfg(test)]
mod roots_tests;
#[cfg(test)]
mod test_support;
#[cfg(test)]
mod tracks_tests;
#[cfg(test)]
mod profile_tests;

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use serde::{Deserialize, Serialize};
use specta_typescript::Number;
use sqlx::{FromRow, SqlitePool};
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;
use tokio::sync::OnceCell;

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
    /// Effective BPM and key (user correction > file tag > estimate); see
    /// `analysis.rs`. Empty until known.
    #[sqlx(default)]
    pub bpm: Option<f64>,
    #[sqlx(default)]
    pub musical_key: Option<String>,
    #[sqlx(default)]
    pub loudness_lufs: Option<f64>,
    #[sqlx(default)]
    pub analyzed: bool,
}

/// Directory part of `path`, trailing separator included (either style).
fn folder_of(path: &str) -> String {
    match path.rfind(['/', '\\']) {
        Some(index) => path[..=index].to_owned(),
        None => String::new(),
    }
}

#[derive(Default)]
pub struct LibraryState {
    pool: OnceCell<SqlitePool>,
    /// Checked once per batch inside `import_paths_with_progress`; set by
    /// `library_import_cancel`, reset at the start of every new import.
    cancel_import: AtomicBool,
    /// Same for the on-demand duplicate hashing job.
    cancel_hash: AtomicBool,
    /// Checked per downloaded chunk by `provider_import`; set by
    /// `library_provider_import_cancel`, reset when a set import starts.
    cancel_provider_import: AtomicBool,
    /// Background analysis job (cancel/pause flags, one job at a time).
    analysis: std::sync::Arc<analysis::AnalysisControl>,
    /// Filesystem watcher over the registered roots.
    watch: watcher::WatchControl,
    /// Where an unreadable catalog file was set aside at startup, if it was.
    recovered_from: std::sync::Mutex<Option<String>>,
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

/// True when the file can't be used as a database at all (garbage, truncated,
/// failing an integrity check). A migration error is *not* corruption: it
/// usually means the file is from a newer app version, so it is left alone.
async fn is_corrupt(path: &Path) -> bool {
    let Ok(pool) = crate::db::open(path).await else {
        return true;
    };
    let ok = sqlx::query_scalar::<_, String>("PRAGMA quick_check")
        .fetch_all(&pool)
        .await
        .map(|rows| rows == ["ok"])
        .unwrap_or(false);
    pool.close().await;
    !ok
}

/// Sets an unreadable catalog aside (with its WAL/SHM files) as
/// `<name>.corrupt-<unix seconds>` so nothing is deleted and the library can
/// start empty; returns the new location.
fn quarantine(path: &Path) -> Result<PathBuf, String> {
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let name = path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let target = path.with_file_name(format!("{name}.corrupt-{stamp}"));
    std::fs::rename(path, &target).map_err(|err| format!("Could not set the damaged library aside: {err}"))?;
    for suffix in ["-wal", "-shm"] {
        let side = path.with_file_name(format!("{name}{suffix}"));
        if side.exists() {
            let _ = std::fs::rename(&side, target.with_file_name(format!("{}{suffix}", target.file_name().unwrap().to_string_lossy())));
        }
    }
    Ok(target)
}

/// Like `open`, but a catalog file that is corrupt is set aside and replaced
/// by a fresh one instead of leaving the library unusable. Returns where the
/// damaged file went. A catalog backup (Phase 4) restores the user data.
pub async fn open_recovering(path: &Path) -> Result<(SqlitePool, Option<PathBuf>), String> {
    let mut moved = None;
    if path.exists() && is_corrupt(path).await {
        moved = Some(quarantine(path)?);
    }
    Ok((open(path).await?, moved))
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
            let (pool, moved) = open_recovering(&path).await?;
            if let Some(moved) = moved {
                *state.recovered_from.lock().unwrap() = Some(moved.to_string_lossy().into_owned());
            }
            Ok::<_, String>(pool)
        })
        .await?;
    Ok(pool.clone())
}

/// Set when the catalog file was damaged and replaced at startup; the value
/// is where the damaged file was kept. Returned once, then cleared.
#[tauri::command]
#[specta::specta]
pub async fn library_take_recovery_notice(app: tauri::AppHandle) -> Result<Option<String>, String> {
    pool(&app).await?;
    Ok(app.state::<LibraryState>().recovered_from.lock().unwrap().take())
}
