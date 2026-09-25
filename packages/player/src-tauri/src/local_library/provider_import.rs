//! Downloads a provider playlist/set (hearthis.at) into the native library.
//! Each downloadable entry streams to a hidden `.part` file next to its final
//! name, is renamed only once complete, then goes through the normal file
//! import and gets a `library_track_sources` row so a re-run skips it.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};

use futures::StreamExt;
use serde::{Deserialize, Serialize};
use specta_typescript::Number;
use sqlx::SqlitePool;
use tauri::{Emitter, Manager};
use tokio::io::AsyncWriteExt;

use super::{import, organize, playlists, LibraryState};

pub(super) const PROVIDER_IMPORT_PROGRESS_EVENT: &str = "library://provider-import-progress";

/// Parallel downloads per set; enough to hide per-request latency without
/// hammering the provider.
const DOWNLOAD_CONCURRENCY: usize = 3;

/// Progress is reported at most once per this many bytes per download.
const PROGRESS_STEP_BYTES: u64 = 256 * 1024;

const PROVIDERS: [(&str, &str); 1] = [("hearthis", "hearthis.at")];

#[derive(Clone, Debug, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ProviderImportEntry {
    pub remote_id: String,
    pub title: String,
    pub artist: String,
    pub download_url: String,
    /// The provider's suggested file name; only its extension is used.
    pub file_name: Option<String>,
}

#[derive(Clone, Debug, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ProviderImportRequest {
    pub provider: String,
    pub set_id: String,
    pub set_title: String,
    /// Folder the files are saved in, usually from
    /// `library_provider_import_destination`.
    pub destination: String,
    /// Set order. Only entries the provider marks as downloadable belong here.
    pub entries: Vec<ProviderImportEntry>,
    /// Native playlist to hold the set in order. Reused (and re-ordered to the
    /// set) when a playlist with this name already exists.
    pub playlist_name: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum ProviderEntryState {
    Downloading,
    Imported,
    Skipped,
    Failed,
    Cancelled,
}

#[derive(Clone, Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ProviderImportProgress {
    pub remote_id: String,
    pub state: ProviderEntryState,
    #[specta(type = Number<u64>)]
    pub received_bytes: u64,
    #[specta(type = Option<Number<u64>>)]
    pub total_bytes: Option<u64>,
    pub error: Option<String>,
}

#[derive(Clone, Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ProviderImportFailure {
    pub remote_id: String,
    pub title: String,
    pub error: String,
}

#[derive(Clone, Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ProviderImportResult {
    #[specta(type = Number<usize>)]
    pub imported: usize,
    #[specta(type = Number<usize>)]
    pub skipped: usize,
    pub failures: Vec<ProviderImportFailure>,
    pub cancelled: bool,
    pub playlist_id: Option<String>,
    /// Library ids of the imported and skipped tracks, in set order.
    pub track_ids: Vec<String>,
}

enum Outcome {
    Imported(String),
    Skipped(String),
    Failed(String),
    Cancelled,
}

fn provider_label(provider: &str) -> Option<&'static str> {
    PROVIDERS.iter().find(|(id, _)| *id == provider).map(|(_, label)| *label)
}

/// `<audio dir>/Tahti/<provider>/<set title>`, falling back to the home
/// folder's `Music` when the OS reports no audio folder.
pub(crate) fn default_destination(audio_dir: &Path, provider: &str, set_title: &str) -> Result<PathBuf, String> {
    let label = provider_label(provider).ok_or_else(|| format!("Unknown import provider: {provider}"))?;
    let set = organize::clean(set_title);
    let set = if set.is_empty() { "Untitled set".to_string() } else { set };
    Ok(audio_dir.join("Tahti").join(label).join(set))
}

fn extension_from_name(name: &str) -> Option<String> {
    let ext = Path::new(name).extension()?.to_str()?.to_ascii_lowercase();
    import::is_supported_extension(&ext).then_some(ext)
}

fn extension_from_content_type(content_type: &str) -> Option<&'static str> {
    let essence = content_type.split(';').next().unwrap_or_default().trim().to_ascii_lowercase();
    match essence.as_str() {
        "audio/mpeg" | "audio/mp3" => Some("mp3"),
        "audio/mp4" | "audio/x-m4a" | "audio/m4a" => Some("m4a"),
        "audio/ogg" | "application/ogg" => Some("ogg"),
        "audio/flac" | "audio/x-flac" => Some("flac"),
        "audio/wav" | "audio/x-wav" | "audio/wave" => Some("wav"),
        "audio/aiff" | "audio/x-aiff" => Some("aiff"),
        _ => None,
    }
}

