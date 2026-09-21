//! Catalog editing and organization (desktop-pro-library.md Phase 4):
//! metadata edits kept apart from extracted tags, ratings, colors, tags and
//! play counts, and exact/similar duplicate review.
//! See `migrations/library/0007_catalog_editing.sql`.
//!
//! Edited values live in the `library_tracks` columns (search, sort and
//! indexes are unchanged). `library_track_overrides` records which fields the
//! user set and what the file's own tag said, so a rescan re-applies the edit
//! (`reapply_overrides`) and "revert to file tag" is exact.

use std::collections::{BTreeMap, HashMap, HashSet};
use std::sync::atomic::Ordering;

use serde::{Deserialize, Serialize};
use specta_typescript::Number;
use sqlx::{Row, SqliteConnection, SqlitePool};
use tauri::{Emitter, Manager};

use super::{pool, LibraryState, LibraryTrack};

/// Color labels a track can carry. A closed set, so the UI can render a fixed
/// palette and a filter never has to guess.
pub const COLORS: [&str; 7] = ["red", "orange", "yellow", "green", "blue", "purple", "gray"];

const COMMENT_LIMIT: usize = 500;
const CHUNK: usize = 500;
const HASH_PROGRESS_EVENT: &str = "library://hash-progress";

/// Tag fields the user can edit. A closed enum: the column name is chosen
/// from fixed SQL, never from user text.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum EditField {
    Title,
    Artist,
    Album,
    AlbumArtist,
    Genre,
    Comment,
    Year,
    TrackNo,
    DiscNo,
}

impl EditField {
    pub const ALL: [EditField; 9] = [
        EditField::Title,
        EditField::Artist,
        EditField::Album,
        EditField::AlbumArtist,
        EditField::Genre,
        EditField::Comment,
        EditField::Year,
        EditField::TrackNo,
        EditField::DiscNo,
    ];

    pub fn column(self) -> &'static str {
        match self {
            EditField::Title => "title",
            EditField::Artist => "artist",
            EditField::Album => "album",
            EditField::AlbumArtist => "album_artist",
            EditField::Genre => "genre",
            EditField::Comment => "comment",
            EditField::Year => "year",
            EditField::TrackNo => "track_no",
            EditField::DiscNo => "disc_no",
        }
    }

    fn from_column(column: &str) -> Option<EditField> {
        Self::ALL.into_iter().find(|field| field.column() == column)
    }

    fn is_number(self) -> bool {
        matches!(self, EditField::Year | EditField::TrackNo | EditField::DiscNo)
    }

    /// The value as stored, in the text form overrides use ('' = empty/NULL).
    pub fn value_of(self, track: &LibraryTrack) -> String {
        let number = |n: Option<i64>| n.map(|n| n.to_string()).unwrap_or_default();
        match self {
            EditField::Title => track.title.clone(),
            EditField::Artist => track.artist.clone(),
            EditField::Album => track.album.clone(),
            EditField::AlbumArtist => track.album_artist.clone(),
            EditField::Genre => track.genre.clone(),
            EditField::Comment => track.comment.clone(),
            EditField::Year => number(track.year),
            EditField::TrackNo => number(track.track_no),
            EditField::DiscNo => number(track.disc_no),
        }
    }

    /// Validates and normalizes user input into the stored text form.
    fn normalize(self, raw: &str) -> Result<String, String> {
        let trimmed = raw.trim();
        match self {
            EditField::Title if trimmed.is_empty() => Err("A track needs a title.".into()),
            EditField::Comment => Ok(trimmed.chars().take(COMMENT_LIMIT).collect()),
            EditField::Year | EditField::TrackNo | EditField::DiscNo => {
                if trimmed.is_empty() {
                    return Ok(String::new());
                }
                let number: i64 = trimmed
                    .parse()
                    .map_err(|_| format!("\"{trimmed}\" is not a whole number."))?;
                let (low, high) = if self == EditField::Year { (1000, 9999) } else { (0, 9999) };
                if !(low..=high).contains(&number) {
                    return Err(format!("Enter a number from {low} to {high}."));
                }
                Ok(number.to_string())
            }
            _ => Ok(trimmed.to_owned()),
        }
    }
}

/// One requested change. `value: None` puts the file's own tag back.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FieldEdit {
    pub field: EditField,
    pub value: Option<String>,
}

