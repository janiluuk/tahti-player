//! Durable local playlists: ordered entries with their own ids, independent
//! of cloud collections. See `migrations/library/0006_playlists.sql`.

use serde::{Deserialize, Serialize};
use specta_typescript::Number;
use sqlx::{FromRow, SqlitePool};

use super::{pool, LibraryTrack};

const PAGE_SIZE: i64 = 200;

#[derive(Debug, Clone, Serialize, specta::Type, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistSummary {
    pub id: String,
    pub name: String,
    #[specta(type = Number<i64>)]
    pub track_count: i64,
    pub duration_sec: f64,
    /// Entries whose file is missing or whose track left the catalog.
    #[specta(type = Number<i64>)]
    pub unavailable_count: i64,
    pub created_at: String,
    pub updated_at: String,
}

/// Enough to recreate an entry exactly: used for undo and for M3U import of
/// files that are not in the catalog yet.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct RawEntry {
    pub entry_id: String,
    pub track_id: Option<String>,
    pub path: String,
    pub title: String,
    pub artist: String,
    pub duration: f64,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistEntry {
    pub entry_id: String,
    #[specta(type = Number<i64>)]
    pub position: i64,
    /// The catalog row, when the entry still points at one.
    pub track: Option<LibraryTrack>,
    /// From the track when linked, otherwise the snapshot taken when added.
    pub title: String,
    pub artist: String,
    pub path: String,
    pub duration: f64,
    /// No linked track, or its file is missing. Never a reason to drop the entry.
    pub unavailable: bool,
}

#[derive(Debug, Serialize, specta::Type)]
pub struct PlaylistPage {
    pub entries: Vec<PlaylistEntry>,
    #[specta(type = Number<i64>)]
    pub total: i64,
}

const SUMMARY_SELECT: &str = "SELECT p.id, p.name, p.created_at, p.updated_at, \
    COUNT(e.id) AS track_count, \
    COALESCE(SUM(COALESCE(t.duration, e.duration)), 0.0) AS duration_sec, \
    COALESCE(SUM(CASE WHEN t.id IS NULL OR t.available = 0 THEN 1 ELSE 0 END), 0) AS unavailable_count \
    FROM library_playlists p \
    LEFT JOIN library_playlist_entries e ON e.playlist_id = p.id \
    LEFT JOIN library_tracks t ON t.id = e.track_id";

fn clean_name(name: &str) -> Result<String, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("Give the playlist a name.".into());
    }
    Ok(name.chars().take(120).collect())
}

fn name_error(error: sqlx::Error) -> String {
    match error.as_database_error().map(|db| db.is_unique_violation()) {
        Some(true) => "A playlist with that name already exists.".into(),
        _ => error.to_string(),
    }
}

async fn touch(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("UPDATE library_playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|err| err.to_string())?;
    Ok(())
}

pub async fn list_playlists(pool: &SqlitePool) -> Result<Vec<PlaylistSummary>, String> {
    sqlx::query_as::<_, PlaylistSummary>(&format!(
        "{SUMMARY_SELECT} GROUP BY p.id ORDER BY p.name COLLATE NOCASE"
    ))
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())
}

pub async fn get_playlist(pool: &SqlitePool, id: &str) -> Result<PlaylistSummary, String> {
    sqlx::query_as::<_, PlaylistSummary>(&format!("{SUMMARY_SELECT} WHERE p.id = ? GROUP BY p.id"))
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|err| err.to_string())?
        .ok_or_else(|| "Playlist not found".to_string())
}

pub async fn create_playlist(pool: &SqlitePool, name: &str) -> Result<PlaylistSummary, String> {
    let name = clean_name(name)?;
    let id = uuid::Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO library_playlists (id, name) VALUES (?, ?)")
        .bind(&id)
        .bind(&name)
        .execute(pool)
        .await
        .map_err(name_error)?;
    get_playlist(pool, &id).await
}