/// Picks the file type from the provider's file name, then the final
/// (post-redirect) URL, then the response's content type.
fn pick_extension(entry: &ProviderImportEntry, final_url: &reqwest::Url, content_type: Option<&str>) -> Result<String, String> {
    if let Some(ext) = entry.file_name.as_deref().and_then(extension_from_name) {
        return Ok(ext);
    }
    if let Some(ext) = final_url.path_segments().and_then(|mut s| s.next_back()).and_then(extension_from_name) {
        return Ok(ext);
    }
    if let Some(ext) = content_type.and_then(extension_from_content_type) {
        return Ok(ext.to_string());
    }
    Err(match content_type {
        Some(kind) if kind.starts_with("text/") => "The provider returned a web page instead of the audio file".into(),
        Some(kind) => format!("Not a supported audio file ({kind})"),
        None => "Not a supported audio file".into(),
    })
}

/// `NN - Artist - Title.ext` in `folder`, with ` (2)`, ` (3)`, ... when a
/// different file already has that name.
fn free_file_name(folder: &Path, position: usize, entry: &ProviderImportEntry, ext: &str) -> PathBuf {
    let title = organize::clean(&entry.title);
    let artist = organize::clean(&entry.artist);
    let mut stem = format!("{:02}", position + 1);
    if !artist.is_empty() {
        stem.push_str(" - ");
        stem.push_str(&artist);
    }
    stem.push_str(" - ");
    stem.push_str(if title.is_empty() { "Untitled" } else { &title });
    let mut candidate = folder.join(format!("{stem}.{ext}"));
    let mut n = 2;
    while candidate.exists() {
        candidate = folder.join(format!("{stem} ({n}).{ext}"));
        n += 1;
    }
    candidate
}

async fn already_imported(pool: &SqlitePool, provider: &str, remote_id: &str) -> Result<Option<String>, String> {
    let row: Option<(String, String)> = sqlx::query_as(
        "SELECT t.id, t.path FROM library_track_sources s \
         JOIN library_tracks t ON t.id = s.track_id \
         WHERE s.provider = ? AND s.remote_id = ? AND t.available = 1",
    )
    .bind(provider)
    .bind(remote_id)
    .fetch_optional(pool)
    .await
    .map_err(|err| err.to_string())?;
    Ok(row.filter(|(_, path)| Path::new(path).is_file()).map(|(id, _)| id))
}

async fn record_source(pool: &SqlitePool, track_id: &str, request: &ProviderImportRequest, entry: &ProviderImportEntry) -> Result<(), String> {
    sqlx::query(
        "INSERT OR REPLACE INTO library_track_sources (track_id, provider, remote_id, set_id, source_url) \
         VALUES (?, ?, ?, ?, ?)",
    )
    .bind(track_id)
    .bind(&request.provider)
    .bind(&entry.remote_id)
    .bind(&request.set_id)
    .bind(&entry.download_url)
    .execute(pool)
    .await
    .map_err(|err| err.to_string())?;
    Ok(())
}

enum DownloadError {
    Cancelled,
    Failed(String),
}

/// Streams `entry` into a hidden `.part` file and renames it into place.
/// The part file is removed on any failure or cancellation, so a partial
/// download never looks like a finished track.
async fn download(
    client: &reqwest::Client,
    folder: &Path,
    position: usize,
    entry: &ProviderImportEntry,
    cancel: &AtomicBool,
    progress: &(dyn Fn(ProviderImportProgress) + Sync),
) -> Result<PathBuf, DownloadError> {
    let failed = |err: String| DownloadError::Failed(err);
    let url = reqwest::Url::parse(&entry.download_url).map_err(|err| failed(format!("Bad download link: {err}")))?;
    if !matches!(url.scheme(), "http" | "https") {
        return Err(failed("Only http and https download links are supported".into()));
    }
    let response = client
        .get(url)
        .send()
        .await
        .and_then(reqwest::Response::error_for_status)
        .map_err(|err| failed(format!("Download failed: {err}")))?;
    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .map(str::to_owned);
    let ext = pick_extension(entry, response.url(), content_type.as_deref()).map_err(failed)?;
    let total = response.content_length();
    let target = free_file_name(folder, position, entry, &ext);
    let part = folder.join(format!(
        ".{}.part",
        target.file_name().unwrap_or_default().to_string_lossy()
    ));

    let result = async {
        let mut file = tokio::fs::File::create(&part).await.map_err(|err| failed(format!("Cannot write {}: {err}", part.display())))?;
        let mut received = 0u64;
        let mut reported = 0u64;
        let mut stream = response.bytes_stream();
        while let Some(chunk) = stream.next().await {
            if cancel.load(Ordering::SeqCst) {
                return Err(DownloadError::Cancelled);
            }
            let chunk = chunk.map_err(|err| failed(format!("Download interrupted: {err}")))?;
            file.write_all(&chunk).await.map_err(|err| failed(format!("Cannot write the file: {err}")))?;
            received += chunk.len() as u64;
            if received - reported >= PROGRESS_STEP_BYTES {
                reported = received;
                progress(ProviderImportProgress {
                    remote_id: entry.remote_id.clone(),
                    state: ProviderEntryState::Downloading,
                    received_bytes: received,
                    total_bytes: total,
                    error: None,
                });
            }
        }
        if received == 0 {
            return Err(failed("The provider sent an empty file".into()));
        }
        if total.is_some_and(|total| received < total) {
            return Err(failed("Download ended early".into()));
        }
        file.flush().await.map_err(|err| failed(err.to_string()))?;
        drop(file);
        tokio::fs::rename(&part, &target).await.map_err(|err| failed(format!("Cannot finish the file: {err}")))?;
        Ok(target.clone())
    }
    .await;
    if result.is_err() {
        let _ = tokio::fs::remove_file(&part).await;
    }
    result
}

