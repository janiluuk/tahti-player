//! Up-front disk-space estimate for a provider set import: the size of each
//! file still to download (from a HEAD request) against the free space on the
//! destination volume.

use std::path::Path;
use std::time::Duration;

use futures::StreamExt;
use serde::Serialize;
use specta_typescript::Number;
use sqlx::SqlitePool;

use super::provider_import::{already_imported, http_client, ProviderImportRequest};

const SIZE_CONCURRENCY: usize = 6;

const SIZE_TIMEOUT: Duration = Duration::from_secs(15);

/// Headroom kept free beyond the known sizes: covers tracks of unknown size
/// and whatever else writes to the disk while the set downloads.
fn margin(needed: u64) -> u64 {
    (needed / 10).max(256 * 1024 * 1024)
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum SpaceVerdict {
    /// Known sizes plus the margin fit.
    Fits,
    /// Known sizes fit, but not with the margin.
    Tight,
    /// Known sizes alone need more than the free space.
    NotEnough,
    /// The free space could not be read.
    Unknown,
}

#[derive(Clone, Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ProviderImportSpace {
    /// Sum of the sizes the provider reported for the entries still to download.
    #[specta(type = Number<u64>)]
    pub needed_bytes: u64,
    /// Entries still to download whose size is known.
    #[specta(type = Number<usize>)]
    pub sized: usize,
    /// Entries still to download whose size the provider did not report.
    #[specta(type = Number<usize>)]
    pub unknown_size: usize,
    /// Entries already in the library, which will be skipped.
    #[specta(type = Number<usize>)]
    pub already_imported: usize,
    /// Space available to this user on the destination volume.
    #[specta(type = Option<Number<u64>>)]
    pub free_bytes: Option<u64>,
    pub verdict: SpaceVerdict,
}

pub(crate) fn verdict(needed: u64, free: Option<u64>) -> SpaceVerdict {
    match free {
        None => SpaceVerdict::Unknown,
        Some(free) if needed > free => SpaceVerdict::NotEnough,
        Some(free) if needed.saturating_add(margin(needed)) > free => SpaceVerdict::Tight,
        Some(_) => SpaceVerdict::Fits,
    }
}

/// The size from a HEAD request, following redirects. `None` when the server
/// fails, refuses HEAD or sends no usable `Content-Length`.
async fn remote_size(client: reqwest::Client, download_url: String) -> Option<u64> {
    let url = reqwest::Url::parse(&download_url).ok()?;
    if !matches!(url.scheme(), "http" | "https") {
        return None;
    }
    let response = client.head(url).timeout(SIZE_TIMEOUT).send().await.ok()?.error_for_status().ok()?;
    // Read the header itself: for a HEAD response reqwest's `content_length()`
    // reports the (empty) body, not the file.
    response
        .headers()
        .get(reqwest::header::CONTENT_LENGTH)?
        .to_str()
        .ok()?
        .trim()
        .parse::<u64>()
        .ok()
        .filter(|size| *size > 0)
}

/// Free space available to this user on the volume holding `path`. The
/// destination folder usually does not exist yet, so its nearest existing
/// ancestor is measured.
pub(crate) fn free_space(path: &Path) -> Option<u64> {
    free_space_at(path.ancestors().find(|dir| dir.exists())?)
}

#[cfg(any(target_os = "macos", target_os = "ios"))]
fn free_space_at(path: &Path) -> Option<u64> {
    use std::os::unix::ffi::OsStrExt;
    let path = std::ffi::CString::new(path.as_os_str().as_bytes()).ok()?;
    // `statfs` rather than `statvfs`: Apple's `statvfs` has 32-bit block counts.
    let mut stat: libc::statfs = unsafe { std::mem::zeroed() };
    // SAFETY: `path` is NUL-terminated and `stat` is a valid out pointer.
    if unsafe { libc::statfs(path.as_ptr(), &mut stat) } != 0 {
        return None;
    }
    Some(stat.f_bavail.saturating_mul(u64::from(stat.f_bsize)))
}

#[cfg(all(unix, not(any(target_os = "macos", target_os = "ios"))))]
#[allow(clippy::useless_conversion)]
fn free_space_at(path: &Path) -> Option<u64> {
    use std::os::unix::ffi::OsStrExt;
    let path = std::ffi::CString::new(path.as_os_str().as_bytes()).ok()?;
    let mut stat: libc::statvfs = unsafe { std::mem::zeroed() };
    // SAFETY: `path` is NUL-terminated and `stat` is a valid out pointer.
    if unsafe { libc::statvfs(path.as_ptr(), &mut stat) } != 0 {
        return None;
    }
    Some(u64::from(stat.f_bavail).saturating_mul(u64::from(stat.f_frsize)))
}

#[cfg(windows)]
fn free_space_at(path: &Path) -> Option<u64> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::GetDiskFreeSpaceExW;
    let wide: Vec<u16> = path.as_os_str().encode_wide().chain(std::iter::once(0)).collect();
    let mut available = 0u64;
    // SAFETY: `wide` is NUL-terminated; the totals we do not need may be null.
    let ok = unsafe { GetDiskFreeSpaceExW(wide.as_ptr(), &mut available, std::ptr::null_mut(), std::ptr::null_mut()) };
    (ok != 0).then_some(available)
}

#[cfg(not(any(unix, windows)))]
fn free_space_at(_path: &Path) -> Option<u64> {
    None
}

/// Whether a write failed because the disk (or the user's quota) is full.
pub(crate) fn is_disk_full(err: &std::io::Error) -> bool {
    #[cfg(unix)]
    {
        matches!(err.raw_os_error(), Some(code) if code == libc::ENOSPC || code == libc::EDQUOT)
    }
    #[cfg(windows)]
    {
        // ERROR_HANDLE_DISK_FULL, ERROR_DISK_FULL
        matches!(err.raw_os_error(), Some(39 | 112))
    }
    #[cfg(not(any(unix, windows)))]
    {
        let _ = err;
        false
    }
}

/// Sizes the entries of `request` that are not in the library yet and
/// compares them with the free space at its destination.
pub(crate) async fn estimate(
    pool: &SqlitePool,
    client: &reqwest::Client,
    request: &ProviderImportRequest,
) -> Result<ProviderImportSpace, String> {
    let destination = Path::new(&request.destination);
    if !destination.is_absolute() {
        return Err("Choose a folder to save the set in".into());
    }
    let mut pending = Vec::new();
    let mut already = 0;
    for entry in &request.entries {
        match already_imported(pool, &request.provider, &entry.remote_id).await? {
            Some(_) => already += 1,
            None => pending.push(entry.download_url.clone()),
        }
    }
    let sizes: Vec<Option<u64>> = futures::stream::iter(pending)
        .map(|url| remote_size(client.clone(), url))
        .buffer_unordered(SIZE_CONCURRENCY)
        .collect()
        .await;
    let needed_bytes = sizes.iter().flatten().fold(0u64, |sum, size| sum.saturating_add(*size));
    let sized = sizes.iter().filter(|size| size.is_some()).count();
    let free_bytes = free_space(destination);
    Ok(ProviderImportSpace {
        needed_bytes,
        sized,
        unknown_size: sizes.len() - sized,
        already_imported: already,
        free_bytes,
        verdict: verdict(needed_bytes, free_bytes),
    })
}

/// How much space the set needs against what the destination has free.
#[tauri::command]
#[specta::specta]
pub async fn library_provider_import_space(
    app: tauri::AppHandle,
    request: ProviderImportRequest,
) -> Result<ProviderImportSpace, String> {
    let pool = super::pool(&app).await?;
    estimate(&pool, &http_client()?, &request).await
}
