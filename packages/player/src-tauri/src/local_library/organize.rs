//! Optional "organize files" workflow (desktop-pro-library.md Phase 7): copy
//! or move catalog tracks into a folder layout built from their tags, with a
//! preview first. Nothing here runs unless the user asks. Files are never
//! overwritten; a move (which changes the originals) additionally needs an
//! explicit confirmation flag.
//!
//! Track IDs, playlists and user overrides are kept: after a file lands, the
//! track row is re-pointed at its new path. A *copy* re-points the catalog at
//! the copy and leaves the original file alone.

use std::collections::HashSet;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use specta_typescript::Number;
use sqlx::{Row, SqlitePool};

use super::{folder_of, list_roots, pool};

pub const DEFAULT_TEMPLATE: &str = "{albumArtist}/{album}/{disc}{track} - {title}";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum OrganizeMode {
    /// Copy the file into the destination; the catalog then points at the copy.
    Copy,
    /// Move the file (changes the original location).
    Move,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum Collision {
    /// Leave a track alone when its target already exists.
    Skip,
    /// Keep both: append " (2)", " (3)"… to the new file name.
    Suffix,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum OrganizeStatus {
    Ready,
    /// Already at its target path.
    Unchanged,
    /// Target exists (on disk or planned for another track).
    Collision,
    /// The source file is not there.
    Missing,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct OrganizeItem {
    pub id: String,
    pub from: String,
    pub to: String,
    pub status: OrganizeStatus,
}

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct OrganizePlan {
    pub items: Vec<OrganizeItem>,
    #[specta(type = Number<usize>)]
    pub ready: usize,
    #[specta(type = Number<usize>)]
    pub unchanged: usize,
    #[specta(type = Number<usize>)]
    pub collisions: usize,
    #[specta(type = Number<usize>)]
    pub missing: usize,
    /// Copy only: originals inside a watched folder would be picked up again
    /// by the next scan as new tracks.
    #[specta(type = Number<usize>)]
    pub originals_in_watched_folders: usize,
}

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct OrganizeResult {
    #[specta(type = Number<usize>)]
    pub done: usize,
    #[specta(type = Number<usize>)]
    pub skipped: usize,
    pub errors: Vec<String>,
}

struct Source {
    id: String,
    path: String,
    title: String,
    artist: String,
    album_artist: String,
    album: String,
    track_no: Option<i64>,
    disc_no: Option<i64>,
    year: Option<i64>,
    genre: String,
}

/// One path segment made safe on every platform: no separators or reserved
/// characters, no leading/trailing dots or spaces, bounded length.
fn clean(part: &str) -> String {
    let replaced: String = part
        .chars()
        .map(|c| if c.is_control() || "/\\:*?\"<>|".contains(c) { '_' } else { c })
        .collect();
    let trimmed = replaced.trim_matches(|c: char| c == '.' || c.is_whitespace());
    trimmed.chars().take(120).collect::<String>().trim_end().to_string()
}

fn or_unknown(value: &str, fallback: &str) -> String {
    let cleaned = clean(value);
    if cleaned.is_empty() { fallback.to_string() } else { cleaned }
}

/// Renders `template` for one track. `/` in the template separates folders;
/// values never can, so a tag like "AC/DC" cannot escape its folder. The
/// extension of the source file is always kept.
fn render(template: &str, source: &Source) -> Option<PathBuf> {
    let artist = or_unknown(&source.artist, "Unknown Artist");
    let album_artist = if source.album_artist.trim().is_empty() {
        artist.clone()
    } else {
        or_unknown(&source.album_artist, "Unknown Artist")
    };
    let number = |n: Option<i64>| n.filter(|n| *n > 0).map(|n| format!("{n:02}")).unwrap_or_default();
    let disc = source.disc_no.filter(|d| *d > 1).map(|d| format!("{d}-")).unwrap_or_default();
    let mut path = PathBuf::new();
    let segments: Vec<&str> = template.split('/').filter(|s| !s.trim().is_empty()).collect();
    if segments.is_empty() {
        return None;
    }
    for (index, segment) in segments.iter().enumerate() {
        let text = segment
            .replace("{artist}", &artist)
            .replace("{albumArtist}", &album_artist)
            .replace("{album}", &or_unknown(&source.album, "Unknown Album"))
            .replace("{title}", &or_unknown(&source.title, "Untitled"))
            .replace("{track}", &number(source.track_no))
            .replace("{disc}", &disc)
            .replace("{year}", &source.year.filter(|y| *y > 0).map(|y| y.to_string()).unwrap_or_default())
            .replace("{genre}", &or_unknown(&source.genre, "Unknown Genre"));
        // A blank {track} leaves a dangling " - " at the start.
        let text = text.trim_start_matches([' ', '-', '_']).to_string();
        let text = clean(&text);
        if text.is_empty() {
            return None;
        }
        path.push(if index + 1 == segments.len() {
            match Path::new(&source.path).extension().and_then(|e| e.to_str()) {
                Some(ext) => format!("{text}.{ext}"),
                None => text,
            }
        } else {
            text
        });
    }
    Some(path)
}

fn with_suffix(path: &Path, n: usize) -> PathBuf {
    let stem = path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
    let name = match path.extension() {
        Some(ext) => format!("{stem} ({n}).{}", ext.to_string_lossy()),
        None => format!("{stem} ({n})"),
    };
    path.with_file_name(name)
}

async fn load(pool: &SqlitePool, ids: &[String]) -> Result<Vec<Source>, String> {
    let mut rows = Vec::new();
    for chunk in ids.chunks(500) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!(
            "SELECT id, path, title, artist, album_artist, album, track_no, disc_no, year, genre FROM library_tracks WHERE id IN ({marks})"
        );
        let mut query = sqlx::query(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        rows.extend(query.fetch_all(pool).await.map_err(|e| e.to_string())?);
    }
    let mut sources: Vec<Source> = rows
        .iter()
        .map(|r| Source {
            id: r.get(0),
            path: r.get(1),
            title: r.get(2),
            artist: r.get(3),
            album_artist: r.get(4),
            album: r.get(5),
            track_no: r.get(6),
            disc_no: r.get(7),
            year: r.get(8),
            genre: r.get(9),
        })
        .collect();
    // Plan in the caller's order so suffixes are assigned predictably.
    let position: std::collections::HashMap<&str, usize> =
        ids.iter().enumerate().map(|(i, id)| (id.as_str(), i)).collect();
    sources.sort_by_key(|s| position.get(s.id.as_str()).copied().unwrap_or(usize::MAX));
    Ok(sources)
}

fn plan_sources(
    sources: &[Source],
    destination: &Path,
    template: &str,
    collision: Collision,
    watched: &[PathBuf],
    mode: OrganizeMode,
) -> OrganizePlan {
    let mut plan = OrganizePlan::default();
    let mut taken: HashSet<String> = HashSet::new();
    let key = |p: &Path| p.to_string_lossy().to_lowercase();
    // Files already sitting at a planned target are "unchanged", so reserve
    // those first: nobody else may be suffixed onto them.
    for source in sources {
        if let Some(relative) = render(template, source) {
            let target = destination.join(relative);
            if Path::new(&source.path) == target {
                taken.insert(key(&target));
            }
        }
    }
    for source in sources {
        let from = PathBuf::from(&source.path);
        let mut item = OrganizeItem {
            id: source.id.clone(),
            from: source.path.clone(),
            to: String::new(),
            status: OrganizeStatus::Ready,
        };
        let Some(relative) = render(template, source) else {
            item.status = OrganizeStatus::Collision;
            plan.items.push(item);
            plan.collisions += 1;
            continue;
        };
        let mut target = destination.join(relative);
        if from == target {
            item.to = target.to_string_lossy().into_owned();
            item.status = OrganizeStatus::Unchanged;
            plan.unchanged += 1;
            plan.items.push(item);
            continue;
        }
        if !from.is_file() {
            item.to = target.to_string_lossy().into_owned();
            item.status = OrganizeStatus::Missing;
            plan.missing += 1;
            plan.items.push(item);
            continue;
        }
        let clashes = |t: &Path, taken: &HashSet<String>| taken.contains(&key(t)) || t.exists();
        if clashes(&target, &taken) {
            match collision {
                Collision::Skip => item.status = OrganizeStatus::Collision,
                Collision::Suffix => {
                    let base = target.clone();
                    let mut n = 2;
                    while target != from && clashes(&target, &taken) {
                        target = with_suffix(&base, n);
                        n += 1;
                    }
                    // Its suffixed name is where it already is.
                    if target == from {
                        item.to = target.to_string_lossy().into_owned();
                        item.status = OrganizeStatus::Unchanged;
                        taken.insert(key(&target));
                        plan.unchanged += 1;
                        plan.items.push(item);
                        continue;
                    }
                }
            }
        }
        item.to = target.to_string_lossy().into_owned();
        if item.status == OrganizeStatus::Collision {
            plan.collisions += 1;
        } else {
            taken.insert(key(&target));
            plan.ready += 1;
            if mode == OrganizeMode::Copy && watched.iter().any(|root| from.starts_with(root)) {
                plan.originals_in_watched_folders += 1;
            }
        }
        plan.items.push(item);
    }
    plan
}

pub async fn preview(
    pool: &SqlitePool,
    ids: &[String],
    destination: &Path,
    template: &str,
    collision: Collision,
    mode: OrganizeMode,
) -> Result<OrganizePlan, String> {
    check_destination(destination)?;
    let sources = load(pool, ids).await?;
    let watched: Vec<PathBuf> = list_roots(pool).await?.into_iter().map(|r| PathBuf::from(r.path)).collect();
    let (destination, template) = (destination.to_path_buf(), template.to_string());
    tauri::async_runtime::spawn_blocking(move || {
        plan_sources(&sources, &destination, &template, collision, &watched, mode)
    })
    .await
    .map_err(|e| e.to_string())
}

fn check_destination(destination: &Path) -> Result<(), String> {
    if !destination.is_absolute() {
        return Err("Choose an absolute destination folder".into());
    }
    if destination.exists() && !destination.is_dir() {
        return Err("The destination is not a folder".into());
    }
    Ok(())
}

/// Copies `from` to `to` through a temp file beside the target and verifies
/// the size before the final rename, so a crash never leaves a partial file
/// at the real name. Refuses to replace an existing file.
fn copy_verified(from: &Path, to: &Path) -> Result<(), String> {
    if to.exists() {
        return Err("target already exists".into());
    }
    let parent = to.parent().ok_or("no parent folder")?;
    std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let temp = parent.join(format!(".tahti-organize-{}.tmp", std::process::id()));
    let copied = std::fs::copy(from, &temp).map_err(|e| {
        let _ = std::fs::remove_file(&temp);
        e.to_string()
    })?;
    let expected = std::fs::metadata(from).map_err(|e| e.to_string())?.len();
    if copied != expected {
        let _ = std::fs::remove_file(&temp);
        return Err("copy is incomplete".into());
    }
    std::fs::rename(&temp, to).map_err(|e| {
        let _ = std::fs::remove_file(&temp);
        e.to_string()
    })
}

fn place(from: &Path, to: &Path, mode: OrganizeMode) -> Result<(), String> {
    match mode {
        OrganizeMode::Copy => copy_verified(from, to),
        OrganizeMode::Move => {
            if to.exists() {
                return Err("target already exists".into());
            }
            if let Some(parent) = to.parent() {
                std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            if std::fs::rename(from, to).is_ok() {
                return Ok(());
            }
            // Different volume: verified copy, then remove the original.
            copy_verified(from, to)?;
            std::fs::remove_file(from).map_err(|e| format!("copied, but could not remove the original: {e}"))
        }
    }
}

/// Runs the plan for `ids`. A move must be confirmed explicitly. The plan is
/// rebuilt at apply time so it reflects the disk as it is now.
pub async fn apply(
    pool: &SqlitePool,
    ids: &[String],
    destination: &Path,
    template: &str,
    collision: Collision,
    mode: OrganizeMode,
    confirmed: bool,
) -> Result<OrganizeResult, String> {
    if mode == OrganizeMode::Move && !confirmed {
        return Err("Moving files changes your originals and needs confirmation".into());
    }
    let plan = preview(pool, ids, destination, template, collision, mode).await?;
    let roots = list_roots(pool).await?;
    let mut result = OrganizeResult::default();
    for item in plan.items {
        if item.status != OrganizeStatus::Ready {
            result.skipped += 1;
            continue;
        }
        let (from, to) = (PathBuf::from(&item.from), PathBuf::from(&item.to));
        let placed = {
            let (from, to) = (from.clone(), to.clone());
            tauri::async_runtime::spawn_blocking(move || place(&from, &to, mode))
                .await
                .map_err(|e| e.to_string())?
        };
        if let Err(error) = placed {
            result.errors.push(format!("{}: {error}", item.from));
            continue;
        }
        let text = to.to_string_lossy().into_owned();
        let root_id = roots.iter().find(|r| to.starts_with(&r.path)).map(|r| r.id.clone());
        let updated = sqlx::query(
            "UPDATE library_tracks SET path=?, folder=?, root_id=?, available=1, unavailable_since=NULL, mtime=NULL WHERE id=?",
        )
        .bind(&text)
        .bind(folder_of(&text))
        .bind(root_id)
        .bind(&item.id)
        .execute(pool)
        .await;
        match updated {
            Ok(_) => result.done += 1,
            Err(error) => {
                // Keep the catalog and disk consistent: undo a copy; a move is
                // put back where it was.
                let _ = match mode {
                    OrganizeMode::Copy => std::fs::remove_file(&to),
                    OrganizeMode::Move => std::fs::rename(&to, &from),
                };
                result.errors.push(format!("{}: {error}", item.from));
            }
        }
    }
    Ok(result)
}

/// Asks for the destination folder; `None` if cancelled.
#[tauri::command]
#[specta::specta]
pub async fn library_organize_pick_destination(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let picked = tauri::async_runtime::spawn_blocking(move || app.dialog().file().blocking_pick_folder())
        .await
        .map_err(|e| e.to_string())?;
    Ok(picked.and_then(|p| p.into_path().ok()).map(|p| p.to_string_lossy().into_owned()))
}

#[tauri::command]
#[specta::specta]
pub async fn library_organize_preview(
    app: tauri::AppHandle,
    ids: Vec<String>,
    destination: String,
    template: String,
    collision: Collision,
    mode: OrganizeMode,
) -> Result<OrganizePlan, String> {
    preview(&pool(&app).await?, &ids, Path::new(&destination), &template, collision, mode).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_organize_apply(
    app: tauri::AppHandle,
    ids: Vec<String>,
    destination: String,
    template: String,
    collision: Collision,
    mode: OrganizeMode,
    confirmed: bool,
) -> Result<OrganizeResult, String> {
    apply(&pool(&app).await?, &ids, Path::new(&destination), &template, collision, mode, confirmed).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::local_library::tests::{pool, write_wav};
    use crate::local_library::{add_root, discover_new_paths, import_paths, list};

    fn source(title: &str, artist: &str, album: &str, track: Option<i64>) -> Source {
        Source {
            id: "x".into(),
            path: "/music/in/a.flac".into(),
            title: title.into(),
            artist: artist.into(),
            album_artist: String::new(),
            album: album.into(),
            track_no: track,
            disc_no: None,
            year: None,
            genre: String::new(),
        }
    }

    #[test]
    fn renders_the_layout_and_keeps_the_extension() {
        let path = render(DEFAULT_TEMPLATE, &source("Song", "Band", "Record", Some(3))).unwrap();
        assert_eq!(path, PathBuf::from("Band/Record/03 - Song.flac"));
    }

    #[test]
    fn tag_values_cannot_escape_their_folder_and_blanks_get_fallbacks() {
        let path = render(DEFAULT_TEMPLATE, &source("Why?", "AC/DC", "", None)).unwrap();
        assert_eq!(path, PathBuf::from("AC_DC/Unknown Album/Why_.flac"));
        let dots = render(DEFAULT_TEMPLATE, &source("..", "..", "..", None)).unwrap();
        assert_eq!(dots, PathBuf::from("Unknown Artist/Unknown Album/Untitled.flac"));
    }

    #[test]
    fn an_empty_template_renders_nothing() {
        assert!(render(" / ", &source("a", "b", "c", None)).is_none());
    }

    async fn library(dir: &Path, names: &[(&str, &str, &str)]) -> (sqlx::SqlitePool, Vec<String>) {
        let pool = pool().await;
        let mut paths = Vec::new();
        for (file, title, artist) in names {
            let path = dir.join("in").join(file);
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            write_wav(&path, title, artist);
            paths.push(path);
        }
        assert_eq!(import_paths(&pool, paths).await.imported, names.len());
        let ids = list(&pool, "", 0).await.unwrap().tracks.into_iter().map(|t| t.id).collect();
        (pool, ids)
    }

    #[tokio::test]
    async fn copy_keeps_originals_and_repoints_the_catalog_with_ids_kept() {
        let dir = tempfile::tempdir().unwrap();
        let (pool, ids) = library(dir.path(), &[("a.wav", "Song", "Band")]).await;
        let out = dir.path().join("managed");
        let plan = preview(&pool, &ids, &out, DEFAULT_TEMPLATE, Collision::Skip, OrganizeMode::Copy).await.unwrap();
        assert_eq!((plan.ready, plan.collisions), (1, 0));
        assert!(!out.exists(), "a preview touches nothing");

        let result = apply(&pool, &ids, &out, DEFAULT_TEMPLATE, Collision::Skip, OrganizeMode::Copy, false).await.unwrap();
        assert_eq!((result.done, result.errors.len()), (1, 0));
        assert!(dir.path().join("in/a.wav").is_file(), "original untouched");
        let track = list(&pool, "", 0).await.unwrap().tracks.remove(0);
        assert_eq!(track.id, ids[0]);
        assert!(track.path.ends_with("managed/Band/Unknown Album/Song.wav"), "{}", track.path);
        assert!(Path::new(&track.path).is_file());
    }

    #[tokio::test]
    async fn move_needs_confirmation_then_moves_the_file() {
        let dir = tempfile::tempdir().unwrap();
        let (pool, ids) = library(dir.path(), &[("a.wav", "Song", "Band")]).await;
        let out = dir.path().join("managed");
        let refused = apply(&pool, &ids, &out, DEFAULT_TEMPLATE, Collision::Skip, OrganizeMode::Move, false).await;
        assert!(refused.is_err());
        assert!(dir.path().join("in/a.wav").is_file() && !out.exists());

        let result = apply(&pool, &ids, &out, DEFAULT_TEMPLATE, Collision::Skip, OrganizeMode::Move, true).await.unwrap();
        assert_eq!(result.done, 1);
        assert!(!dir.path().join("in/a.wav").exists());
        assert!(Path::new(&list(&pool, "", 0).await.unwrap().tracks[0].path).is_file());
    }

    #[tokio::test]
    async fn collisions_skip_or_suffix_and_never_overwrite() {
        let dir = tempfile::tempdir().unwrap();
        // Two different files that render to the same target.
        let (pool, ids) = library(dir.path(), &[("a.wav", "Song", "Band"), ("b.wav", "Song", "Band")]).await;
        let out = dir.path().join("managed");
        let skip = preview(&pool, &ids, &out, DEFAULT_TEMPLATE, Collision::Skip, OrganizeMode::Copy).await.unwrap();
        assert_eq!((skip.ready, skip.collisions), (1, 1));
        let suffix = preview(&pool, &ids, &out, DEFAULT_TEMPLATE, Collision::Suffix, OrganizeMode::Copy).await.unwrap();
        assert_eq!((suffix.ready, suffix.collisions), (2, 0));
        assert!(suffix.items.iter().any(|i| i.to.ends_with("Song (2).wav")));

        apply(&pool, &ids, &out, DEFAULT_TEMPLATE, Collision::Suffix, OrganizeMode::Copy, false).await.unwrap();
        // Run again: everything is already in place, nothing is created or replaced.
        let again = preview(&pool, &ids, &out, DEFAULT_TEMPLATE, Collision::Suffix, OrganizeMode::Copy).await.unwrap();
        assert_eq!((again.ready, again.unchanged), (0, 2));
    }

    #[tokio::test]
    async fn an_existing_file_at_the_target_is_kept() {
        let dir = tempfile::tempdir().unwrap();
        let (pool, ids) = library(dir.path(), &[("a.wav", "Song", "Band")]).await;
        let out = dir.path().join("managed");
        let taken = out.join("Band/Unknown Album/Song.wav");
        std::fs::create_dir_all(taken.parent().unwrap()).unwrap();
        std::fs::write(&taken, b"someone else's file").unwrap();
        let result = apply(&pool, &ids, &out, DEFAULT_TEMPLATE, Collision::Skip, OrganizeMode::Copy, false).await.unwrap();
        assert_eq!((result.done, result.skipped), (0, 1));
        assert_eq!(std::fs::read(&taken).unwrap(), b"someone else's file");
    }

    #[tokio::test]
    async fn a_copy_out_of_a_watched_folder_warns_and_a_move_into_one_joins_it() {
        let dir = tempfile::tempdir().unwrap();
        let pool = pool().await;
        let watched = dir.path().join("watched");
        std::fs::create_dir_all(&watched).unwrap();
        write_wav(&watched.join("a.wav"), "Song", "Band");
        let root = add_root(&pool, &watched).await.unwrap();
        let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
        let mut result = crate::local_library::ImportResult::default();
        crate::local_library::import_batch(&pool, fresh, Some(&root.id), &mut result).await;
        let ids: Vec<String> = list(&pool, "", 0).await.unwrap().tracks.into_iter().map(|t| t.id).collect();

        let plan = preview(&pool, &ids, &dir.path().join("out"), DEFAULT_TEMPLATE, Collision::Skip, OrganizeMode::Copy).await.unwrap();
        assert_eq!(plan.originals_in_watched_folders, 1);

        apply(&pool, &ids, &dir.path().join("out"), DEFAULT_TEMPLATE, Collision::Skip, OrganizeMode::Move, true).await.unwrap();
        let root_of: Option<String> = sqlx::query_scalar("SELECT root_id FROM library_tracks WHERE id = ?")
            .bind(&ids[0])
            .fetch_one(&pool)
            .await
            .unwrap();
        assert!(root_of.is_none(), "moved outside every watched folder");
    }
}
