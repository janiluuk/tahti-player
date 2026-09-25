//! M3U / M3U8 import and export for local playlists.
//!
//! Export writes UTF-8 with `#EXTM3U`, `#PLAYLIST` and `#EXTINF` lines, one
//! line per entry in playlist order, repeats included. Import reads UTF-8
//! (falling back to Latin-1 for old `.m3u` files), resolves each line against
//! the catalog, and keeps anything it cannot resolve as an unavailable entry
//! so nothing is silently dropped.

use std::collections::HashMap;
use std::path::{Component, Path, PathBuf};

use serde::{Deserialize, Serialize};
use specta_typescript::Number;
use sqlx::SqlitePool;
use tauri_plugin_dialog::DialogExt;

use super::playlists::{create_playlist, get_playlist, insert_entry, PlaylistSummary, RawEntry};
use super::{import_batch, is_supported_audio_file, pool, ImportResult};

const PREVIEW_SAMPLE: usize = 200;

#[derive(Debug, Clone, PartialEq)]
pub struct M3uEntry {
    /// 1-based line in the file, for messages.
    pub line: usize,
    pub path: PathBuf,
    pub remote: bool,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub duration: Option<f64>,
}

#[derive(Debug, Default)]
pub struct ParsedM3u {
    pub name: Option<String>,
    pub entries: Vec<M3uEntry>,
}

/// UTF-8 (BOM allowed) or, failing that, Latin-1 -- what old `.m3u` files use.
fn decode(bytes: &[u8]) -> String {
    let bytes = bytes.strip_prefix(&[0xEF, 0xBB, 0xBF]).unwrap_or(bytes);
    match std::str::from_utf8(bytes) {
        Ok(text) => text.to_owned(),
        Err(_) => bytes.iter().map(|&byte| byte as char).collect(),
    }
}

