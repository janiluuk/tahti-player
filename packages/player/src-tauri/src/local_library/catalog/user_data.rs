//! User data kept beside the tags: ratings, colors and tags, with snapshots
//! for undo.

use super::*;

// ---------------------------------------------------------------------------
// Ratings, color labels, tags, plays
// ---------------------------------------------------------------------------

/// Enough to put a track's user data back exactly (undo).
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct UserDataSnapshot {
    pub track_id: String,
    #[specta(type = Number<i64>)]
    pub rating: i64,
    pub color: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct TagCount {
    pub name: String,
    #[specta(type = Number<i64>)]
    pub tracks: i64,
}

pub(super) async fn snapshot_user_data(
    conn: &mut SqliteConnection,
    ids: &[String],
) -> Result<Vec<UserDataSnapshot>, sqlx::Error> {
    let mut out = Vec::with_capacity(ids.len());
    for chunk in ids.chunks(CHUNK) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!("SELECT id, rating, color FROM library_tracks WHERE id IN ({marks})");
        let mut query = sqlx::query(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        let mut by_id: HashMap<String, UserDataSnapshot> = HashMap::new();
        for row in query.fetch_all(&mut *conn).await? {
            let id: String = row.get(0);
            by_id.insert(id.clone(), UserDataSnapshot { track_id: id, rating: row.get(1), color: row.get(2), tags: Vec::new() });
        }
        let sql = format!("SELECT tt.track_id, t.name FROM library_track_tags tt JOIN library_tags t ON t.id = tt.tag_id WHERE tt.track_id IN ({marks}) ORDER BY t.name COLLATE NOCASE");
        let mut query = sqlx::query(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        for row in query.fetch_all(&mut *conn).await? {
            if let Some(snapshot) = by_id.get_mut(&row.get::<String, _>(0)) {
                snapshot.tags.push(row.get(1));
            }
        }
        // Keep the caller's order.
        for id in chunk {
            if let Some(snapshot) = by_id.remove(id) {
                out.push(snapshot);
            }
        }
    }
    Ok(out)
}

pub async fn user_data(pool: &SqlitePool, ids: &[String]) -> Result<Vec<UserDataSnapshot>, String> {
    let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;
    snapshot_user_data(&mut conn, ids).await.map_err(|e| e.to_string())
}

pub(super) fn clean_tag(name: &str) -> Result<String, String> {
    let name = name.split_whitespace().collect::<Vec<_>>().join(" ");
    if name.is_empty() {
        return Err("Enter a tag name.".into());
    }
    if name.chars().count() > 40 {
        return Err("Tag names can be up to 40 characters.".into());
    }
    Ok(name)
}

pub async fn set_rating(pool: &SqlitePool, ids: &[String], rating: i64) -> Result<Vec<UserDataSnapshot>, String> {
    if !(0..=5).contains(&rating) {
        return Err("Rating must be 0 to 5 stars.".into());
    }
    update_user_column(pool, ids, "rating", rating.into()).await
}

pub async fn set_color(pool: &SqlitePool, ids: &[String], color: &str) -> Result<Vec<UserDataSnapshot>, String> {
    if !color.is_empty() && !COLORS.contains(&color) {
        return Err(format!("Unknown color \"{color}\"."));
    }
    update_user_column(pool, ids, "color", color.to_owned().into()).await
}

pub(super) enum UserValue {
    Int(i64),
    Text(String),
}

impl From<i64> for UserValue {
    fn from(v: i64) -> Self {
        UserValue::Int(v)
    }
}

impl From<String> for UserValue {
    fn from(v: String) -> Self {
        UserValue::Text(v)
    }
}

pub(super) async fn update_user_column(
    pool: &SqlitePool,
    ids: &[String],
    column: &'static str,
    value: UserValue,
) -> Result<Vec<UserDataSnapshot>, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let before = snapshot_user_data(&mut tx, ids).await.map_err(|e| e.to_string())?;
    for chunk in ids.chunks(CHUNK) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!("UPDATE library_tracks SET {column}=? WHERE id IN ({marks})");
        let mut query = sqlx::query(&sql);
        query = match &value {
            UserValue::Int(v) => query.bind(*v),
            UserValue::Text(v) => query.bind(v.clone()),
        };
        for id in chunk {
            query = query.bind(id);
        }
        query.execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(before)
}

pub(super) async fn tag_id_for(conn: &mut SqliteConnection, name: &str) -> Result<String, sqlx::Error> {
    if let Some(id) = sqlx::query_scalar::<_, String>("SELECT id FROM library_tags WHERE name=?")
        .bind(name)
        .fetch_optional(&mut *conn)
        .await?
    {
        return Ok(id);
    }
    let id = uuid::Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO library_tags (id, name) VALUES (?,?)")
        .bind(&id)
        .bind(name)
        .execute(&mut *conn)
        .await?;
    Ok(id)
}

pub async fn add_tag(pool: &SqlitePool, ids: &[String], name: &str) -> Result<Vec<UserDataSnapshot>, String> {
    let name = clean_tag(name)?;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let before = snapshot_user_data(&mut tx, ids).await.map_err(|e| e.to_string())?;
    let tag_id = tag_id_for(&mut tx, &name).await.map_err(|e| e.to_string())?;
    for id in ids {
        sqlx::query("INSERT OR IGNORE INTO library_track_tags (track_id, tag_id) SELECT id, ? FROM library_tracks WHERE id=?")
            .bind(&tag_id)
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(before)
}

pub async fn remove_tag(pool: &SqlitePool, ids: &[String], name: &str) -> Result<Vec<UserDataSnapshot>, String> {
    let name = clean_tag(name)?;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let before = snapshot_user_data(&mut tx, ids).await.map_err(|e| e.to_string())?;
    for chunk in ids.chunks(CHUNK) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!("DELETE FROM library_track_tags WHERE track_id IN ({marks}) AND tag_id IN (SELECT id FROM library_tags WHERE name=?)");
        let mut query = sqlx::query(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        query.bind(&name).execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }
    // A tag nobody carries any more disappears from the list.
    sqlx::query("DELETE FROM library_tags WHERE id NOT IN (SELECT tag_id FROM library_track_tags)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(before)
}

/// Puts rating, color and tags back exactly as `snapshots` recorded them.
pub async fn restore_user_data(pool: &SqlitePool, snapshots: &[UserDataSnapshot]) -> Result<usize, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let mut restored = 0usize;
    for snapshot in snapshots {
        let updated = sqlx::query("UPDATE library_tracks SET rating=?, color=? WHERE id=?")
            .bind(snapshot.rating)
            .bind(&snapshot.color)
            .bind(&snapshot.track_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?
            .rows_affected();
        if updated == 0 {
            continue;
        }
        sqlx::query("DELETE FROM library_track_tags WHERE track_id=?")
            .bind(&snapshot.track_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        for name in &snapshot.tags {
            let tag_id = tag_id_for(&mut tx, name).await.map_err(|e| e.to_string())?;
            sqlx::query("INSERT OR IGNORE INTO library_track_tags (track_id, tag_id) VALUES (?,?)")
                .bind(&snapshot.track_id)
                .bind(&tag_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }
        restored += 1;
    }
    sqlx::query("DELETE FROM library_tags WHERE id NOT IN (SELECT tag_id FROM library_track_tags)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(restored)
}

pub async fn list_tags(pool: &SqlitePool) -> Result<Vec<TagCount>, String> {
    let rows = sqlx::query("SELECT t.name, COUNT(tt.track_id) FROM library_tags t LEFT JOIN library_track_tags tt ON tt.tag_id = t.id GROUP BY t.id ORDER BY t.name COLLATE NOCASE")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|row| TagCount { name: row.get(0), tracks: row.get(1) }).collect())
}

#[tauri::command]
#[specta::specta]
pub async fn library_user_data(app: tauri::AppHandle, ids: Vec<String>) -> Result<Vec<UserDataSnapshot>, String> {
    user_data(&pool(&app).await?, &ids).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_set_rating(app: tauri::AppHandle, ids: Vec<String>, rating: u32) -> Result<Vec<UserDataSnapshot>, String> {
    set_rating(&pool(&app).await?, &ids, i64::from(rating)).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_set_color(app: tauri::AppHandle, ids: Vec<String>, color: String) -> Result<Vec<UserDataSnapshot>, String> {
    set_color(&pool(&app).await?, &ids, &color).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_add_tag(app: tauri::AppHandle, ids: Vec<String>, name: String) -> Result<Vec<UserDataSnapshot>, String> {
    add_tag(&pool(&app).await?, &ids, &name).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_remove_tag(app: tauri::AppHandle, ids: Vec<String>, name: String) -> Result<Vec<UserDataSnapshot>, String> {
    remove_tag(&pool(&app).await?, &ids, &name).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_restore_user_data(app: tauri::AppHandle, snapshots: Vec<UserDataSnapshot>) -> Result<u32, String> {
    restore_user_data(&pool(&app).await?, &snapshots).await.map(|n| n as u32)
}

#[tauri::command]
#[specta::specta]
pub async fn library_list_tags(app: tauri::AppHandle) -> Result<Vec<TagCount>, String> {
    list_tags(&pool(&app).await?).await
}
