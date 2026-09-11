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

pub async fn open(path: &Path) -> Result<SqlitePool, String> {
    let pool = crate::db::open(path).await?;
    sqlx::migrate!("./migrations/library").run(&pool).await.map_err(|err| err.to_string())?;
    Ok(pool)
}

async fn pool(app: &tauri::AppHandle) -> Result<SqlitePool, String> {
    let state = app.state::<LibraryState>();
    let pool = state.0.get_or_try_init(|| async {
        let path = app.path().app_data_dir().map_err(|err| err.to_string())?.join("databases/library.db");
        open(&path).await
    }).await?;
    Ok(pool.clone())
}

pub async fn import_paths(pool: &SqlitePool, paths: Vec<PathBuf>) -> ImportResult {
    let mut result = ImportResult::default();
    for path in paths {
        let display = path.to_string_lossy().into_owned();
        let extracted = tauri::async_runtime::spawn_blocking(move || metadata::read(&path)).await;
        let track = match extracted.map_err(|err| err.to_string()).and_then(|track| track) {
            Ok(track) => track,
            Err(error) => {
                result.errors.push(ImportFailure { path: display, error });
                continue;
            }
        };
        let saved = sqlx::query("INSERT INTO library_tracks (id,path,title,artist,album,format,duration,sample_rate,channels,bits_per_sample,size_bytes) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(path) DO UPDATE SET title=excluded.title, artist=excluded.artist, album=excluded.album, format=excluded.format, duration=excluded.duration, sample_rate=excluded.sample_rate, channels=excluded.channels, bits_per_sample=excluded.bits_per_sample, size_bytes=excluded.size_bytes")
            .bind(&track.id).bind(&track.path).bind(&track.title).bind(&track.artist).bind(&track.album).bind(&track.format).bind(track.duration).bind(track.sample_rate).bind(track.channels).bind(track.bits_per_sample).bind(track.size_bytes)
            .execute(pool).await;
        match saved {
            Ok(_) => result.imported += 1,
            Err(error) => result.errors.push(ImportFailure { path: display, error: error.to_string() }),
        }
    }
    result
}

pub async fn list(pool: &SqlitePool, search: &str, offset: i64) -> Result<LibraryPage, String> {
    let search = format!("%{}%", search.replace('\\', "\\\\").replace('%', "\\%").replace('_', "\\_"));
    let filter = "(title LIKE ? ESCAPE '\\' OR artist LIKE ? ESCAPE '\\' OR album LIKE ? ESCAPE '\\' OR path LIKE ? ESCAPE '\\')";
    let total = sqlx::query_scalar::<_, i64>(&format!("SELECT COUNT(*) FROM library_tracks WHERE {filter}"))
        .bind(&search).bind(&search).bind(&search).bind(&search).fetch_one(pool).await.map_err(|err| err.to_string())?;
    let tracks = sqlx::query_as::<_, LibraryTrack>(&format!("SELECT * FROM library_tracks WHERE {filter} ORDER BY title COLLATE NOCASE,id LIMIT 100 OFFSET ?"))
        .bind(&search).bind(&search).bind(&search).bind(&search).bind(offset.max(0)).fetch_all(pool).await.map_err(|err| err.to_string())?;
    Ok(LibraryPage { tracks, total })
}

#[tauri::command]
#[specta::specta]
pub async fn library_list(app: tauri::AppHandle, search: String, offset: i32) -> Result<LibraryPage, String> {
    list(&pool(&app).await?, &search, offset.into()).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_import(app: tauri::AppHandle) -> Result<ImportResult, String> {
    let dialog_app = app.clone();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        dialog_app.dialog().file().add_filter("FLAC and WAV audio", &["flac", "wav"]).blocking_pick_files()
    }).await.map_err(|err| err.to_string())?;
    let Some(files) = selected else { return Ok(ImportResult::default()); };
    let paths = files.into_iter().map(|file| file.into_path().map_err(|err| err.to_string())).collect::<Result<Vec<_>, _>>()?;
    Ok(import_paths(&pool(&app).await?, paths).await)
}

pub async fn resolve_path(pool: &SqlitePool, id: &str) -> Result<String, String> {
    let path = sqlx::query_scalar::<_, String>("SELECT path FROM library_tracks WHERE id=?").bind(id).fetch_optional(pool).await.map_err(|err| err.to_string())?.ok_or("Track is not in the library")?;
    if !tokio::fs::try_exists(&path).await.map_err(|err| err.to_string())? {
        return Err("Original file is unavailable. Reconnect its drive or restore the file.".into());
    }
    Ok(path)
}

pub async fn remove(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM library_tracks WHERE id=?").bind(id).execute(pool).await.map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn library_resolve(app: tauri::AppHandle, id: String) -> Result<String, String> {
    let path = resolve_path(&pool(&app).await?, &id).await?;
    app.asset_protocol_scope().allow_file(&path).map_err(|err| err.to_string())?;
    Ok(path)
}

#[tauri::command]
#[specta::specta]
pub async fn library_remove(app: tauri::AppHandle, id: String) -> Result<(), String> {
    remove(&pool(&app).await?, &id).await
}
