//! Duplicate review: content hashing, exact and similar groups, and merging
//! a duplicate into the track that stays.

use super::*;

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct MergeResult {
    #[specta(type = Number<usize>)]
    pub removed: usize,
    #[specta(type = Number<usize>)]
    pub playlist_entries_moved: usize,
}

/// Folds the user data of `remove_ids` into `keep_id`, points their playlist
/// entries and history at it, then removes them from the catalog (files on
/// disk are never touched): best rating, first color, summed plays, latest
/// last-played, union of tags.
pub async fn merge_tracks(pool: &SqlitePool, keep_id: &str, remove_ids: &[String]) -> Result<MergeResult, String> {
    let remove: Vec<&String> = remove_ids.iter().filter(|id| id.as_str() != keep_id).collect();
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let keep = sqlx::query("SELECT rating, color, play_count, last_played_at, path, title, artist, duration FROM library_tracks WHERE id=?")
        .bind(keep_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("The track to keep is not in the library.")?;
    let mut rating: i64 = keep.get(0);
    let mut color: String = keep.get(1);
    let mut plays: i64 = keep.get(2);
    let mut last: Option<String> = keep.get(3);
    let (path, title, artist, duration): (String, String, String, f64) =
        (keep.get(4), keep.get(5), keep.get(6), keep.get(7));
    let mut result = MergeResult { removed: 0, playlist_entries_moved: 0 };
    for id in remove {
        let Some(row) = sqlx::query("SELECT rating, color, play_count, last_played_at FROM library_tracks WHERE id=?")
            .bind(id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| e.to_string())?
        else {
            continue;
        };
        rating = rating.max(row.get::<i64, _>(0));
        if color.is_empty() {
            color = row.get(1);
        }
        plays += row.get::<i64, _>(2);
        let other: Option<String> = row.get(3);
        if other > last {
            last = other;
        }
        sqlx::query("INSERT OR IGNORE INTO library_track_tags (track_id, tag_id) SELECT ?, tag_id FROM library_track_tags WHERE track_id=?")
            .bind(keep_id).bind(id)
            .execute(&mut *tx).await.map_err(|e| e.to_string())?;
        result.playlist_entries_moved += sqlx::query("UPDATE library_playlist_entries SET track_id=?, path=?, title=?, artist=?, duration=? WHERE track_id=?")
            .bind(keep_id).bind(&path).bind(&title).bind(&artist).bind(duration).bind(id)
            .execute(&mut *tx).await.map_err(|e| e.to_string())?
            .rows_affected() as usize;
        sqlx::query("UPDATE library_play_log SET track_id=? WHERE track_id=?")
            .bind(keep_id).bind(id)
            .execute(&mut *tx).await.map_err(|e| e.to_string())?;
        sqlx::query("DELETE FROM library_tracks WHERE id=?")
            .bind(id)
            .execute(&mut *tx).await.map_err(|e| e.to_string())?;
        result.removed += 1;
    }
    sqlx::query("UPDATE library_tracks SET rating=?, color=?, play_count=?, last_played_at=? WHERE id=?")
        .bind(rating).bind(&color).bind(plays).bind(&last).bind(keep_id)
        .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(result)
}

// ---------------------------------------------------------------------------
// Duplicate review
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum DuplicateKind {
    /// Byte-identical files (same SHA-256).
    Exact,
    /// Same title and artist and nearly the same length; the files differ or
    /// have not been compared. A suggestion, never a conclusion.
    Similar,
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DuplicateGroup {
    pub kind: DuplicateKind,
    pub tracks: Vec<LibraryTrack>,
    /// Similar groups only: every file has been hashed and the contents
    /// differ, so these are confirmed *different* files with the same name.
    pub confirmed_different: bool,
}

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct HashResult {
    #[specta(type = Number<usize>)]
    pub hashed: usize,
    /// Already hashed and unchanged since.
    #[specta(type = Number<usize>)]
    pub already_current: usize,
    #[specta(type = Number<usize>)]
    pub failed: usize,
    pub cancelled: bool,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct HashProgress {
    #[specta(type = Number<usize>)]
    pub done: usize,
    #[specta(type = Number<usize>)]
    pub total: usize,
}

pub(crate) fn stamp_of(meta: &std::fs::Metadata) -> (i64, i64) {
    let mtime = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    (meta.len() as i64, mtime)
}

pub(crate) fn hash_file(path: &str) -> Result<(String, i64, i64), String> {
    use sha2::{Digest, Sha256};
    use std::io::Read;
    let mut file = std::fs::File::open(path).map_err(|e| e.to_string())?;
    let (size, mtime) = stamp_of(&file.metadata().map_err(|e| e.to_string())?);
    let mut hasher = Sha256::new();
    let mut buffer = vec![0u8; 1 << 20];
    loop {
        let read = file.read(&mut buffer).map_err(|e| e.to_string())?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    let hex: String = hasher.finalize().iter().map(|b| format!("{b:02x}")).collect();
    Ok((hex, size, mtime))
}

pub(crate) fn file_stamp(path: &str) -> Option<(i64, i64)> {
    std::fs::metadata(path).ok().map(|meta| stamp_of(&meta))
}

/// Hashes the files of `ids` (every available track when `ids` is empty) that
/// have no current hash. A file changed since it was hashed is hashed again.
/// `cancelled` is polled between files; `on_progress` after each.
pub async fn hash_tracks(
    pool: &SqlitePool,
    ids: &[String],
    cancelled: &(dyn Fn() -> bool + Sync),
    on_progress: &(dyn Fn(HashProgress) + Sync),
) -> Result<HashResult, String> {
    let rows = if ids.is_empty() {
        sqlx::query("SELECT id, path, content_hash, hash_size, hash_mtime FROM library_tracks WHERE available = 1")
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?
    } else {
        let mut all = Vec::new();
        for chunk in ids.chunks(CHUNK) {
            let marks = vec!["?"; chunk.len()].join(",");
            let sql = format!("SELECT id, path, content_hash, hash_size, hash_mtime FROM library_tracks WHERE available = 1 AND id IN ({marks})");
            let mut query = sqlx::query(&sql);
            for id in chunk {
                query = query.bind(id);
            }
            all.extend(query.fetch_all(pool).await.map_err(|e| e.to_string())?);
        }
        all
    };
    let mut result = HashResult::default();
    let total = rows.len();
    for (index, row) in rows.into_iter().enumerate() {
        if cancelled() {
            result.cancelled = true;
            break;
        }
        let id: String = row.get(0);
        let path: String = row.get(1);
        let stored: Option<String> = row.get(2);
        let size: Option<i64> = row.get(3);
        let mtime: Option<i64> = row.get(4);
        let current = {
            let path = path.clone();
            tauri::async_runtime::spawn_blocking(move || file_stamp(&path))
                .await
                .map_err(|e| e.to_string())?
        };
        if stored.is_some() && current.is_some() && current == size.zip(mtime) {
            result.already_current += 1;
        } else {
            let file = path.clone();
            match tauri::async_runtime::spawn_blocking(move || hash_file(&file))
                .await
                .map_err(|e| e.to_string())?
            {
                Ok((hash, size, mtime)) => {
                    sqlx::query("UPDATE library_tracks SET content_hash=?, hash_size=?, hash_mtime=? WHERE id=?")
                        .bind(hash)
                        .bind(size)
                        .bind(mtime)
                        .bind(&id)
                        .execute(pool)
                        .await
                        .map_err(|e| e.to_string())?;
                    result.hashed += 1;
                }
                Err(_) => result.failed += 1,
            }
        }
        on_progress(HashProgress { done: index + 1, total });
    }
    Ok(result)
}

pub(crate) fn similarity_key(track: &LibraryTrack) -> String {
    let fold = |s: &str| {
        s.chars()
            .filter(|c| c.is_alphanumeric())
            .flat_map(|c| c.to_lowercase())
            .collect::<String>()
    };
    let artist = if track.album_artist.is_empty() { &track.artist } else { &track.album_artist };
    format!("{}\u{1}{}", fold(&track.title), fold(artist))
}

/// Groups of exact duplicates (same SHA-256), then groups of similar tracks
/// (same title and artist, lengths within 2 seconds) that are not already an
/// exact group. Files are never touched: review only.
pub async fn duplicate_groups(pool: &SqlitePool) -> Result<Vec<DuplicateGroup>, String> {
    let mut groups = Vec::new();
    let hashes: Vec<String> = sqlx::query_scalar(
        "SELECT content_hash FROM library_tracks WHERE content_hash IS NOT NULL GROUP BY content_hash HAVING COUNT(*) > 1 ORDER BY MIN(title COLLATE NOCASE) LIMIT 500",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;
    for hash in hashes {
        let tracks = sqlx::query_as::<_, LibraryTrack>("SELECT * FROM library_tracks WHERE content_hash=? ORDER BY path")
            .bind(&hash)
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?;
        groups.push(DuplicateGroup { kind: DuplicateKind::Exact, tracks, confirmed_different: false });
    }
    let hash_by_id: HashMap<String, Option<String>> = sqlx::query("SELECT id, content_hash FROM library_tracks")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|row| (row.get(0), row.get(1)))
        .collect();
    let all = sqlx::query_as::<_, LibraryTrack>("SELECT * FROM library_tracks ORDER BY title COLLATE NOCASE, id")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    let mut by_key: BTreeMap<String, Vec<LibraryTrack>> = BTreeMap::new();
    for track in all {
        let key = similarity_key(&track);
        if key.starts_with('\u{1}') {
            continue; // No usable title: nothing to compare.
        }
        by_key.entry(key).or_default().push(track);
    }
    for (_, mut tracks) in by_key {
        if tracks.len() < 2 {
            continue;
        }
        tracks.sort_by(|a, b| a.duration.total_cmp(&b.duration));
        // Chain tracks whose length is within 2 s of the previous one.
        let mut cluster: Vec<LibraryTrack> = Vec::new();
        let mut clusters: Vec<Vec<LibraryTrack>> = Vec::new();
        for track in tracks {
            match cluster.last() {
                Some(last) if (track.duration - last.duration).abs() <= 2.0 => cluster.push(track),
                _ => {
                    if cluster.len() > 1 {
                        clusters.push(std::mem::take(&mut cluster));
                    }
                    cluster = vec![track];
                }
            }
        }
        if cluster.len() > 1 {
            clusters.push(cluster);
        }
        for cluster in clusters {
            let hashes: Vec<Option<&String>> = cluster
                .iter()
                .map(|t| hash_by_id.get(&t.id).and_then(|h| h.as_ref()))
                .collect();
            let all_hashed = hashes.iter().all(|h| h.is_some());
            let distinct: HashSet<&String> = hashes.iter().flatten().copied().collect();
            // Every file is byte-identical: already listed as an exact group.
            if all_hashed && distinct.len() == 1 {
                continue;
            }
            let confirmed_different = all_hashed && distinct.len() == cluster.len();
            groups.push(DuplicateGroup { kind: DuplicateKind::Similar, tracks: cluster, confirmed_different });
            if groups.len() >= 1000 {
                return Ok(groups);
            }
        }
    }
    Ok(groups)
}

#[tauri::command]
#[specta::specta]
pub async fn library_hash_tracks(app: tauri::AppHandle, ids: Vec<String>) -> Result<HashResult, String> {
    let pool = pool(&app).await?;
    app.state::<LibraryState>().cancel_hash.store(false, Ordering::Relaxed);
    let emitter = app.clone();
    let watcher = app.clone();
    hash_tracks(
        &pool,
        &ids,
        &move || watcher.state::<LibraryState>().cancel_hash.load(Ordering::Relaxed),
        &move |progress| {
            let _ = emitter.emit(HASH_PROGRESS_EVENT, progress);
        },
    )
    .await
}

#[tauri::command]
#[specta::specta]
pub async fn library_hash_cancel(app: tauri::AppHandle) -> Result<(), String> {
    app.state::<LibraryState>().cancel_hash.store(true, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn library_duplicates(app: tauri::AppHandle) -> Result<Vec<DuplicateGroup>, String> {
    duplicate_groups(&pool(&app).await?).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_merge_tracks(app: tauri::AppHandle, keep_id: String, remove_ids: Vec<String>) -> Result<MergeResult, String> {
    merge_tracks(&pool(&app).await?, &keep_id, &remove_ids).await
}