/// What one field of one track looked like before an edit; enough to undo it
/// exactly, including whether it was an override and what the file's tag said.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FieldSnapshot {
    pub track_id: String,
    pub field: EditField,
    pub value: String,
    pub extracted: Option<String>,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EditExample {
    pub track_id: String,
    pub title: String,
    pub field: EditField,
    pub before: String,
    pub after: String,
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EditPreview {
    /// Tracks that would actually change.
    #[specta(type = Number<usize>)]
    pub tracks_changed: usize,
    /// Tracks the edit would leave as they are.
    #[specta(type = Number<usize>)]
    pub tracks_unchanged: usize,
    #[specta(type = Number<usize>)]
    pub fields_changed: usize,
    /// First few changes, for the "affected tracks" preview.
    pub examples: Vec<EditExample>,
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EditOutcome {
    #[specta(type = Number<usize>)]
    pub tracks_changed: usize,
    pub undo: Vec<FieldSnapshot>,
}

pub(super) struct Change {
    snapshot: FieldSnapshot,
    title: String,
    after: String,
}

async fn current_value(
    conn: &mut SqliteConnection,
    id: &str,
    field: EditField,
) -> Result<Option<(String, String)>, sqlx::Error> {
    let sql = format!(
        "SELECT title, COALESCE(CAST({} AS TEXT), '') FROM library_tracks WHERE id=?",
        field.column()
    );
    let row = sqlx::query(&sql).bind(id).fetch_optional(&mut *conn).await?;
    Ok(row.map(|row| (row.get::<String, _>(0), row.get::<String, _>(1))))
}

async fn write_value(
    conn: &mut SqliteConnection,
    id: &str,
    field: EditField,
    value: &str,
) -> Result<(), sqlx::Error> {
    let sql = format!("UPDATE library_tracks SET {}=? WHERE id=?", field.column());
    if field.is_number() {
        let number = (!value.is_empty()).then(|| value.parse::<i64>().unwrap_or_default());
        sqlx::query(&sql).bind(number).bind(id).execute(&mut *conn).await?;
    } else {
        sqlx::query(&sql).bind(value).bind(id).execute(&mut *conn).await?;
    }
    Ok(())
}

async fn set_override(
    conn: &mut SqliteConnection,
    id: &str,
    field: EditField,
    value: &str,
    extracted: Option<&str>,
) -> Result<(), sqlx::Error> {
    match extracted {
        Some(extracted) => {
            sqlx::query("INSERT INTO library_track_overrides (track_id, field, value, extracted) VALUES (?,?,?,?) ON CONFLICT(track_id, field) DO UPDATE SET value=excluded.value, extracted=excluded.extracted, updated_at=CURRENT_TIMESTAMP")
                .bind(id).bind(field.column()).bind(value).bind(extracted)
                .execute(&mut *conn).await?;
        }
        None => {
            sqlx::query("DELETE FROM library_track_overrides WHERE track_id=? AND field=?")
                .bind(id).bind(field.column())
                .execute(&mut *conn).await?;
        }
    }
    Ok(())
}

/// Applies `edits` to `ids` on `conn` and reports each real change. Runs
/// inside the caller's transaction, so a preview can apply it and roll back.
pub(super) async fn apply_edits_on(
    conn: &mut SqliteConnection,
    ids: &[String],
    edits: &[FieldEdit],
) -> Result<Vec<Change>, String> {
    // Validate everything before touching a row.
    let mut wanted: Vec<(EditField, Option<String>)> = Vec::new();
    for edit in edits {
        let value = match &edit.value {
            Some(raw) => Some(edit.field.normalize(raw)?),
            None => None,
        };
        wanted.push((edit.field, value));
    }
    let mut changes = Vec::new();
    for id in ids {
        for (field, target) in &wanted {
            let Some((title, current)) = current_value(conn, id, *field).await.map_err(|e| e.to_string())? else {
                continue;
            };
            let existing: Option<String> = sqlx::query_scalar(
                "SELECT extracted FROM library_track_overrides WHERE track_id=? AND field=?",
            )
            .bind(id)
            .bind(field.column())
            .fetch_optional(&mut *conn)
            .await
            .map_err(|e| e.to_string())?;
            let (new_value, file_value) = match target {
                Some(value) => (value.clone(), existing.clone().unwrap_or_else(|| current.clone())),
                None => match &existing {
                    Some(extracted) => (extracted.clone(), extracted.clone()),
                    None => continue,
                },
            };
            let will_override = new_value != file_value;
            if new_value == current && will_override == existing.is_some() {
                continue;
            }
            let snapshot = FieldSnapshot {
                track_id: id.clone(),
                field: *field,
                value: current,
                extracted: existing,
            };
            write_value(conn, id, *field, &new_value).await.map_err(|e| e.to_string())?;
            let extracted = will_override.then_some(file_value.as_str());
            set_override(conn, id, *field, &new_value, extracted)
                .await
                .map_err(|e| e.to_string())?;
            changes.push(Change { snapshot, title, after: new_value });
        }
    }
    Ok(changes)
}

pub async fn edit_preview(
    pool: &SqlitePool,
    ids: &[String],
    edits: &[FieldEdit],
) -> Result<EditPreview, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let changes = apply_edits_on(&mut tx, ids, edits).await;
    // Nothing is kept: the preview is the real edit, rolled back.
    tx.rollback().await.map_err(|e| e.to_string())?;
    let changes = changes?;
    let changed: HashSet<&str> = changes.iter().map(|c| c.snapshot.track_id.as_str()).collect();
    Ok(EditPreview {
        tracks_changed: changed.len(),
        tracks_unchanged: ids.len().saturating_sub(changed.len()),
        fields_changed: changes.len(),
        examples: changes
            .iter()
            .take(8)
            .map(|c| EditExample {
                track_id: c.snapshot.track_id.clone(),
                title: c.title.clone(),
                field: c.snapshot.field,
                before: c.snapshot.value.clone(),
                after: c.after.clone(),
            })
            .collect(),
    })
}

pub async fn apply_edits(
    pool: &SqlitePool,
    ids: &[String],
    edits: &[FieldEdit],
) -> Result<EditOutcome, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let changes = apply_edits_on(&mut tx, ids, edits).await?;
    tx.commit().await.map_err(|e| e.to_string())?;
    let changed: HashSet<&str> = changes.iter().map(|c| c.snapshot.track_id.as_str()).collect();
    Ok(EditOutcome {
        tracks_changed: changed.len(),
        undo: changes.into_iter().map(|c| c.snapshot).collect(),
    })
}

