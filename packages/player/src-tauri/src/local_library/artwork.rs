//! Embedded cover art: extraction from tags and a content-addressed on-disk
//! cache. A picture is stored once as `<sha256 of its bytes>.<ext>`, so every
//! track of an album that carries the same art shares one file; the track row
//! only records that file name (`library_tracks.artwork_key`).
//!
//! Images are stored as found (no image decoder is a dependency, so there is
//! no downscaling); pictures over `MAX_ARTWORK_BYTES` or in a format a webview
//! cannot show are skipped.
//!
//! The folder is capped at `MAX_CACHE_BYTES`. Art a track references is never
//! evicted to make room: orphans are pruned (at startup, after removals and
//! before a backfill), and when the referenced art alone fills the cap a new
//! picture is simply not stored. That track keeps no `artwork_key` until a
//! later backfill finds room for it.

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::OnceLock;
use std::time::{Duration, SystemTime};

use sha2::{Digest, Sha256};
use sqlx::SqlitePool;

pub const MAX_ARTWORK_BYTES: usize = 5 * 1024 * 1024;

pub const MAX_CACHE_BYTES: u64 = 1024 * 1024 * 1024;

/// Files younger than this are never pruned: an import writes the image before
/// its batch commits the row that references it.
const PRUNE_GRACE: Duration = Duration::from_secs(60 * 60);

static CACHE_DIR: OnceLock<PathBuf> = OnceLock::new();

static CACHE_BUDGET: OnceLock<Budget> = OnceLock::new();

/// Running total of the bytes in one cache folder against its cap. Space is
/// reserved before a write so concurrent imports cannot overshoot together.
pub struct Budget {
    cap: u64,
    used: AtomicU64,
    full_logged: AtomicBool,
}

impl Budget {
    pub fn new(cap: u64, used: u64) -> Self {
        Self { cap, used: AtomicU64::new(used), full_logged: AtomicBool::new(false) }
    }

    /// Starts from what the folder already holds.
    pub fn for_dir(cap: u64, dir: &Path) -> Self {
        Self::new(cap, dir_size(dir))
    }

    pub fn used(&self) -> u64 {
        self.used.load(Ordering::SeqCst)
    }

    fn try_reserve(&self, bytes: u64) -> bool {
        let reserved = self
            .used
            .fetch_update(Ordering::SeqCst, Ordering::SeqCst, |used| {
                used.checked_add(bytes).filter(|total| *total <= self.cap)
            })
            .is_ok();
        if !reserved && !self.full_logged.swap(true, Ordering::SeqCst) {
            log::warn!(
                "Artwork cache is full ({} of {} bytes); new artwork is not stored until space is freed",
                self.used(),
                self.cap
            );
        }
        reserved
    }

    pub fn release(&self, bytes: u64) {
        let _ = self
            .used
            .fetch_update(Ordering::SeqCst, Ordering::SeqCst, |used| Some(used.saturating_sub(bytes)));
        if bytes > 0 {
            self.full_logged.store(false, Ordering::SeqCst);
        }
    }
}

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

/// The budget of the process-wide cache folder, measured on first use.
pub fn cache_budget(dir: &Path) -> &'static Budget {
    CACHE_BUDGET.get_or_init(|| Budget::for_dir(MAX_CACHE_BYTES, dir))
}

/// Total size of the cache files in `dir`; files that are not ours are ignored.
pub fn dir_size(dir: &Path) -> u64 {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return 0;
    };
    entries
        .flatten()
        .filter(|entry| is_cache_key(&entry.file_name().to_string_lossy()))
        .filter_map(|entry| entry.metadata().ok())
        .map(|meta| meta.len())
        .sum()
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

#[derive(Debug, PartialEq, Eq)]
pub enum Stored {
    Key(String),
    /// No picture, or one that is empty, oversized or in a format a webview
    /// cannot show.
    Unsupported,
    /// Storing it would take the folder over its cap.
    CacheFull,
}

/// Writes `bytes` into `dir` under its content key (once) and returns the key.
/// A picture already in the cache costs nothing, so it is still found when the
/// cache is full.
pub fn store(dir: &Path, bytes: &[u8], budget: &Budget) -> Result<Stored, String> {
    if bytes.is_empty() || bytes.len() > MAX_ARTWORK_BYTES {
        return Ok(Stored::Unsupported);
    }
    let Some(extension) = image_extension(bytes) else {
        return Ok(Stored::Unsupported);
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
        return Ok(Stored::Key(key));
    }
    let size = bytes.len() as u64;
    if !budget.try_reserve(size) {
        return Ok(Stored::CacheFull);
    }
    let written = write_atomically(dir, &target, bytes);
    if written.is_err() {
        budget.release(size);
    }
    written.map(|()| Stored::Key(key))
}

fn write_atomically(dir: &Path, target: &Path, bytes: &[u8]) -> Result<(), String> {
    std::fs::create_dir_all(dir).map_err(|err| err.to_string())?;
    let mut temp = tempfile::NamedTempFile::new_in(dir).map_err(|err| err.to_string())?;
    std::io::Write::write_all(&mut temp, bytes).map_err(|err| err.to_string())?;
    temp.persist(target).map_err(|err| err.error.to_string())?;
    Ok(())
}

/// Extracts and caches a file's embedded art into `dir`; a failure to write is
/// logged and treated as no art.
pub fn extract_into(path: &Path, dir: &Path, budget: &Budget) -> Stored {
    let Some(bytes) = read_embedded(path) else {
        return Stored::Unsupported;
    };
    store(dir, &bytes, budget).unwrap_or_else(|error| {
        log::warn!("Could not cache artwork for {}: {error}", path.display());
        Stored::Unsupported
    })
}

/// Extracts and caches a file's embedded art; any failure just means no art.
pub fn extract(path: &Path) -> Option<String> {
    let dir = cache_dir()?;
    match extract_into(path, dir, cache_budget(dir)) {
        Stored::Key(key) => Some(key),
        Stored::Unsupported | Stored::CacheFull => None,
    }
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct Pruned {
    pub files: usize,
    pub bytes: u64,
}

/// Deletes cached images no track references any more (older than
/// `PRUNE_GRACE`) and gives their space back to `budget`.
pub async fn prune(pool: &SqlitePool, dir: &Path, budget: &Budget) -> Result<Pruned, String> {
    let used: HashSet<String> = sqlx::query_scalar::<_, String>(
        "SELECT DISTINCT artwork_key FROM library_tracks WHERE artwork_key IS NOT NULL",
    )
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?
    .into_iter()
    .collect();
    let dir = dir.to_path_buf();
    let pruned = tauri::async_runtime::spawn_blocking(move || prune_unused(&dir, &used, PRUNE_GRACE))
        .await
        .map_err(|err| err.to_string())??;
    budget.release(pruned.bytes);
    Ok(pruned)
}

pub(super) fn prune_unused(dir: &Path, used: &HashSet<String>, grace: Duration) -> Result<Pruned, String> {
    let entries = match std::fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(Pruned::default()),
        Err(error) => return Err(error.to_string()),
    };
    let now = SystemTime::now();
    let mut removed = Pruned::default();
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        if !is_cache_key(&name) || used.contains(&name) {
            continue;
        }
        let Ok(meta) = entry.metadata() else {
            continue;
        };
        let recent = meta
            .modified()
            .map(|modified| now.duration_since(modified).unwrap_or_default() < grace)
            .unwrap_or(true);
        if !recent && std::fs::remove_file(entry.path()).is_ok() {
            removed.files += 1;
            removed.bytes += meta.len();
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
        if let Err(error) = prune(&pool, dir, cache_budget(dir)).await {
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
