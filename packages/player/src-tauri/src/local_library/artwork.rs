//! Embedded cover art: extraction from tags and a content-addressed on-disk
//! cache. A picture is stored once as `<sha256 of its bytes>.<ext>`, so every
//! track of an album that carries the same art shares one file; the track row
//! only records that file name (`library_tracks.artwork_key`).
//!
//! Images are stored as found (no image decoder is a dependency, so there is
//! no downscaling); pictures over `MAX_ARTWORK_BYTES` or in a format a webview
//! cannot show are skipped.

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use std::time::{Duration, SystemTime};

use sha2::{Digest, Sha256};
use sqlx::SqlitePool;

pub const MAX_ARTWORK_BYTES: usize = 5 * 1024 * 1024;

/// Files younger than this are never pruned: an import writes the image before
/// its batch commits the row that references it.
const PRUNE_GRACE: Duration = Duration::from_secs(60 * 60);

static CACHE_DIR: OnceLock<PathBuf> = OnceLock::new();

/// Where `metadata::read` stores extracted art. Set once, when the catalog
/// opens or the frontend first asks for it; until then extraction is skipped.
pub fn set_cache_dir(dir: PathBuf) {
    let _ = CACHE_DIR.set(dir);
}

/// Points the cache at `<app data>/artwork` and lets the webview load files
/// from it through the asset protocol.
pub(super) fn init_cache_dir(app: &tauri::AppHandle) -> Result<&'static Path, String> {
    use tauri::Manager;
    if let Some(dir) = cache_dir() {
        return Ok(dir);
    }
    let dir = app.path().app_data_dir().map_err(|err| err.to_string())?.join("artwork");
    app.asset_protocol_scope()
        .allow_directory(&dir, false)
        .map_err(|err| err.to_string())?;
    set_cache_dir(dir);
    cache_dir().ok_or_else(|| "Artwork cache is not available".to_owned())
}

pub fn cache_dir() -> Option<&'static Path> {
    CACHE_DIR.get().map(PathBuf::as_path)
}

/// File extension for a picture a webview can display, judged from its bytes
/// rather than the tag's MIME field, which is often missing or wrong.
fn image_extension(bytes: &[u8]) -> Option<&'static str> {
    if bytes.starts_with(&[0x89, b'P', b'N', b'G']) {
        Some("png")
    } else if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        Some("jpg")
    } else if bytes.starts_with(b"GIF8") {
        Some("gif")
    } else if bytes.len() > 12 && bytes.starts_with(b"RIFF") && &bytes[8..12] == b"WEBP" {
        Some("webp")
    } else {
        None
    }
}

fn is_cache_key(name: &str) -> bool {
    name.split_once('.').is_some_and(|(hash, ext)| {
        hash.len() == 64
            && hash.bytes().all(|b| b.is_ascii_hexdigit())
            && matches!(ext, "png" | "jpg" | "gif" | "webp")
    })
}

/// The front cover, else the first picture, from any tag in the file.
pub fn read_embedded(path: &Path) -> Option<Vec<u8>> {
    use lofty::file::TaggedFileExt;
    use lofty::picture::PictureType;
    let tagged = lofty::probe::Probe::open(path).ok()?.read().ok()?;
    let pictures: Vec<_> = tagged.tags().iter().flat_map(|tag| tag.pictures()).collect();
    let picture = pictures
        .iter()
        .find(|p| p.pic_type() == PictureType::CoverFront)
        .or_else(|| pictures.first())?;
    Some(picture.data().to_vec())
}

/// Writes `bytes` into `dir` under its content key (once) and returns the key,
/// or `None` for an oversized or unsupported picture.
pub fn store(dir: &Path, bytes: &[u8]) -> Result<Option<String>, String> {
    if bytes.is_empty() || bytes.len() > MAX_ARTWORK_BYTES {
        return Ok(None);
    }
    let Some(extension) = image_extension(bytes) else {
        return Ok(None);
    };
    let hash = Sha256::digest(bytes);
    let hex: String = hash.iter().map(|b| format!("{b:02x}")).collect();
    let key = format!("{hex}.{extension}");
    let target = dir.join(&key);
    if target.exists() {
        // Refreshing the mtime keeps a concurrent `prune` from deleting a file
        // this import is about to reference again.
        if let Ok(file) = std::fs::File::options().append(true).open(&target) {
            let _ = file.set_modified(SystemTime::now());
        }
        return Ok(Some(key));
    }
    std::fs::create_dir_all(dir).map_err(|err| err.to_string())?;
    let mut temp = tempfile::NamedTempFile::new_in(dir).map_err(|err| err.to_string())?;
    std::io::Write::write_all(&mut temp, bytes).map_err(|err| err.to_string())?;
    temp.persist(&target).map_err(|err| err.error.to_string())?;
    Ok(Some(key))
}

/// Extracts and caches a file's embedded art; any failure just means no art.
pub fn extract(path: &Path) -> Option<String> {
    let dir = cache_dir()?;
    let bytes = read_embedded(path)?;
    match store(dir, &bytes) {
        Ok(key) => key,
        Err(error) => {
            log::warn!("Could not cache artwork for {}: {error}", path.display());
            None
        }
    }
}

/// Deletes cached images no track references any more (older than
/// `PRUNE_GRACE`); returns how many were removed.
pub async fn prune(pool: &SqlitePool, dir: &Path) -> Result<usize, String> {
    let used: HashSet<String> = sqlx::query_scalar::<_, String>(
        "SELECT DISTINCT artwork_key FROM library_tracks WHERE artwork_key IS NOT NULL",
    )
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?
    .into_iter()
    .collect();
    let dir = dir.to_path_buf();
    tauri::async_runtime::spawn_blocking(move || prune_unused(&dir, &used, PRUNE_GRACE))
        .await
        .map_err(|err| err.to_string())?
}

pub(super) fn prune_unused(dir: &Path, used: &HashSet<String>, grace: Duration) -> Result<usize, String> {
    let entries = match std::fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(0),
        Err(error) => return Err(error.to_string()),
    };
    let now = SystemTime::now();
    let mut removed = 0;
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        if !is_cache_key(&name) || used.contains(&name) {
            continue;
        }
        let recent = entry
            .metadata()
            .and_then(|meta| meta.modified())
            .map(|modified| now.duration_since(modified).unwrap_or_default() < grace)
            .unwrap_or(true);
        if !recent && std::fs::remove_file(entry.path()).is_ok() {
            removed += 1;
        }
    }
    Ok(removed)
}

/// Removes orphaned art in the background; failures are only logged.
pub(super) fn prune_in_background(pool: SqlitePool) {
    let Some(dir) = cache_dir() else {
        return;
    };
    tauri::async_runtime::spawn(async move {
        if let Err(error) = prune(&pool, dir).await {
            log::warn!("Artwork cache cleanup failed: {error}");
        }
    });
}

/// The artwork cache folder with a trailing separator, so the frontend can
/// append an `artworkKey` to build a file path.
#[tauri::command]
#[specta::specta]
pub async fn library_artwork_dir(app: tauri::AppHandle) -> Result<String, String> {
    let dir = init_cache_dir(&app)?;
    Ok(format!("{}{}", dir.display(), std::path::MAIN_SEPARATOR))
}
