//! Hand edits of track metadata: field overrides with provenance, preview,
//! apply/undo and re-applying overrides after a re-read.

use super::*;

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

pub(crate) struct Change {
    snapshot: FieldSnapshot,
    title: String,
    after: String,
}

pub(crate) async fn current_value(
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

pub(crate) async fn write_value(
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

pub(crate) async fn set_override(
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
pub(crate) async fn apply_edits_on(
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
