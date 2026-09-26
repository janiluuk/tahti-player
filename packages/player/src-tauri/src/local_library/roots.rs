//! Library roots (watched folders): registration, scanning, missing/recovered
//! detection and folder relink, plus their Tauri commands.

use super::*;

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
#[derive(Clone, Serialize, specta::Type, Default)]
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
    /// Renamed/moved files re-pointed at their new path (ID kept).
    #[specta(type = Number<usize>)]
    pub moved: usize,
    /// Known files changed on disk and re-read (external tag edits).
    #[specta(type = Number<usize>)]
    pub updated: usize,
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

// --- Library roots -------------------------------------------------------

pub(super) const ROOT_SELECT: &str = "SELECT r.id, r.path, r.created_at, r.last_scanned_at, \
    (SELECT COUNT(*) FROM library_tracks t WHERE t.root_id = r.id) AS track_count, \
    (SELECT COUNT(*) FROM library_tracks t WHERE t.root_id = r.id AND t.available = 0) AS missing_count \
    FROM library_roots r";

pub(super) async fn with_root_availability(mut roots: Vec<LibraryRoot>) -> Vec<LibraryRoot> {
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

pub(super) fn canonical_folder(path: &Path) -> Result<String, String> {
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
pub(super) async fn discover_new_paths(
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

pub(super) async fn scan_root(
    app: &tauri::AppHandle,
    pool: &SqlitePool,
    root: &LibraryRoot,
) -> RootScanResult {
    let mut result = RootScanResult::default();
    match discover_new_paths(pool, root).await {
        Ok((fresh, skipped)) => {
            let fresh = match reconcile::relink_moved(pool, root, fresh.clone()).await {
                Ok((moved, rest)) => {
                    result.moved = moved;
                    rest
                }
                Err(_) => fresh,
            };
            let imported = import_paths_with_progress(app, pool, fresh, skipped, Some(&root.id), &root.path).await;
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
        match reconcile::refresh_changed(pool, root).await {
            Ok(updated) => result.updated = updated,
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
    let scanned = scan_root(&app, &pool, &root).await;
    watcher::restart(&app).await;
    Ok(Some(scanned))
}

#[tauri::command]
#[specta::specta]
pub async fn library_remove_root(app: tauri::AppHandle, id: String) -> Result<(), String> {
    remove_root(&pool(&app).await?, &id).await?;
    watcher::restart(&app).await;
    Ok(())
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
        total.moved += scanned.moved;
        total.updated += scanned.updated;
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
    let relinked = relink_root(&pool(&app).await?, &id, &folder).await?;
    watcher::restart(&app).await;
    Ok(Some(relinked))
}