pub async fn rename_playlist(
    pool: &SqlitePool,
    id: &str,
    name: &str,
) -> Result<PlaylistSummary, String> {
    let name = clean_name(name)?;
    let updated = sqlx::query(
        "UPDATE library_playlists SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .bind(&name)
    .bind(id)
    .execute(pool)
    .await
    .map_err(name_error)?;
    if updated.rows_affected() == 0 {
        return Err("Playlist not found".into());
    }
    get_playlist(pool, id).await
}

pub async fn delete_playlist(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM library_playlists WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|err| err.to_string())?;
    Ok(())
}

/// Copies a playlist (entries get fresh ids, order and repeats preserved)
/// under "<name> copy", "<name> copy 2", ...
pub async fn duplicate_playlist(pool: &SqlitePool, id: &str) -> Result<PlaylistSummary, String> {
    let source = get_playlist(pool, id).await?;
    let mut name = format!("{} copy", source.name);
    let mut attempt = 2;
    while sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM library_playlists WHERE name = ?")
        .bind(&name)
        .fetch_one(pool)
        .await
        .map_err(|err| err.to_string())?
        > 0
    {
        name = format!("{} copy {attempt}", source.name);
        attempt += 1;
    }
    let copy = create_playlist(pool, &name).await?;
    let rows = raw_entries_in_order(pool, id).await?;
    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;
    for (position, row) in rows.iter().enumerate() {
        insert_entry(&mut tx, &copy.id, position as i64, &uuid::Uuid::new_v4().to_string(), row).await?;
    }
    tx.commit().await.map_err(|err| err.to_string())?;
    get_playlist(pool, &copy.id).await
}

async fn raw_entries_in_order(pool: &SqlitePool, id: &str) -> Result<Vec<RawEntry>, String> {
    sqlx::query_as::<_, RawEntry>(
        "SELECT id AS entry_id, track_id, path, title, artist, duration FROM library_playlist_entries WHERE playlist_id = ? ORDER BY position, id",
    )
    .bind(id)
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())
}

async fn insert_entry(
    conn: &mut sqlx::SqliteConnection,
    playlist_id: &str,
    position: i64,
    entry_id: &str,
    row: &RawEntry,
) -> Result<(), String> {
    // A track id that no longer exists is stored as an unlinked entry.
    let track_id = match &row.track_id {
        Some(track_id) => sqlx::query_scalar::<_, String>("SELECT id FROM library_tracks WHERE id = ?")
            .bind(track_id)
            .fetch_optional(&mut *conn)
            .await
            .map_err(|err| err.to_string())?,
        None => None,
    };
    sqlx::query("INSERT INTO library_playlist_entries (id, playlist_id, position, track_id, path, title, artist, duration) VALUES (?,?,?,?,?,?,?,?)")
        .bind(entry_id)
        .bind(playlist_id)
        .bind(position)
        .bind(track_id)
        .bind(&row.path)
        .bind(&row.title)
        .bind(&row.artist)
        .bind(row.duration)
        .execute(conn)
        .await
        .map_err(|err| err.to_string())?;
    Ok(())
}

async fn load_order(conn: &mut sqlx::SqliteConnection, id: &str) -> Result<Vec<String>, String> {
    sqlx::query_scalar::<_, String>(
        "SELECT id FROM library_playlist_entries WHERE playlist_id = ? ORDER BY position, id",
    )
    .bind(id)
    .fetch_all(conn)
    .await
    .map_err(|err| err.to_string())
}

/// Rewrites positions to 0..n for `order`, touching only rows that moved.
async fn write_order(
    conn: &mut sqlx::SqliteConnection,
    playlist_id: &str,
    order: &[String],
) -> Result<(), String> {
    for (position, entry_id) in order.iter().enumerate() {
        sqlx::query("UPDATE library_playlist_entries SET position = ? WHERE id = ? AND playlist_id = ? AND position != ?")
            .bind(position as i64)
            .bind(entry_id)
            .bind(playlist_id)
            .bind(position as i64)
            .execute(&mut *conn)
            .await
            .map_err(|err| err.to_string())?;
    }
    Ok(())
}