/// Runs one entry and reports its final state as soon as it is known.
async fn import_and_report(
    pool: &SqlitePool,
    client: &reqwest::Client,
    request: &ProviderImportRequest,
    folder: &Path,
    position: usize,
    entry: &ProviderImportEntry,
    cancel: &AtomicBool,
    write_lock: &tokio::sync::Mutex<()>,
    progress: &(dyn Fn(ProviderImportProgress) + Sync),
) -> Outcome {
    let outcome = import_one(pool, client, request, folder, position, entry, cancel, write_lock, progress).await;
    let (state, error) = match &outcome {
        Outcome::Imported(_) => (ProviderEntryState::Imported, None),
        Outcome::Skipped(_) => (ProviderEntryState::Skipped, None),
        Outcome::Failed(error) => (ProviderEntryState::Failed, Some(error.clone())),
        Outcome::Cancelled => (ProviderEntryState::Cancelled, None),
    };
    progress(ProviderImportProgress {
        remote_id: entry.remote_id.clone(),
        state,
        received_bytes: 0,
        total_bytes: None,
        error,
    });
    outcome
}

async fn import_one(
    pool: &SqlitePool,
    client: &reqwest::Client,
    request: &ProviderImportRequest,
    folder: &Path,
    position: usize,
    entry: &ProviderImportEntry,
    cancel: &AtomicBool,
    write_lock: &tokio::sync::Mutex<()>,
    progress: &(dyn Fn(ProviderImportProgress) + Sync),
) -> Outcome {
    if cancel.load(Ordering::SeqCst) {
        return Outcome::Cancelled;
    }
    match already_imported(pool, &request.provider, &entry.remote_id).await {
        Ok(Some(track_id)) => return Outcome::Skipped(track_id),
        Ok(None) => {}
        Err(err) => return Outcome::Failed(err),
    }
    progress(ProviderImportProgress {
        remote_id: entry.remote_id.clone(),
        state: ProviderEntryState::Downloading,
        received_bytes: 0,
        total_bytes: None,
        error: None,
    });
    let path = match download(client, folder, position, entry, cancel, progress).await {
        Ok(path) => path,
        Err(DownloadError::Cancelled) => return Outcome::Cancelled,
        Err(DownloadError::Failed(err)) => return Outcome::Failed(err),
    };
    // Downloads run in parallel, but catalog writes go one at a time: SQLite
    // allows a single writer and concurrent import transactions deadlock.
    let _writing = write_lock.lock().await;
    let imported = import::import_paths(pool, vec![path.clone()]).await;
    if let Some(failure) = imported.errors.first() {
        // A file that downloaded but is not decodable audio is not kept.
        let _ = tokio::fs::remove_file(&path).await;
        return Outcome::Failed(failure.error.clone());
    }
    let canonical = path.canonicalize().unwrap_or(path);
    let track_id: Option<String> = match sqlx::query_scalar("SELECT id FROM library_tracks WHERE path = ?")
        .bind(canonical.to_string_lossy().as_ref())
        .fetch_optional(pool)
        .await
    {
        Ok(id) => id,
        Err(err) => return Outcome::Failed(err.to_string()),
    };
    let Some(track_id) = track_id else {
        return Outcome::Failed("The file was saved but did not appear in the library".into());
    };
    if let Err(err) = record_source(pool, &track_id, request, entry).await {
        return Outcome::Failed(err);
    }
    Outcome::Imported(track_id)
}

