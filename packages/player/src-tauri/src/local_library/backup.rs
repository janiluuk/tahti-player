//! Catalog backup and restore (desktop-pro-library.md Phase 4).
//!
//! A backup is one portable JSON file holding everything the *user* made:
//! watched folders, which files are in the catalog, hand edits, ratings,
//! color labels, tags, play counts and playlists. It stores paths, never
//! audio: backing up the catalog is not backing up the music. Extracted tags
//! are not stored either; a restore re-reads them from the files.
//!
//! Restoring into another machine or profile goes through a *root mapping*
//! (old folder -> new folder), previewed before anything is written.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use specta_typescript::Number;
use sqlx::{Row, SqlitePool};
use tauri_plugin_dialog::DialogExt;

use super::catalog::{apply_edits_on, EditField, FieldEdit};
use super::playlists::{insert_entry, RawEntry};
use super::{add_root, import_batch, pool, ImportResult};

const FORMAT: &str = "tahti-library-backup";
const VERSION: u32 = 1;
const IMPORT_CHUNK: usize = 64;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackupFile {
    format: String,
    version: u32,
    created_at: String,
    roots: Vec<String>,
    tracks: Vec<BackupTrack>,
    playlists: Vec<BackupPlaylist>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackupTrack {
    path: String,
    #[serde(default)]
    rating: i64,
    #[serde(default)]
    color: String,
    #[serde(default)]
    play_count: i64,
    #[serde(default)]
    last_played_at: Option<String>,
    #[serde(default)]
    tags: Vec<String>,
    /// Hand-edited fields: (column name, value).
    #[serde(default)]
    edits: Vec<(String, String)>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackupPlaylist {
    name: String,
    entries: Vec<BackupEntry>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BackupEntry {
    path: String,
    title: String,
    artist: String,
    duration: f64,
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BackupSummary {
    pub path: String,
    #[specta(type = Number<usize>)]
    pub tracks: usize,
    #[specta(type = Number<usize>)]
    pub roots: usize,
    #[specta(type = Number<usize>)]
    pub playlists: usize,
    /// Hand-edited tag values included.
    #[specta(type = Number<usize>)]
    pub edits: usize,
}

/// Old folder -> new folder. Applied to a path when it starts with `from`
/// (on a folder boundary); the longest matching `from` wins.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct RootMapping {
    pub from: String,
    pub to: String,
}

fn is_sep(c: char) -> bool {
    c == '/' || c == '\\'
}

/// `path` starts with the folder `prefix` (ASCII case-insensitive, on a folder
/// boundary). Slices with `get`, so a multi-byte character straddling the
/// prefix length is a mismatch, never a panic.
fn has_prefix(path: &str, prefix: &str) -> bool {
    match (path.get(..prefix.len()), path.get(prefix.len()..)) {
        (Some(head), Some(rest)) => {
            head.eq_ignore_ascii_case(prefix) && rest.chars().next().into_iter().all(is_sep)
        }
        _ => false,
    }
}

fn map_path(path: &str, mappings: &[RootMapping]) -> String {
    let best = mappings
        .iter()
        .filter(|m| !m.from.is_empty() && !m.to.is_empty())
        .filter(|m| {
            let from = m.from.trim_end_matches(is_sep);
            has_prefix(path, from)
        })
        .max_by_key(|m| m.from.trim_end_matches(is_sep).len());
    match best {
        None => path.to_owned(),
        Some(m) => {
            let from = m.from.trim_end_matches(is_sep);
            let rest = path[from.len()..].trim_start_matches(is_sep);
            let mut out = PathBuf::from(m.to.trim_end_matches(is_sep));
            for part in rest.split(is_sep).filter(|p| !p.is_empty()) {
                out.push(part);
            }
            out.to_string_lossy().into_owned()
        }
    }
}

pub async fn export_backup(pool: &SqlitePool, dest: &Path) -> Result<BackupSummary, String> {
    let roots: Vec<String> = sqlx::query_scalar("SELECT path FROM library_roots ORDER BY path")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    let rows = sqlx::query("SELECT id, path, rating, color, play_count, last_played_at FROM library_tracks ORDER BY path")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    let mut edits: HashMap<String, Vec<(String, String)>> = HashMap::new();
    for row in sqlx::query("SELECT track_id, field, value FROM library_track_overrides")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
    {
        edits.entry(row.get(0)).or_default().push((row.get(1), row.get(2)));
    }
    let mut tags: HashMap<String, Vec<String>> = HashMap::new();
    for row in sqlx::query("SELECT tt.track_id, t.name FROM library_track_tags tt JOIN library_tags t ON t.id = tt.tag_id ORDER BY t.name COLLATE NOCASE")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
    {
        tags.entry(row.get(0)).or_default().push(row.get(1));
    }
    let mut edit_count = 0usize;
    let tracks: Vec<BackupTrack> = rows
        .into_iter()
        .map(|row| {
            let id: String = row.get(0);
            let track_edits = edits.remove(&id).unwrap_or_default();
            edit_count += track_edits.len();
            BackupTrack {
                path: row.get(1),
                rating: row.get(2),
                color: row.get(3),
                play_count: row.get(4),
                last_played_at: row.get(5),
                tags: tags.remove(&id).unwrap_or_default(),
                edits: track_edits,
            }
        })
        .collect();
    let playlist_rows = sqlx::query("SELECT id, name FROM library_playlists ORDER BY name COLLATE NOCASE")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    let mut playlists = Vec::new();
    for row in playlist_rows {
        let id: String = row.get(0);
        let entries = sqlx::query(
            "SELECT COALESCE(t.path, e.path), COALESCE(t.title, e.title), COALESCE(t.artist, e.artist), COALESCE(t.duration, e.duration) \
             FROM library_playlist_entries e LEFT JOIN library_tracks t ON t.id = e.track_id \
             WHERE e.playlist_id = ? ORDER BY e.position, e.id",
        )
        .bind(&id)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|r| BackupEntry { path: r.get(0), title: r.get(1), artist: r.get(2), duration: r.get(3) })
        .collect();
        playlists.push(BackupPlaylist { name: row.get(1), entries });
    }
    let summary = BackupSummary {
        path: dest.to_string_lossy().into_owned(),
        tracks: tracks.len(),
        roots: roots.len(),
        playlists: playlists.len(),
        edits: edit_count,
    };
    let file = BackupFile {
        format: FORMAT.into(),
        version: VERSION,
        created_at: chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        roots,
        tracks,
        playlists,
    };
    let json = serde_json::to_vec(&file).map_err(|e| e.to_string())?;
    // Write beside the target and rename, so a failure never leaves a
    // half-written backup where a good one used to be.
    let temp = dest.with_extension("tmp-backup");
    tokio::fs::write(&temp, json).await.map_err(|e| format!("Could not write the backup: {e}"))?;
    tokio::fs::rename(&temp, dest).await.map_err(|e| {
        let _ = std::fs::remove_file(&temp);
        format!("Could not write the backup: {e}")
    })?;
    Ok(summary)
}

fn read_backup(path: &Path) -> Result<BackupFile, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("Could not read the file: {e}"))?;
    let file: BackupFile =
        serde_json::from_slice(&bytes).map_err(|_| "This is not a Tahti library backup.".to_owned())?;
    if file.format != FORMAT {
        return Err("This is not a Tahti library backup.".into());
    }
    if file.version > VERSION {
        return Err("This backup was made by a newer version of Tahti Player. Update the app to restore it.".into());
    }
    Ok(file)
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct RootPreview {
    /// The folder as recorded in the backup.
    pub from: String,
    /// Where it maps to now (equal to `from` when unmapped).
    pub to: String,
    pub exists: bool,
    #[specta(type = Number<usize>)]
    pub tracks: usize,
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct RestorePreview {
    pub created_at: String,
    pub roots: Vec<RootPreview>,
    #[specta(type = Number<usize>)]
    pub tracks: usize,
    #[specta(type = Number<usize>)]
    pub files_found: usize,
    #[specta(type = Number<usize>)]
    pub files_missing: usize,
    #[specta(type = Number<usize>)]
    pub edits: usize,
    #[specta(type = Number<usize>)]
    pub playlists: usize,
    #[specta(type = Number<usize>)]
    pub playlist_entries: usize,
    /// A few files that could not be found at their mapped location.
    pub missing_examples: Vec<String>,
}

fn under(path: &str, root: &str) -> bool {
    let root = root.trim_end_matches(is_sep);
    has_prefix(path, root) && path.len() > root.len()
}

pub fn restore_preview(path: &Path, mappings: &[RootMapping]) -> Result<RestorePreview, String> {
    let file = read_backup(path)?;
    let mapped: Vec<(String, bool)> = file
        .tracks
        .iter()
        .map(|t| {
            let to = map_path(&t.path, mappings);
            let exists = Path::new(&to).is_file();
            (to, exists)
        })
        .collect();
    let roots = file
        .roots
        .iter()
        .map(|from| {
            let to = map_path(from, mappings);
            RootPreview {
                exists: Path::new(&to).is_dir(),
                tracks: file.tracks.iter().filter(|t| under(&t.path, from)).count(),
                from: from.clone(),
                to,
            }
        })
        .collect();
    Ok(RestorePreview {
        created_at: file.created_at.clone(),
        roots,
        tracks: file.tracks.len(),
        files_found: mapped.iter().filter(|(_, e)| *e).count(),
        files_missing: mapped.iter().filter(|(_, e)| !*e).count(),
        edits: file.tracks.iter().map(|t| t.edits.len()).sum(),
        playlists: file.playlists.len(),
        playlist_entries: file.playlists.iter().map(|p| p.entries.len()).sum(),
        missing_examples: mapped.iter().filter(|(_, e)| !*e).take(8).map(|(p, _)| p.clone()).collect(),
    })
}

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct RestoreResult {
    #[specta(type = Number<usize>)]
    pub tracks_restored: usize,
    /// Backed-up tracks whose file was not at the mapped location: not
    /// restored, and their ratings/edits are not either.
    #[specta(type = Number<usize>)]
    pub tracks_missing: usize,
    #[specta(type = Number<usize>)]
    pub tracks_failed: usize,
    #[specta(type = Number<usize>)]
    pub roots_added: usize,
    #[specta(type = Number<usize>)]
    pub playlists_created: usize,
    /// Playlists whose name was already taken and were restored under a new name.
    #[specta(type = Number<usize>)]
    pub playlists_renamed: usize,
    #[specta(type = Number<usize>)]
    pub edits_applied: usize,
}

async fn free_playlist_name(pool: &SqlitePool, name: &str) -> Result<String, String> {
    let taken = |candidate: String| async move {
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM library_playlists WHERE name = ?")
            .bind(candidate)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())
    };
    if taken(name.to_owned()).await? == 0 {
        return Ok(name.to_owned());
    }
    let mut n = 1;
    loop {
        let candidate = if n == 1 { format!("{name} (restored)") } else { format!("{name} (restored {n})") };
        if taken(candidate.clone()).await? == 0 {
            return Ok(candidate);
        }
        n += 1;
    }
}

pub async fn restore_backup(pool: &SqlitePool, path: &Path, mappings: &[RootMapping]) -> Result<RestoreResult, String> {
    let file = read_backup(path)?;
    let mut result = RestoreResult::default();

    // Watched folders that exist here now.
    let mut roots: Vec<(String, String)> = Vec::new(); // (mapped path as stored, id)
    for from in &file.roots {
        let to = map_path(from, mappings);
        if !Path::new(&to).is_dir() {
            continue;
        }
        let before: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM library_roots")
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;
        if let Ok(root) = add_root(pool, Path::new(&to)).await {
            let after: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM library_roots")
                .fetch_one(pool)
                .await
                .map_err(|e| e.to_string())?;
            result.roots_added += (after - before).max(0) as usize;
            roots.push((root.path, root.id));
        }
    }

    // Import every backed-up file that exists, grouped by watched folder.
    let mut wanted: Vec<(PathBuf, Option<String>, &BackupTrack)> = Vec::new();
    for track in &file.tracks {
        let mapped = PathBuf::from(map_path(&track.path, mappings));
        if !mapped.is_file() {
            result.tracks_missing += 1;
            continue;
        }
        let key = mapped.to_string_lossy().into_owned();
        let root_id = roots
            .iter()
            .filter(|(root, _)| under(&key, root))
            .max_by_key(|(root, _)| root.len())
            .map(|(_, id)| id.clone());
        wanted.push((mapped, root_id, track));
    }
    let mut by_root: HashMap<Option<String>, Vec<PathBuf>> = HashMap::new();
    for (path, root_id, _) in &wanted {
        by_root.entry(root_id.clone()).or_default().push(path.clone());
    }
    let mut imported = ImportResult::default();
    for (root_id, paths) in by_root {
        for chunk in paths.chunks(IMPORT_CHUNK) {
            import_batch(pool, chunk.to_vec(), root_id.as_deref(), &mut imported).await;
        }
    }
    let failed: std::collections::HashSet<String> = imported.errors.iter().map(|f| f.path.clone()).collect();

    // User data and hand edits on top of the freshly extracted tags.
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    for (path, _, track) in &wanted {
        let key = path.to_string_lossy().into_owned();
        if failed.contains(&key) {
            result.tracks_failed += 1;
            continue;
        }
        let Some(id) = sqlx::query_scalar::<_, String>("SELECT id FROM library_tracks WHERE path = ?")
            .bind(&key)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| e.to_string())?
        else {
            result.tracks_failed += 1;
            continue;
        };
        result.tracks_restored += 1;
        let color = if super::catalog::COLORS.contains(&track.color.as_str()) { track.color.as_str() } else { "" };
        sqlx::query("UPDATE library_tracks SET rating=?, color=?, play_count=?, last_played_at=? WHERE id=?")
            .bind(track.rating.clamp(0, 5))
            .bind(color)
            .bind(track.play_count.max(0))
            .bind(&track.last_played_at)
            .bind(&id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        for name in &track.tags {
            let name = name.split_whitespace().collect::<Vec<_>>().join(" ");
            if name.is_empty() {
                continue;
            }
            let tag_id = match sqlx::query_scalar::<_, String>("SELECT id FROM library_tags WHERE name=?")
                .bind(&name)
                .fetch_optional(&mut *tx)
                .await
                .map_err(|e| e.to_string())?
            {
                Some(id) => id,
                None => {
                    let id = uuid::Uuid::new_v4().to_string();
                    sqlx::query("INSERT INTO library_tags (id, name) VALUES (?,?)")
                        .bind(&id)
                        .bind(&name)
                        .execute(&mut *tx)
                        .await
                        .map_err(|e| e.to_string())?;
                    id
                }
            };
            sqlx::query("INSERT OR IGNORE INTO library_track_tags (track_id, tag_id) VALUES (?,?)")
                .bind(&id)
                .bind(&tag_id)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }
        let edits: Vec<FieldEdit> = track
            .edits
            .iter()
            .filter_map(|(column, value)| {
                EditField::ALL
                    .into_iter()
                    .find(|f| f.column() == column)
                    .map(|field| FieldEdit { field, value: Some(value.clone()) })
            })
            .collect();
        if !edits.is_empty() {
            result.edits_applied += apply_edits_on(&mut tx, std::slice::from_ref(&id), &edits)
                .await
                .map(|changes| changes.len())
                .unwrap_or(0);
        }
    }
    tx.commit().await.map_err(|e| e.to_string())?;

    // Playlists: every entry is kept; ones whose file is not in the catalog
    // are stored unlinked and link up when the file joins it.
    for playlist in &file.playlists {
        let name = free_playlist_name(pool, &playlist.name).await?;
        if name != playlist.name {
            result.playlists_renamed += 1;
        }
        let playlist_id = uuid::Uuid::new_v4().to_string();
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
        sqlx::query("INSERT INTO library_playlists (id, name) VALUES (?,?)")
            .bind(&playlist_id)
            .bind(&name)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        for (position, entry) in playlist.entries.iter().enumerate() {
            let mapped = map_path(&entry.path, mappings);
            let track_id: Option<String> = sqlx::query_scalar("SELECT id FROM library_tracks WHERE path = ?")
                .bind(&mapped)
                .fetch_optional(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
            let raw = RawEntry {
                entry_id: String::new(),
                track_id,
                path: mapped,
                title: entry.title.clone(),
                artist: entry.artist.clone(),
                duration: entry.duration,
            };
            insert_entry(&mut tx, &playlist_id, position as i64, &uuid::Uuid::new_v4().to_string(), &raw).await?;
        }
        tx.commit().await.map_err(|e| e.to_string())?;
        result.playlists_created += 1;
    }
    Ok(result)
}

fn pick_backup_file(app: &tauri::AppHandle) -> Option<PathBuf> {
    app.dialog()
        .file()
        .add_filter("Tahti library backup", &["tahti-backup", "json"])
        .blocking_pick_file()
        .and_then(|file| file.into_path().ok())
}

#[tauri::command]
#[specta::specta]
pub async fn library_backup_export(app: tauri::AppHandle) -> Result<Option<BackupSummary>, String> {
    let pool = pool(&app).await?;
    let stamp = chrono::Local::now().format("%Y-%m-%d").to_string();
    let default_name = format!("tahti-library-{stamp}.tahti-backup");
    let dialog_app = app.clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || {
        dialog_app
            .dialog()
            .file()
            .add_filter("Tahti library backup", &["tahti-backup"])
            .set_file_name(&default_name)
            .blocking_save_file()
            .and_then(|file| file.into_path().ok())
    })
    .await
    .map_err(|e| e.to_string())?;
    let Some(dest) = chosen else { return Ok(None) };
    export_backup(&pool, &dest).await.map(Some)
}

/// Lets the user choose a backup file; the path comes back so the following
/// preview/restore calls (which re-read it) can refer to the same file.
#[tauri::command]
#[specta::specta]
pub async fn library_backup_pick(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let dialog_app = app.clone();
    let picked = tauri::async_runtime::spawn_blocking(move || pick_backup_file(&dialog_app))
        .await
        .map_err(|e| e.to_string())?;
    Ok(picked.map(|p| p.to_string_lossy().into_owned()))
}

#[tauri::command]
#[specta::specta]
pub async fn library_backup_preview(source_path: String, mappings: Vec<RootMapping>) -> Result<RestorePreview, String> {
    let path = PathBuf::from(source_path);
    tauri::async_runtime::spawn_blocking(move || restore_preview(&path, &mappings))
        .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
#[specta::specta]
pub async fn library_backup_restore(
    app: tauri::AppHandle,
    source_path: String,
    mappings: Vec<RootMapping>,
) -> Result<RestoreResult, String> {
    restore_backup(&pool(&app).await?, Path::new(&source_path), &mappings).await
}

#[cfg(test)]
pub(super) fn map_path_for_test(path: &str, mappings: &[RootMapping]) -> String {
    map_path(path, mappings)
}