pub async fn entry_ids(pool: &SqlitePool, id: &str) -> Result<Vec<String>, String> {
    let mut conn = pool.acquire().await.map_err(|err| err.to_string())?;
    load_order(&mut conn, id).await
}

/// Adds one entry per requested track id, in the given order, repeats
/// included. `at` inserts at that index instead of appending. Unknown ids are
/// skipped. Returns how many entries were added.
pub async fn add_tracks(
    pool: &SqlitePool,
    playlist_id: &str,
    track_ids: &[String],
    at: Option<usize>,
) -> Result<usize, String> {
    get_playlist(pool, playlist_id).await?;
    let mut known: std::collections::HashMap<String, LibraryTrack> = std::collections::HashMap::new();
    for chunk in track_ids.chunks(500) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!("SELECT * FROM library_tracks WHERE id IN ({marks})");
        let mut query = sqlx::query_as::<_, LibraryTrack>(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        for track in query.fetch_all(pool).await.map_err(|err| err.to_string())? {
            known.insert(track.id.clone(), track);
        }
    }
    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;
    let mut order = load_order(&mut tx, playlist_id).await?;
    let base = order.len();
    let mut added = Vec::new();
    for track_id in track_ids {
        let Some(track) = known.get(track_id) else { continue };
        let entry_id = uuid::Uuid::new_v4().to_string();
        let row = RawEntry {
            entry_id: entry_id.clone(),
            track_id: Some(track.id.clone()),
            path: track.path.clone(),
            title: track.title.clone(),
            artist: track.artist.clone(),
            duration: track.duration,
        };
        insert_entry(&mut tx, playlist_id, (base + added.len()) as i64, &entry_id, &row).await?;
        added.push(entry_id);
    }
    if let Some(index) = at.filter(|index| *index < base) {
        let tail = order.split_off(index);
        order.extend(added.iter().cloned());
        order.extend(tail);
        write_order(&mut tx, playlist_id, &order).await?;
    }
    tx.commit().await.map_err(|err| err.to_string())?;
    touch(pool, playlist_id).await?;
    Ok(added.len())
}

/// Moves `entry_ids` (keeping their relative order) so the block starts at
/// `to_index`, counted among the entries that are *not* moving.
pub async fn move_entries(
    pool: &SqlitePool,
    playlist_id: &str,
    entry_ids: &[String],
    to_index: usize,
) -> Result<(), String> {
    let wanted: std::collections::HashSet<&String> = entry_ids.iter().collect();
    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;
    let order = load_order(&mut tx, playlist_id).await?;
    let (moved, mut rest): (Vec<String>, Vec<String>) =
        order.into_iter().partition(|id| wanted.contains(id));
    if moved.is_empty() {
        return Ok(());
    }
    let index = to_index.min(rest.len());
    let tail = rest.split_off(index);
    rest.extend(moved);
    rest.extend(tail);
    write_order(&mut tx, playlist_id, &rest).await?;
    tx.commit().await.map_err(|err| err.to_string())?;
    touch(pool, playlist_id).await
}

/// Removes entries and returns them (in playlist order) so the caller can undo.
pub async fn remove_entries(
    pool: &SqlitePool,
    playlist_id: &str,
    entry_ids: &[String],
) -> Result<Vec<RawEntry>, String> {
    let wanted: std::collections::HashSet<&String> = entry_ids.iter().collect();
    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;
    let all = sqlx::query_as::<_, RawEntry>(
        "SELECT id AS entry_id, track_id, path, title, artist, duration FROM library_playlist_entries WHERE playlist_id = ? ORDER BY position, id",
    )
    .bind(playlist_id)
    .fetch_all(&mut *tx)
    .await
    .map_err(|err| err.to_string())?;
    let (removed, kept): (Vec<RawEntry>, Vec<RawEntry>) =
        all.into_iter().partition(|row| wanted.contains(&row.entry_id));
    for row in &removed {
        sqlx::query("DELETE FROM library_playlist_entries WHERE id = ?")
            .bind(&row.entry_id)
            .execute(&mut *tx)
            .await
            .map_err(|err| err.to_string())?;
    }
    let order: Vec<String> = kept.into_iter().map(|row| row.entry_id).collect();
    write_order(&mut tx, playlist_id, &order).await?;
    tx.commit().await.map_err(|err| err.to_string())?;
    touch(pool, playlist_id).await?;
    Ok(removed)
}

