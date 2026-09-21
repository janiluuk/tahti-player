//! Local listening history.

use super::*;

/// Counts one listen: play count +1, the time it happened (UTC) and a row in
/// the local listening history. Local only; nothing here is sent to any server.
pub async fn record_play(pool: &SqlitePool, id: &str) -> Result<(), String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let updated = sqlx::query("UPDATE library_tracks SET play_count = play_count + 1, last_played_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id=?")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?
        .rows_affected();
    if updated > 0 {
        sqlx::query("INSERT INTO library_play_log (track_id, title, artist) SELECT id, title, artist FROM library_tracks WHERE id=?")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Debug, Clone, Serialize, specta::Type, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PlayLogEntry {
    #[specta(type = Number<i64>)]
    pub id: i64,
    pub track_id: Option<String>,
    pub title: String,
    pub artist: String,
    /// UTC `YYYY-MM-DD HH:MM:SS`.
    pub played_at: String,
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PlayLogPage {
    pub entries: Vec<PlayLogEntry>,
    #[specta(type = Number<i64>)]
    pub total: i64,
}

/// Newest first, 100 per page.
pub async fn play_history(pool: &SqlitePool, offset: i64) -> Result<PlayLogPage, String> {
    let total = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM library_play_log")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;
    let entries = sqlx::query_as::<_, PlayLogEntry>("SELECT id, track_id, title, artist, played_at FROM library_play_log ORDER BY played_at DESC, id DESC LIMIT 100 OFFSET ?")
        .bind(offset.max(0))
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(PlayLogPage { entries, total })
}

pub async fn clear_play_history(pool: &SqlitePool) -> Result<(), String> {
    sqlx::query("DELETE FROM library_play_log")
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn library_record_play(app: tauri::AppHandle, id: String) -> Result<(), String> {
    record_play(&pool(&app).await?, &id).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_play_history(app: tauri::AppHandle, offset: u32) -> Result<PlayLogPage, String> {
    play_history(&pool(&app).await?, i64::from(offset)).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_clear_play_history(app: tauri::AppHandle) -> Result<(), String> {
    clear_play_history(&pool(&app).await?).await
}
