//! Single-track maintenance: resolving paths, availability, removal and
//! relinking a missing file, plus their Tauri commands.

use super::*;

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
pub(super) async fn mark_availability(pool: &SqlitePool, id: &str, available: bool) -> Result<(), String> {
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
    let updated = sqlx::query("UPDATE library_tracks SET path=?, title=?, artist=?, album=?, album_artist=?, track_no=?, disc_no=?, year=?, genre=?, comment=?, bitrate_kbps=?, folder=?, format=?, duration=?, sample_rate=?, channels=?, bits_per_sample=?, size_bytes=?, artwork_key=?, available=1, unavailable_since=NULL WHERE id=?")
        .bind(&extracted.path).bind(&extracted.title).bind(&extracted.artist).bind(&extracted.album).bind(&extracted.album_artist).bind(extracted.track_no).bind(extracted.disc_no).bind(extracted.year).bind(&extracted.genre).bind(&extracted.comment).bind(extracted.bitrate_kbps).bind(folder_of(&extracted.path)).bind(&extracted.format).bind(extracted.duration).bind(extracted.sample_rate).bind(extracted.channels).bind(extracted.bits_per_sample).bind(extracted.size_bytes).bind(&extracted.artwork_key)
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
    let pool = pool(&app).await?;
    remove(&pool, &id).await?;
    artwork::prune_in_background(pool);
    Ok(())
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
    let pool = pool(&app).await?;
    let removed = remove_many(&pool, &ids).await?;
    artwork::prune_in_background(pool);
    Ok(removed as u32)
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
            .add_filter(
                super::import::AUDIO_PICKER_LABEL,
                &super::import::SUPPORTED_AUDIO_EXTENSIONS,
            )
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