/// Undo for removals: re-creates any of `entries` that are gone (same ids)
/// and puts the whole playlist in `order`.
pub async fn restore_entries(
    pool: &SqlitePool,
    playlist_id: &str,
    entries: &[RawEntry],
    order: &[String],
) -> Result<(), String> {
    get_playlist(pool, playlist_id).await?;
    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;
    for (index, row) in entries.iter().enumerate() {
        let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM library_playlist_entries WHERE id = ?")
            .bind(&row.entry_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|err| err.to_string())?;
        if exists == 0 {
            insert_entry(&mut tx, playlist_id, (order.len() + index) as i64, &row.entry_id, row).await?;
        }
    }
    let current = load_order(&mut tx, playlist_id).await?;
    let present: std::collections::HashSet<&String> = current.iter().collect();
    let mut final_order: Vec<String> = order.iter().filter(|id| present.contains(id)).cloned().collect();
    let listed: std::collections::HashSet<String> = final_order.iter().cloned().collect();
    final_order.extend(current.iter().filter(|id| !listed.contains(*id)).cloned());
    write_order(&mut tx, playlist_id, &final_order).await?;
    tx.commit().await.map_err(|err| err.to_string())?;
    touch(pool, playlist_id).await
}

/// Sets the full order (undo of a move). Entries not listed keep their
/// relative order after the listed ones.
pub async fn set_order(pool: &SqlitePool, playlist_id: &str, order: &[String]) -> Result<(), String> {
    restore_entries(pool, playlist_id, &[], order).await
}

/// Links entries that lost their track (removed from the catalog, or imported
/// from a file list) to a catalog track with the same path.
pub async fn relink_entries_by_path(pool: &SqlitePool, playlist_id: &str) -> Result<u64, String> {
    let updated = sqlx::query(
        "UPDATE library_playlist_entries SET track_id = (SELECT t.id FROM library_tracks t WHERE t.path = library_playlist_entries.path) \
         WHERE playlist_id = ? AND track_id IS NULL AND EXISTS (SELECT 1 FROM library_tracks t WHERE t.path = library_playlist_entries.path)",
    )
    .bind(playlist_id)
    .execute(pool)
    .await
    .map_err(|err| err.to_string())?;
    Ok(updated.rows_affected())
}

pub async fn entries_page(
    pool: &SqlitePool,
    playlist_id: &str,
    offset: i64,
) -> Result<PlaylistPage, String> {
    if offset == 0 {
        relink_entries_by_path(pool, playlist_id).await?;
    }
    let total = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM library_playlist_entries WHERE playlist_id = ?",
    )
    .bind(playlist_id)
    .fetch_one(pool)
    .await
    .map_err(|err| err.to_string())?;
    let rows = sqlx::query_as::<_, (String, i64, Option<String>, String, String, String, f64)>(
        "SELECT id, position, track_id, path, title, artist, duration FROM library_playlist_entries WHERE playlist_id = ? ORDER BY position, id LIMIT ? OFFSET ?",
    )
    .bind(playlist_id)
    .bind(PAGE_SIZE)
    .bind(offset.max(0))
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?;
    let track_ids: Vec<&String> = rows.iter().filter_map(|row| row.2.as_ref()).collect();
    let mut tracks: std::collections::HashMap<String, LibraryTrack> = std::collections::HashMap::new();
    if !track_ids.is_empty() {
        let marks = vec!["?"; track_ids.len()].join(",");
        let sql = format!("SELECT * FROM library_tracks WHERE id IN ({marks})");
        let mut query = sqlx::query_as::<_, LibraryTrack>(&sql);
        for id in &track_ids {
            query = query.bind(id.as_str());
        }
        for track in query.fetch_all(pool).await.map_err(|err| err.to_string())? {
            tracks.insert(track.id.clone(), track);
        }
    }
    let entries = rows
        .into_iter()
        .map(|(entry_id, position, track_id, path, title, artist, duration)| {
            let track = track_id.and_then(|id| tracks.get(&id).cloned());
            PlaylistEntry {
                entry_id,
                position,
                unavailable: track.as_ref().map(|t| !t.available).unwrap_or(true),
                title: track.as_ref().map(|t| t.title.clone()).unwrap_or(title),
                artist: track.as_ref().map(|t| t.artist.clone()).unwrap_or(artist),
                duration: track.as_ref().map(|t| t.duration).unwrap_or(duration),
                path: track.as_ref().map(|t| t.path.clone()).unwrap_or(path),
                track,
            }
        })
        .collect();
    Ok(PlaylistPage { entries, total })
}