/// Makes the named playlist hold exactly `track_ids`, in order.
async fn sync_playlist(pool: &SqlitePool, name: &str, track_ids: &[String]) -> Result<String, String> {
    let existing = playlists::list_playlists(pool)
        .await?
        .into_iter()
        .find(|playlist| playlist.name.eq_ignore_ascii_case(name.trim()));
    let id = match existing {
        Some(playlist) => {
            let entries = playlists::entry_ids(pool, &playlist.id).await?;
            playlists::remove_entries(pool, &playlist.id, &entries).await?;
            playlist.id
        }
        None => playlists::create_playlist(pool, name).await?.id,
    };
    playlists::add_tracks(pool, &id, track_ids, None).await?;
    Ok(id)
}

/// Downloads and imports every entry of `request`. One failed entry never
/// stops the others; `cancel` stops new and running downloads.
pub(crate) async fn run(
    pool: &SqlitePool,
    client: &reqwest::Client,
    request: &ProviderImportRequest,
    cancel: &AtomicBool,
    progress: &(dyn Fn(ProviderImportProgress) + Sync),
) -> Result<ProviderImportResult, String> {
    if provider_label(&request.provider).is_none() {
        return Err(format!("Unknown import provider: {}", request.provider));
    }
    let folder = PathBuf::from(&request.destination);
    if !folder.is_absolute() {
        return Err("Choose a folder to save the set in".into());
    }
    tokio::fs::create_dir_all(&folder)
        .await
        .map_err(|err| format!("Cannot create {}: {err}", folder.display()))?;

    let write_lock = tokio::sync::Mutex::new(());
    let outcomes: Vec<Outcome> = futures::stream::iter(0..request.entries.len())
        .map(|position| {
            let entry = &request.entries[position];
            import_and_report(pool, client, request, &folder, position, entry, cancel, &write_lock, progress)
        })
        .buffered(DOWNLOAD_CONCURRENCY)
        .collect()
        .await;

    let mut result = ProviderImportResult::default();
    for (entry, outcome) in request.entries.iter().zip(outcomes) {
        match outcome {
            Outcome::Imported(id) => {
                result.imported += 1;
                result.track_ids.push(id);
            }
            Outcome::Skipped(id) => {
                result.skipped += 1;
                result.track_ids.push(id);
            }
            Outcome::Failed(error) => result.failures.push(ProviderImportFailure {
                remote_id: entry.remote_id.clone(),
                title: entry.title.clone(),
                error,
            }),
            Outcome::Cancelled => result.cancelled = true,
        }
    }
    if let Some(name) = request.playlist_name.as_deref().filter(|name| !name.trim().is_empty()) {
        if !result.track_ids.is_empty() {
            result.playlist_id = Some(sync_playlist(pool, name, &result.track_ids).await?);
        }
    }
    Ok(result)
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent(concat!("TahtiPlayer/", env!("CARGO_PKG_VERSION")))
        .connect_timeout(std::time::Duration::from_secs(30))
        .read_timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|err| err.to_string())
}

/// The folder a set is saved in unless the user picks another one.
#[tauri::command]
#[specta::specta]
pub async fn library_provider_import_destination(
    app: tauri::AppHandle,
    provider: String,
    set_title: String,
) -> Result<String, String> {
    let paths = app.path();
    let audio = paths
        .audio_dir()
        .or_else(|_| paths.home_dir().map(|home| home.join("Music")))
        .map_err(|err| err.to_string())?;
    Ok(default_destination(&audio, &provider, &set_title)?.to_string_lossy().into_owned())
}

/// Downloads a provider set into the library, emitting
/// `library://provider-import-progress` per entry.
#[tauri::command]
#[specta::specta]
pub async fn library_provider_import(
    app: tauri::AppHandle,
    request: ProviderImportRequest,
) -> Result<ProviderImportResult, String> {
    let pool = super::pool(&app).await?;
    let state = app.state::<LibraryState>();
    state.cancel_provider_import.store(false, Ordering::SeqCst);
    let client = http_client()?;
    let emitter = app.clone();
    run(&pool, &client, &request, &state.cancel_provider_import, &move |event| {
        let _ = emitter.emit(PROVIDER_IMPORT_PROGRESS_EVENT, event);
    })
    .await
}

#[tauri::command]
#[specta::specta]
pub async fn library_provider_import_cancel(app: tauri::AppHandle) -> Result<(), String> {
    app.state::<LibraryState>().cancel_provider_import.store(true, Ordering::SeqCst);
    Ok(())
}