/// Puts fields back exactly as a previous `apply_edits` found them.
pub async fn restore_edits(pool: &SqlitePool, snapshots: &[FieldSnapshot]) -> Result<usize, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let mut restored = 0usize;
    // Each snapshot is the state before its own edit, and a track/field
    // appears once per apply, so order does not matter.
    for snapshot in snapshots {
        if current_value(&mut tx, &snapshot.track_id, snapshot.field)
            .await
            .map_err(|e| e.to_string())?
            .is_none()
        {
            continue;
        }
        write_value(&mut tx, &snapshot.track_id, snapshot.field, &snapshot.value)
            .await
            .map_err(|e| e.to_string())?;
        set_override(&mut tx, &snapshot.track_id, snapshot.field, &snapshot.value, snapshot.extracted.as_deref())
            .await
            .map_err(|e| e.to_string())?;
        restored += 1;
    }
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(restored)
}

/// After a (re)import wrote fresh extracted tags over a row, put the user's
/// edits back and remember the new extracted values they now sit on top of.
/// An edit that now equals the file's tag stops being an override.
pub(crate) async fn reapply_overrides(
    conn: &mut SqliteConnection,
    extracted: &LibraryTrack,
) -> Result<(), sqlx::Error> {
    let rows = sqlx::query(
        "SELECT o.track_id, o.field, o.value FROM library_track_overrides o JOIN library_tracks t ON t.id = o.track_id WHERE t.path = ?",
    )
    .bind(&extracted.path)
    .fetch_all(&mut *conn)
    .await?;
    for row in rows {
        let id: String = row.get(0);
        let Some(field) = EditField::from_column(&row.get::<String, _>(1)) else {
            continue;
        };
        let value: String = row.get(2);
        let fresh = field.value_of(extracted);
        if fresh == value {
            set_override(conn, &id, field, &value, None).await?;
        } else {
            write_value(conn, &id, field, &value).await?;
            set_override(conn, &id, field, &value, Some(&fresh)).await?;
        }
    }
    Ok(())
}

/// A field across a selection, for mixed-value indicators in the editor.
#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FieldSummary {
    pub field: EditField,
    /// The shared value when every selected track agrees ('' when they all
    /// agree on empty); meaningless when `distinct > 1`.
    pub value: String,
    #[specta(type = Number<usize>)]
    pub distinct: usize,
    /// How many of the selected tracks hold a hand-edited value here.
    #[specta(type = Number<usize>)]
    pub edited: usize,
}