fn percent_decode(value: &str) -> String {
    let bytes = value.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'%' && index + 2 < bytes.len() {
            let hex = std::str::from_utf8(&bytes[index + 1..index + 3])
                .ok()
                .and_then(|digits| u8::from_str_radix(digits, 16).ok());
            if let Some(hex) = hex {
                out.push(hex);
                index += 3;
                continue;
            }
        }
        out.push(bytes[index]);
        index += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

/// Removes `.` and resolves `..` without touching the filesystem.
fn normalize(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                if !out.pop() {
                    out.push("..");
                }
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

fn resolve_line(raw: &str, base_dir: &Path) -> (PathBuf, bool) {
    let lower = raw.to_ascii_lowercase();
    if lower.starts_with("http://") || lower.starts_with("https://") || lower.starts_with("rtmp") {
        return (PathBuf::from(raw), true);
    }
    let mut text = raw.to_owned();
    if lower.starts_with("file://") {
        text = percent_decode(&raw["file://".len()..]);
        // file:///C:/x -> C:/x
        let bytes = text.as_bytes();
        if bytes.len() > 2 && bytes[0] == b'/' && bytes[2] == b':' && bytes[1].is_ascii_alphabetic() {
            text.remove(0);
        }
    }
    // A Windows-style list opened elsewhere: treat backslashes as separators.
    if !cfg!(windows) && text.contains('\\') && !text.contains('/') {
        text = text.replace('\\', "/");
    }
    let path = PathBuf::from(&text);
    let absolute = if path.is_absolute() || (cfg!(not(windows)) && text.as_bytes().get(1) == Some(&b':')) {
        path
    } else {
        base_dir.join(path)
    };
    (normalize(&absolute), false)
}

/// Parses playlist text. `base_dir` is the folder relative entries resolve against.
pub fn parse_m3u(bytes: &[u8], base_dir: &Path) -> ParsedM3u {
    let text = decode(bytes);
    let mut parsed = ParsedM3u::default();
    let mut pending: Option<(Option<f64>, Option<String>, Option<String>)> = None;
    for (index, line) in text.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() || line.eq_ignore_ascii_case("#EXTM3U") {
            continue;
        }
        if let Some(name) = line.strip_prefix("#PLAYLIST:") {
            let name = name.trim();
            if !name.is_empty() {
                parsed.name = Some(name.to_owned());
            }
            continue;
        }
        if let Some(info) = line.strip_prefix("#EXTINF:") {
            let (length, display) = info.split_once(',').unwrap_or((info, ""));
            let duration = length
                .split_whitespace()
                .next()
                .and_then(|value| value.parse::<f64>().ok())
                .filter(|value| *value >= 0.0);
            let display = display.trim();
            let (artist, title) = match display.split_once(" - ") {
                Some((artist, title)) => (Some(artist.trim().to_owned()), Some(title.trim().to_owned())),
                None if display.is_empty() => (None, None),
                None => (None, Some(display.to_owned())),
            };
            pending = Some((duration, artist, title));
            continue;
        }
        if line.starts_with('#') {
            continue;
        }
        let (path, remote) = resolve_line(line, base_dir);
        let (duration, artist, title) = pending.take().unwrap_or((None, None, None));
        parsed.entries.push(M3uEntry {
            line: index + 1,
            path,
            remote,
            title,
            artist,
            duration,
        });
    }
    parsed
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum ExportStyle {
    Absolute,
    Relative,
}

/// `target` expressed relative to `base` (both absolute), using `..` where
/// needed. `None` when they share no root (different Windows drives).
pub fn relative_path(target: &Path, base: &Path) -> Option<PathBuf> {
    let target: Vec<Component> = target.components().collect();
    let base: Vec<Component> = base.components().collect();
    let common = target.iter().zip(&base).take_while(|(a, b)| a == b).count();
    if common == 0 {
        return None;
    }
    if matches!(target.first(), Some(Component::Prefix(_))) && common < 2 {
        return None;
    }
    let mut out = PathBuf::new();
    for _ in common..base.len() {
        out.push("..");
    }
    for component in &target[common..] {
        out.push(component.as_os_str());
    }
    Some(out)
}

#[derive(Debug, Clone)]
pub struct ExportEntry {
    pub path: String,
    pub title: String,
    pub artist: String,
    pub duration: f64,
}

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub path: String,
    #[specta(type = Number<usize>)]
    pub written: usize,
    /// Relative mode: files outside the export folder, written with `../`.
    #[specta(type = Number<usize>)]
    pub outside_root: usize,
    /// Relative mode: files that share no root with the export folder
    /// (another drive), written as absolute paths.
    #[specta(type = Number<usize>)]
    pub absolute_fallback: usize,
}

/// Renders the playlist file. Slashes are always `/` so the file is portable.
pub fn format_m3u(
    name: &str,
    entries: &[ExportEntry],
    export_dir: &Path,
    style: ExportStyle,
) -> (String, ExportResult) {
    let mut out = String::from("#EXTM3U\n");
    out.push_str(&format!("#PLAYLIST:{name}\n"));
    let mut stats = ExportResult::default();
    for entry in entries {
        let seconds = entry.duration.round() as i64;
        let display = if entry.artist.is_empty() {
            entry.title.clone()
        } else {
            format!("{} - {}", entry.artist, entry.title)
        };
        out.push_str(&format!("#EXTINF:{seconds},{display}\n"));
        let absolute = Path::new(&entry.path);
        let text = match style {
            ExportStyle::Absolute => entry.path.clone(),
            ExportStyle::Relative => match relative_path(absolute, export_dir) {
                Some(relative) => {
                    if relative.components().next() == Some(Component::ParentDir) {
                        stats.outside_root += 1;
                    }
                    relative.to_string_lossy().into_owned()
                }
                None => {
                    stats.absolute_fallback += 1;
                    entry.path.clone()
                }
            },
        };
        out.push_str(&text.replace('\\', "/"));
        out.push('\n');
        stats.written += 1;
    }
    (out, stats)
}

pub async fn export_playlist(
    pool: &SqlitePool,
    id: &str,
    dest: &Path,
    style: ExportStyle,
) -> Result<ExportResult, String> {
    let playlist = get_playlist(pool, id).await?;
    let rows = sqlx::query_as::<_, (String, String, String, f64, Option<String>, Option<String>, Option<String>, Option<f64>)>(
        "SELECT e.path, e.title, e.artist, e.duration, t.path, t.title, t.artist, t.duration \
         FROM library_playlist_entries e LEFT JOIN library_tracks t ON t.id = e.track_id \
         WHERE e.playlist_id = ? ORDER BY e.position, e.id",
    )
    .bind(id)
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?;
    let entries: Vec<ExportEntry> = rows
        .into_iter()
        .map(|(path, title, artist, duration, t_path, t_title, t_artist, t_duration)| ExportEntry {
            path: t_path.unwrap_or(path),
            title: t_title.unwrap_or(title),
            artist: t_artist.unwrap_or(artist),
            duration: t_duration.unwrap_or(duration),
        })
        .collect();
    let export_dir = dest
        .parent()
        .map(|dir| dir.canonicalize().unwrap_or_else(|_| dir.to_path_buf()))
        .ok_or("Choose a file name")?;
    let (text, mut stats) = format_m3u(&playlist.name, &entries, &export_dir, style);
    tokio::fs::write(dest, text.as_bytes())
        .await
        .map_err(|err| format!("Could not write the file: {err}"))?;
    stats.path = dest.to_string_lossy().into_owned();
    Ok(stats)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum EntryStatus {
    /// Already a track in the library.
    Linked,
    /// A supported file that exists but is not in the library yet.
    NeedsImport,
    /// The file is not where the list says (and was not found by relinking).
    Missing,
    /// Exists, but not a format the library can import.
    Unsupported,
    /// A URL (stream), which local playlists cannot hold.
    Remote,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct UnresolvedEntry {
    #[specta(type = Number<usize>)]
    pub line: usize,
    pub path: String,
    pub title: String,
    pub status: EntryStatus,
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ImportPreview {
    pub source_path: String,
    pub suggested_name: String,
    #[specta(type = Number<usize>)]
    pub total: usize,
    #[specta(type = Number<usize>)]
    pub linked: usize,
    #[specta(type = Number<usize>)]
    pub needs_import: usize,
    #[specta(type = Number<usize>)]
    pub missing: usize,
    #[specta(type = Number<usize>)]
    pub unsupported: usize,
    #[specta(type = Number<usize>)]
    pub remote: usize,
    /// The first entries that are not already in the library.
    pub unresolved: Vec<UnresolvedEntry>,
}

struct Resolved {
    entry: M3uEntry,
    path: PathBuf,
    status: EntryStatus,
    track_id: Option<String>,
}

fn file_stem_title(path: &Path) -> String {
    path.file_stem()
        .map(|stem| stem.to_string_lossy().into_owned())
        .unwrap_or_default()
}

/// Finds `path` under `root` by dropping leading folders (`/old/drive/Music/a/b.flac`
/// -> `<root>/Music/a/b.flac` -> `<root>/a/b.flac` -> ...), then by a unique
/// file name anywhere below `root`.
fn find_under_root(path: &Path, root: &Path, by_name: &mut Option<HashMap<String, Vec<PathBuf>>>) -> Option<PathBuf> {
    let parts: Vec<&std::ffi::OsStr> = path
        .components()
        .filter_map(|component| match component {
            Component::Normal(part) => Some(part),
            _ => None,
        })
        .collect();
    for skip in 0..parts.len() {
        let mut candidate = root.to_path_buf();
        candidate.extend(&parts[skip..]);
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    let name = path.file_name()?.to_string_lossy().to_lowercase();
    let index = by_name.get_or_insert_with(|| {
        let mut map: HashMap<String, Vec<PathBuf>> = HashMap::new();
        let mut pending = vec![root.to_path_buf()];
        while let Some(dir) = pending.pop() {
            let Ok(read) = std::fs::read_dir(&dir) else { continue };
            for item in read.flatten() {
                let Ok(kind) = item.file_type() else { continue };
                if kind.is_dir() {
                    pending.push(item.path());
                } else if kind.is_file() {
                    map.entry(item.file_name().to_string_lossy().to_lowercase())
                        .or_default()
                        .push(item.path());
                }
            }
        }
        map
    });
    match index.get(&name) {
        Some(found) if found.len() == 1 => found.first().cloned(),
        _ => None,
    }
}

/// Library track ids by exact path, for the given paths.
async fn known_track_ids(
    pool: &SqlitePool,
    paths: &[String],
) -> Result<HashMap<String, String>, String> {
    let mut known = HashMap::new();
    for chunk in paths.chunks(500) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!("SELECT path, id FROM library_tracks WHERE path IN ({marks})");
        let mut query = sqlx::query_as::<_, (String, String)>(&sql);
        for path in chunk {
            query = query.bind(path);
        }
        for (path, id) in query.fetch_all(pool).await.map_err(|err| err.to_string())? {
            known.insert(path, id);
        }
    }
    Ok(known)
}

async fn resolve_entries(
    pool: &SqlitePool,
    parsed: ParsedM3u,
    relink_root: Option<&Path>,
) -> Result<Vec<Resolved>, String> {
    let relink_root = relink_root.map(Path::to_path_buf);
    // Filesystem work in one blocking pass.
    let located = tauri::async_runtime::spawn_blocking(move || {
        let mut by_name = None;
        parsed
            .entries
            .into_iter()
            .map(|entry| {
                let mut path = entry.path.clone();
                if !entry.remote && !path.is_file() {
                    if let Some(root) = &relink_root {
                        if let Some(found) = find_under_root(&path, root, &mut by_name) {
                            path = found;
                        }
                    }
                }
                let exists = !entry.remote && path.is_file();
                let canonical = if exists {
                    path.canonicalize().unwrap_or_else(|_| path.clone())
                } else {
                    path.clone()
                };
                (entry, canonical, exists)
            })
            .collect::<Vec<_>>()
    })
    .await
    .map_err(|err| err.to_string())?;

    let paths: Vec<String> = located
        .iter()
        .filter(|(entry, _, _)| !entry.remote)
        .map(|(_, path, _)| path.to_string_lossy().into_owned())
        .collect();
    let known = known_track_ids(pool, &paths).await?;
    Ok(located
        .into_iter()
        .map(|(entry, path, exists)| {
            let key = path.to_string_lossy().into_owned();
            let track_id = known.get(&key).cloned();
            let status = if entry.remote {
                EntryStatus::Remote
            } else if track_id.is_some() {
                EntryStatus::Linked
            } else if !exists {
                EntryStatus::Missing
            } else if is_supported_audio_file(&path) {
                EntryStatus::NeedsImport
            } else {
                EntryStatus::Unsupported
            };
            Resolved { entry, path, status, track_id }
        })
        .collect())
}

fn suggested_name(parsed_name: Option<String>, file: &Path) -> String {
    parsed_name.unwrap_or_else(|| file_stem_title(file))
}

async fn read_source(file: &Path) -> Result<ParsedM3u, String> {
    let bytes = tokio::fs::read(file)
        .await
        .map_err(|err| format!("Could not read the file: {err}"))?;
    let base = file.parent().map(Path::to_path_buf).unwrap_or_default();
    Ok(parse_m3u(&bytes, &base))
}

pub async fn preview_import(
    pool: &SqlitePool,
    file: &Path,
    relink_root: Option<&Path>,
) -> Result<ImportPreview, String> {
    let parsed = read_source(file).await?;
    let name = suggested_name(parsed.name.clone(), file);
    let resolved = resolve_entries(pool, parsed, relink_root).await?;
    let mut preview = ImportPreview {
        source_path: file.to_string_lossy().into_owned(),
        suggested_name: name,
        total: resolved.len(),
        linked: 0,
        needs_import: 0,
        missing: 0,
        unsupported: 0,
        remote: 0,
        unresolved: Vec::new(),
    };
    for item in &resolved {
        match item.status {
            EntryStatus::Linked => preview.linked += 1,
            EntryStatus::NeedsImport => preview.needs_import += 1,
            EntryStatus::Missing => preview.missing += 1,
            EntryStatus::Unsupported => preview.unsupported += 1,
            EntryStatus::Remote => preview.remote += 1,
        }
        if item.status != EntryStatus::Linked && preview.unresolved.len() < PREVIEW_SAMPLE {
            preview.unresolved.push(UnresolvedEntry {
                line: item.entry.line,
                path: item.path.to_string_lossy().into_owned(),
                title: item
                    .entry
                    .title
                    .clone()
                    .unwrap_or_else(|| file_stem_title(&item.path)),
                status: item.status,
            });
        }
    }
    Ok(preview)
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ImportOutcome {
    pub playlist: PlaylistSummary,
    /// Entries now pointing at a library track.
    #[specta(type = Number<usize>)]
    pub linked: usize,
    /// Files added to the library because the list referenced them.
    #[specta(type = Number<usize>)]
    pub imported: usize,
    /// Entries kept as unavailable (missing, unsupported, or streams).
    #[specta(type = Number<usize>)]
    pub unresolved: usize,
}

/// Creates the playlist and every entry, in file order, repeats included.
/// Anything unresolved becomes an unavailable entry that re-links by path once
/// the file shows up in the library.
pub async fn commit_import(
    pool: &SqlitePool,
    file: &Path,
    name: &str,
    import_missing_files: bool,
    relink_root: Option<&Path>,
) -> Result<ImportOutcome, String> {
    let parsed = read_source(file).await?;
    // Fail on a name clash before touching the library.
    let playlist = create_playlist(pool, name).await?;
    let mut resolved = resolve_entries(pool, parsed, relink_root).await?;

    let mut imported = 0usize;
    if import_missing_files {
        let mut wanted: Vec<PathBuf> = Vec::new();
        for item in &resolved {
            if item.status == EntryStatus::NeedsImport && !wanted.contains(&item.path) {
                wanted.push(item.path.clone());
            }
        }
        if !wanted.is_empty() {
            let mut result = ImportResult::default();
            for batch in wanted.chunks(16) {
                import_batch(pool, batch.to_vec(), None, &mut result).await;
            }
            imported = result.imported;
            // Link everything that just became a track (same path lookup as before).
            let paths: Vec<String> = wanted
                .iter()
                .map(|path| path.to_string_lossy().into_owned())
                .collect();
            let known = known_track_ids(pool, &paths).await?;
            for item in &mut resolved {
                if item.status == EntryStatus::NeedsImport {
                    if let Some(id) = known.get(item.path.to_string_lossy().as_ref()) {
                        item.track_id = Some(id.clone());
                        item.status = EntryStatus::Linked;
                    }
                }
            }
        }
    }

    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;
    let mut linked = 0usize;
    let mut unresolved = 0usize;
    for (position, item) in resolved.iter().enumerate() {
        if item.track_id.is_some() {
            linked += 1;
        } else {
            unresolved += 1;
        }
        let row = RawEntry {
            entry_id: uuid::Uuid::new_v4().to_string(),
            track_id: item.track_id.clone(),
            path: item.path.to_string_lossy().into_owned(),
            title: item
                .entry
                .title
                .clone()
                .unwrap_or_else(|| file_stem_title(&item.path)),
            artist: item.entry.artist.clone().unwrap_or_default(),
            duration: item.entry.duration.unwrap_or(0.0),
        };
        insert_entry(&mut tx, &playlist.id, position as i64, &row.entry_id, &row).await?;
    }
    tx.commit().await.map_err(|err| err.to_string())?;
    Ok(ImportOutcome {
        playlist: get_playlist(pool, &playlist.id).await?,
        linked,
        imported,
        unresolved,
    })
}

/// Points one unavailable entry at a file the user located, importing the
/// file into the library first when it is not there yet.
pub async fn relink_entry(
    pool: &SqlitePool,
    playlist_id: &str,
    entry_id: &str,
    file: &Path,
) -> Result<(), String> {
    let canonical = tokio::fs::canonicalize(file)
        .await
        .map_err(|err| err.to_string())?;
    let path = canonical.to_string_lossy().into_owned();
    let existing = sqlx::query_scalar::<_, String>("SELECT id FROM library_tracks WHERE path = ?")
        .bind(&path)
        .fetch_optional(pool)
        .await
        .map_err(|err| err.to_string())?;
    let track_id = match existing {
        Some(id) => id,
        None => {
            let mut result = ImportResult::default();
            import_batch(pool, vec![canonical.clone()], None, &mut result).await;
            if let Some(failure) = result.errors.first() {
                return Err(failure.error.clone());
            }
            sqlx::query_scalar::<_, String>("SELECT id FROM library_tracks WHERE path = ?")
                .bind(&path)
                .fetch_one(pool)
                .await
                .map_err(|err| err.to_string())?
        }
    };
    let updated = sqlx::query(
        "UPDATE library_playlist_entries SET track_id = ?, path = ? WHERE id = ? AND playlist_id = ?",
    )
    .bind(&track_id)
    .bind(&path)
    .bind(entry_id)
    .bind(playlist_id)
    .execute(pool)
    .await
    .map_err(|err| err.to_string())?;
    if updated.rows_affected() == 0 {
        return Err("That entry is no longer in the playlist.".into());
    }
    Ok(())
}

fn pick_file(app: &tauri::AppHandle, filter_name: &str, extensions: &[&str]) -> Option<PathBuf> {
    app.dialog()
        .file()
        .add_filter(filter_name, extensions)
        .blocking_pick_file()
        .and_then(|file| file.into_path().ok())
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_export(
    app: tauri::AppHandle,
    id: String,
    style: ExportStyle,
) -> Result<Option<ExportResult>, String> {
    let pool = pool(&app).await?;
    let playlist = get_playlist(&pool, &id).await?;
    let default_name = format!(
        "{}.m3u8",
        playlist
            .name
            .chars()
            .map(|c| if c.is_alphanumeric() || c == ' ' || c == '-' || c == '_' { c } else { '_' })
            .collect::<String>()
    );
    let dialog_app = app.clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || {
        dialog_app
            .dialog()
            .file()
            .add_filter("M3U8 playlist (UTF-8)", &["m3u8", "m3u"])
            .set_file_name(&default_name)
            .blocking_save_file()
            .and_then(|file| file.into_path().ok())
    })
    .await
    .map_err(|err| err.to_string())?;
    let Some(dest) = chosen else { return Ok(None) };
    export_playlist(&pool, &id, &dest, style).await.map(Some)
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_import_preview(
    app: tauri::AppHandle,
    source_path: Option<String>,
    relink_root: Option<String>,
) -> Result<Option<ImportPreview>, String> {
    let file = match source_path {
        Some(path) => PathBuf::from(path),
        None => {
            let dialog_app = app.clone();
            let picked = tauri::async_runtime::spawn_blocking(move || {
                pick_file(&dialog_app, "M3U / M3U8 playlist", &["m3u8", "m3u"])
            })
            .await
            .map_err(|err| err.to_string())?;
            let Some(file) = picked else { return Ok(None) };
            file
        }
    };
    let root = relink_root.map(PathBuf::from);
    preview_import(&pool(&app).await?, &file, root.as_deref())
        .await
        .map(Some)
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_pick_relink_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let dialog_app = app.clone();
    let picked = tauri::async_runtime::spawn_blocking(move || {
        dialog_app.dialog().file().blocking_pick_folder()
    })
    .await
    .map_err(|err| err.to_string())?;
    Ok(picked
        .and_then(|folder| folder.into_path().ok())
        .map(|path| path.to_string_lossy().into_owned()))
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_import_commit(
    app: tauri::AppHandle,
    source_path: String,
    name: String,
    import_missing_files: bool,
    relink_root: Option<String>,
) -> Result<ImportOutcome, String> {
    let root = relink_root.map(PathBuf::from);
    commit_import(
        &pool(&app).await?,
        Path::new(&source_path),
        &name,
        import_missing_files,
        root.as_deref(),
    )
    .await
}

/// Lets the user pick the file an unavailable entry should point at.
#[tauri::command]
#[specta::specta]
pub async fn playlist_relink_entry(
    app: tauri::AppHandle,
    id: String,
    entry_id: String,
) -> Result<bool, String> {
    let dialog_app = app.clone();
    let picked = tauri::async_runtime::spawn_blocking(move || {
        pick_file(
            &dialog_app,
            super::import::AUDIO_PICKER_LABEL,
            &super::import::SUPPORTED_AUDIO_EXTENSIONS,
        )
    })
    .await
    .map_err(|err| err.to_string())?;
    let Some(file) = picked else { return Ok(false) };
    relink_entry(&pool(&app).await?, &id, &entry_id, &file).await?;
    Ok(true)
}
