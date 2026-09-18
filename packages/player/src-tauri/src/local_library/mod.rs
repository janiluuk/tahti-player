mod metadata;
#[cfg(test)]
mod tests;

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use specta_typescript::Number;
use sqlx::{FromRow, SqlitePool};
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
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
    pub errors: Vec<ImportFailure>,
}

#[derive(Default)]
pub struct LibraryState(OnceCell<SqlitePool>);

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
/// - **Backup** is deliberately out of this crate for now: `library.db` is
///   one file (WAL mode, so a live copy also needs the `-wal`/`-shm`
///   sidecars, or a `VACUUM INTO` snapshot instead) under the OS app-data
///   dir this module already resolves in `pool()` below. No automatic
///   scheduled backup, export, or restore command exists yet -- Phase 4
///   ("Add catalog backup/restore including playlists, overrides, roots and
///   analysis references") owns building that UI/command; this note exists
///   so a migration author knows *why* there's no rollback path today and
///   isn't tempted to invent an ad hoc one for a single migration.
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
        .0
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

pub async fn import_paths(pool: &SqlitePool, paths: Vec<PathBuf>) -> ImportResult {
    let mut result = ImportResult::default();
    for path in paths {
        let display = path.to_string_lossy().into_owned();
        let extracted = tauri::async_runtime::spawn_blocking(move || metadata::read(&path)).await;
        let track = match extracted
            .map_err(|err| err.to_string())
            .and_then(|track| track)
        {
            Ok(track) => track,
            Err(error) => {
                result.errors.push(ImportFailure {
                    path: display,
                    error,
                });
                continue;
            }
        };
        // A successful (re)import proves the file exists right now -- clear
        // any stale missing state a prior resolve/re-scan had persisted,
        // same self-heal `resolve_path` does on a direct resolve.
        let saved = sqlx::query("INSERT INTO library_tracks (id,path,title,artist,album,format,duration,sample_rate,channels,bits_per_sample,size_bytes) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(path) DO UPDATE SET title=excluded.title, artist=excluded.artist, album=excluded.album, format=excluded.format, duration=excluded.duration, sample_rate=excluded.sample_rate, channels=excluded.channels, bits_per_sample=excluded.bits_per_sample, size_bytes=excluded.size_bytes, available=1, unavailable_since=NULL")
            .bind(&track.id).bind(&track.path).bind(&track.title).bind(&track.artist).bind(&track.album).bind(&track.format).bind(track.duration).bind(track.sample_rate).bind(track.channels).bind(track.bits_per_sample).bind(track.size_bytes)
            .execute(pool).await;
        match saved {
            Ok(_) => result.imported += 1,
            Err(error) => result.errors.push(ImportFailure {
                path: display,
                error: error.to_string(),
            }),
        }
    }
    result
}

pub async fn list(pool: &SqlitePool, search: &str, offset: i64) -> Result<LibraryPage, String> {
    let search = format!(
        "%{}%",
        search
            .replace('\\', "\\\\")
            .replace('%', "\\%")
            .replace('_', "\\_")
    );
    let filter = "(title LIKE ? ESCAPE '\\' OR artist LIKE ? ESCAPE '\\' OR album LIKE ? ESCAPE '\\' OR path LIKE ? ESCAPE '\\')";
    let total = sqlx::query_scalar::<_, i64>(&format!(
        "SELECT COUNT(*) FROM library_tracks WHERE {filter}"
    ))
    .bind(&search)
    .bind(&search)
    .bind(&search)
    .bind(&search)
    .fetch_one(pool)
    .await
    .map_err(|err| err.to_string())?;
    let tracks = sqlx::query_as::<_, LibraryTrack>(&format!("SELECT * FROM library_tracks WHERE {filter} ORDER BY title COLLATE NOCASE,id LIMIT 100 OFFSET ?"))
        .bind(&search).bind(&search).bind(&search).bind(&search).bind(offset.max(0)).fetch_all(pool).await.map_err(|err| err.to_string())?;
    Ok(LibraryPage { tracks, total })
}

#[tauri::command]
#[specta::specta]
pub async fn library_list(
    app: tauri::AppHandle,
    search: String,
    offset: i32,
) -> Result<LibraryPage, String> {
    list(&pool(&app).await?, &search, offset.into()).await
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
    Ok(import_paths(&pool(&app).await?, paths).await)
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
    let updated = sqlx::query("UPDATE library_tracks SET path=?, title=?, artist=?, album=?, format=?, duration=?, sample_rate=?, channels=?, bits_per_sample=?, size_bytes=?, available=1, unavailable_since=NULL WHERE id=?")
        .bind(&extracted.path).bind(&extracted.title).bind(&extracted.artist).bind(&extracted.album).bind(&extracted.format).bind(extracted.duration).bind(extracted.sample_rate).bind(extracted.channels).bind(extracted.bits_per_sample).bind(extracted.size_bytes)
        .bind(id)
        .execute(pool).await;
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