pub async fn field_summary(pool: &SqlitePool, ids: &[String]) -> Result<Vec<FieldSummary>, String> {
    let mut values: HashMap<EditField, BTreeMap<String, usize>> = HashMap::new();
    let mut edited: HashMap<EditField, usize> = HashMap::new();
    for chunk in ids.chunks(CHUNK) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!("SELECT * FROM library_tracks WHERE id IN ({marks})");
        let mut query = sqlx::query_as::<_, LibraryTrack>(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        for track in query.fetch_all(pool).await.map_err(|e| e.to_string())? {
            for field in EditField::ALL {
                *values.entry(field).or_default().entry(field.value_of(&track)).or_default() += 1;
            }
        }
        let sql = format!("SELECT field FROM library_track_overrides WHERE track_id IN ({marks})");
        let mut query = sqlx::query_scalar::<_, String>(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        for column in query.fetch_all(pool).await.map_err(|e| e.to_string())? {
            if let Some(field) = EditField::from_column(&column) {
                *edited.entry(field).or_default() += 1;
            }
        }
    }
    Ok(EditField::ALL
        .into_iter()
        .map(|field| {
            let seen = values.remove(&field).unwrap_or_default();
            FieldSummary {
                field,
                distinct: seen.len(),
                value: if seen.len() == 1 { seen.into_keys().next().unwrap_or_default() } else { String::new() },
                edited: edited.get(&field).copied().unwrap_or(0),
            }
        })
        .collect())
}

/// Where one field's current value came from.
#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FieldProvenance {
    pub field: EditField,
    pub value: String,
    /// True when the user set it by hand.
    pub edited: bool,
    /// What the file's own tag says (equals `value` when not edited).
    pub file_value: String,
    pub edited_at: Option<String>,
}

pub async fn provenance(pool: &SqlitePool, id: &str) -> Result<Vec<FieldProvenance>, String> {
    let track = sqlx::query_as::<_, LibraryTrack>("SELECT * FROM library_tracks WHERE id=?")
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Track is not in the library")?;
    let rows = sqlx::query("SELECT field, extracted, updated_at FROM library_track_overrides WHERE track_id=?")
        .bind(id)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    let mut overrides: HashMap<EditField, (String, String)> = HashMap::new();
    for row in rows {
        if let Some(field) = EditField::from_column(&row.get::<String, _>(0)) {
            overrides.insert(field, (row.get(1), row.get(2)));
        }
    }
    Ok(EditField::ALL
        .into_iter()
        .map(|field| {
            let value = field.value_of(&track);
            match overrides.remove(&field) {
                Some((file_value, at)) => FieldProvenance { field, value, edited: true, file_value, edited_at: Some(at) },
                None => FieldProvenance { field, file_value: value.clone(), value, edited: false, edited_at: None },
            }
        })
        .collect())
}

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

async fn snapshot_user_data(
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

fn clean_tag(name: &str) -> Result<String, String> {
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

enum UserValue {
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

async fn update_user_column(
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

async fn tag_id_for(conn: &mut SqliteConnection, name: &str) -> Result<String, sqlx::Error> {
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

fn stamp_of(meta: &std::fs::Metadata) -> (i64, i64) {
    let mtime = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    (meta.len() as i64, mtime)
}

fn hash_file(path: &str) -> Result<(String, i64, i64), String> {
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

fn file_stamp(path: &str) -> Option<(i64, i64)> {
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

fn similarity_key(track: &LibraryTrack) -> String {
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

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

#[tauri::command]
#[specta::specta]
pub async fn library_edit_preview(app: tauri::AppHandle, ids: Vec<String>, edits: Vec<FieldEdit>) -> Result<EditPreview, String> {
    edit_preview(&pool(&app).await?, &ids, &edits).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_edit_tracks(app: tauri::AppHandle, ids: Vec<String>, edits: Vec<FieldEdit>) -> Result<EditOutcome, String> {
    apply_edits(&pool(&app).await?, &ids, &edits).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_restore_edits(app: tauri::AppHandle, snapshots: Vec<FieldSnapshot>) -> Result<u32, String> {
    restore_edits(&pool(&app).await?, &snapshots).await.map(|n| n as u32)
}

#[tauri::command]
#[specta::specta]
pub async fn library_field_summary(app: tauri::AppHandle, ids: Vec<String>) -> Result<Vec<FieldSummary>, String> {
    field_summary(&pool(&app).await?, &ids).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_provenance(app: tauri::AppHandle, id: String) -> Result<Vec<FieldProvenance>, String> {
    provenance(&pool(&app).await?, &id).await
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

#[tauri::command]
#[specta::specta]
pub async fn library_record_play(app: tauri::AppHandle, id: String) -> Result<(), String> {
    record_play(&pool(&app).await?, &id).await
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