/// Track ids of a playlist in order, repeats included -- the input for
/// `library_prepare_playback`. Entries without a linked track are skipped
/// (they stay in the playlist, visibly unavailable).
pub async fn playable_track_ids(pool: &SqlitePool, id: &str) -> Result<Vec<String>, String> {
    sqlx::query_scalar::<_, String>(
        "SELECT track_id FROM library_playlist_entries WHERE playlist_id = ? AND track_id IS NOT NULL ORDER BY position, id",
    )
    .bind(id)
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_list(app: tauri::AppHandle) -> Result<Vec<PlaylistSummary>, String> {
    list_playlists(&pool(&app).await?).await
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_create(app: tauri::AppHandle, name: String) -> Result<PlaylistSummary, String> {
    create_playlist(&pool(&app).await?, &name).await
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_rename(
    app: tauri::AppHandle,
    id: String,
    name: String,
) -> Result<PlaylistSummary, String> {
    rename_playlist(&pool(&app).await?, &id, &name).await
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_duplicate(app: tauri::AppHandle, id: String) -> Result<PlaylistSummary, String> {
    duplicate_playlist(&pool(&app).await?, &id).await
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_delete(app: tauri::AppHandle, id: String) -> Result<(), String> {
    delete_playlist(&pool(&app).await?, &id).await
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_add_tracks(
    app: tauri::AppHandle,
    id: String,
    track_ids: Vec<String>,
    at: Option<u32>,
) -> Result<u32, String> {
    add_tracks(&pool(&app).await?, &id, &track_ids, at.map(|value| value as usize))
        .await
        .map(|added| added as u32)
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_entries(
    app: tauri::AppHandle,
    id: String,
    offset: i32,
) -> Result<PlaylistPage, String> {
    entries_page(&pool(&app).await?, &id, offset.into()).await
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_entry_ids(app: tauri::AppHandle, id: String) -> Result<Vec<String>, String> {
    entry_ids(&pool(&app).await?, &id).await
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_move_entries(
    app: tauri::AppHandle,
    id: String,
    entry_ids: Vec<String>,
    to_index: u32,
) -> Result<(), String> {
    move_entries(&pool(&app).await?, &id, &entry_ids, to_index as usize).await
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_remove_entries(
    app: tauri::AppHandle,
    id: String,
    entry_ids: Vec<String>,
) -> Result<Vec<RawEntry>, String> {
    remove_entries(&pool(&app).await?, &id, &entry_ids).await
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_restore_entries(
    app: tauri::AppHandle,
    id: String,
    entries: Vec<RawEntry>,
    order: Vec<String>,
) -> Result<(), String> {
    restore_entries(&pool(&app).await?, &id, &entries, &order).await
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_set_order(
    app: tauri::AppHandle,
    id: String,
    order: Vec<String>,
) -> Result<(), String> {
    set_order(&pool(&app).await?, &id, &order).await
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_track_ids(app: tauri::AppHandle, id: String) -> Result<Vec<String>, String> {
    playable_track_ids(&pool(&app).await?, &id).await
}
