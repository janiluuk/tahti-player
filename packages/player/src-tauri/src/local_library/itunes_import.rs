//! Importing an iTunes / Music.app library XML (desktop-pro-library.md
//! Phase 1): link each track to the catalog by path, import files that are on
//! disk but not in the catalog yet, layer the XML's metadata and user data
//! over what the files say, and recreate the user's playlists.
//!
//! Two steps: `preview` only reads (the XML, the disk and the catalog) and
//! reports counts; `commit` writes. Audio files are never modified.
//!
//! Overlay rules, so nothing already known is lost:
//! - Tag fields fill gaps only. A field the file already has a value for is
//!   kept (and counted), a hand edit is never replaced. A filled field is a
//!   regular override (`library_track_overrides`), so it survives a rescan
//!   and "revert to file tag" still works.
//! - A rating is applied only to an unrated track; loved tracks get the
//!   `Loved` tag; last played / date added take the later / earlier value.
//! - Play and skip counts are running totals in iTunes, so only the growth
//!   since the previous import of the same iTunes track is added
//!   (`library_itunes_tracks`). Running the same import twice adds nothing.
//! - A playlist already imported (`library_itunes_playlists`) is left alone.

use std::collections::{HashMap, HashSet};
use std::ffi::OsString;
use std::path::{Component, Path, PathBuf};

use serde::Serialize;
use specta_typescript::Number;
use sqlx::{Row, SqliteConnection, SqlitePool};
use tauri_plugin_dialog::DialogExt;
use unicode_normalization::UnicodeNormalization;

use super::backup::{free_playlist_name, map_path, under, RootMapping};
use super::catalog::{apply_edits_on, tag_id_for, EditField, FieldEdit};
use super::import::IMPORT_BATCH;
use super::itunes_xml::{location_to_path, parse_library, XmlLibrary, XmlTrack};
use super::playlists::{insert_entry, RawEntry};
use super::{import_batch, is_supported_audio_file, pool, ImportFailure, ImportResult};

pub const LOVED_TAG: &str = "Loved";
const FOLDER_SEPARATOR: &str = " / ";
const EXAMPLES: usize = 8;
const ERRORS_KEPT: usize = 50;
const OVERLAY_CHUNK: usize = 500;

#[derive(Debug, Clone, PartialEq)]
enum Status {
    /// No `file://` location: a stream or a cloud-only item.
    NotLocal,
    Unsupported,
    Missing,
    InCatalog(String),
    ToImport,
}

#[derive(Debug, Clone)]
struct Planned {
    status: Status,
    path: Option<String>,
    /// Another XML track already resolved to the same file.
    duplicate: bool,
}

fn nfc(text: &str) -> String {
    text.nfc().collect()
}

/// Finds a file the way it is spelled on disk. iTunes and the filesystem can
/// disagree on Unicode normalization (NFC vs NFD) for the same name; the
/// catalog stores the on-disk spelling (from folder walks), so matching and
/// importing must use it too, or the same file would be catalogued twice.
#[derive(Default)]
struct DiskLookup {
    listings: HashMap<PathBuf, Option<HashMap<String, OsString>>>,
}

impl DiskLookup {
    fn resolve(&mut self, path: &str) -> Option<PathBuf> {
        let direct = Path::new(path);
        if path.is_ascii() {
            return direct.is_file().then(|| direct.to_path_buf());
        }
        self.respell(direct).or_else(|| direct.is_file().then(|| direct.to_path_buf()))
    }

    fn respell(&mut self, path: &Path) -> Option<PathBuf> {
        let mut out = PathBuf::new();
        for component in path.components() {
            match component {
                Component::Normal(name) => {
                    let text = name.to_string_lossy();
                    if text.is_ascii() {
                        out.push(name);
                        continue;
                    }
                    let listing = self.listings.entry(out.clone()).or_insert_with(|| list_dir(&out));
                    let real = listing.as_ref()?.get(&nfc(&text))?.clone();
                    out.push(real);
                }
                other => out.push(other.as_os_str()),
            }
        }
        out.is_file().then_some(out)
    }
}

fn list_dir(dir: &Path) -> Option<HashMap<String, OsString>> {
    let entries = std::fs::read_dir(dir).ok()?;
    Some(
        entries
            .filter_map(Result::ok)
            .map(|entry| {
                let name = entry.file_name();
                (nfc(&name.to_string_lossy()), name)
            })
            .collect(),
    )
}

/// Catalog paths (NFC) -> track id.
async fn catalog_paths(pool: &SqlitePool) -> Result<HashMap<String, String>, String> {
    let rows = sqlx::query("SELECT path, id FROM library_tracks")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(rows.into_iter().map(|row| (nfc(&row.get::<String, _>(0)), row.get(1))).collect())
}

fn plan_tracks(library: &XmlLibrary, mappings: &[RootMapping], catalog: &HashMap<String, String>) -> Vec<Planned> {
    let mut disk = DiskLookup::default();
    let mut seen: HashSet<String> = HashSet::new();
    library
        .tracks
        .iter()
        .map(|track| {
            let Some(decoded) = track.location.as_deref().and_then(location_to_path) else {
                return Planned { status: Status::NotLocal, path: None, duplicate: false };
            };
            let mapped = map_path(&decoded, mappings);
            if !is_supported_audio_file(Path::new(&mapped)) {
                let duplicate = !seen.insert(nfc(&mapped));
                return Planned { status: Status::Unsupported, path: Some(mapped), duplicate };
            }
            // The importer stores canonical paths (symlinks resolved), so
            // matching must compare against the same form.
            let on_disk = disk
                .resolve(&mapped)
                .map(|p| std::fs::canonicalize(&p).unwrap_or(p).to_string_lossy().into_owned());
            let path = on_disk.clone().unwrap_or(mapped);
            let key = nfc(&path);
            let duplicate = !seen.insert(key.clone());
            let status = match (catalog.get(&key), &on_disk) {
                (Some(id), _) => Status::InCatalog(id.clone()),
                (None, Some(_)) => Status::ToImport,
                (None, None) => Status::Missing,
            };
            Planned { status, path: Some(path), duplicate }
        })
        .collect()
}

fn read_library(source: &Path) -> Result<XmlLibrary, String> {
    let file = std::fs::File::open(source).map_err(|e| format!("Could not read the file: {e}"))?;
    parse_library(std::io::BufReader::with_capacity(1 << 16, file))
}

async fn load_and_plan(
    pool: &SqlitePool,
    source: &Path,
    mappings: &[RootMapping],
) -> Result<(XmlLibrary, Vec<Planned>), String> {
    let catalog = catalog_paths(pool).await?;
    let source = source.to_path_buf();
    let mappings = mappings.to_vec();
    tauri::async_runtime::spawn_blocking(move || {
        let library = read_library(&source)?;
        let plans = plan_tracks(&library, &mappings, &catalog);
        Ok::<_, String>((library, plans))
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Stable key for remembering an iTunes track between imports.
fn track_key(track: &XmlTrack) -> String {
    if track.persistent_id.is_empty() {
        format!("track-id:{}", track.track_id)
    } else {
        track.persistent_id.clone()
    }
}

async fn imported_playlist_ids(pool: &SqlitePool) -> Result<HashSet<String>, String> {
    sqlx::query_scalar(
        "SELECT i.persistent_id FROM library_itunes_playlists i JOIN library_playlists p ON p.id = i.playlist_id",
    )
    .fetch_all(pool)
    .await
    .map(|ids: Vec<String>| ids.into_iter().collect())
    .map_err(|e| e.to_string())
}

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ItunesPreview {
    /// The library's `Music Folder`, as a local path: the prefix to remap
    /// when the music has moved since the export.
    pub music_folder: Option<String>,
    #[specta(type = Number<usize>)]
    pub tracks: usize,
    /// Per file: an XML track pointing at a file an earlier one already
    /// points at is only counted in `duplicate_tracks`.
    /// Found in the catalog by path; will be linked, nothing imported.
    #[specta(type = Number<usize>)]
    pub tracks_in_catalog: usize,
    /// On disk but not in the catalog yet; will be imported.
    #[specta(type = Number<usize>)]
    pub tracks_to_import: usize,
    #[specta(type = Number<usize>)]
    pub tracks_missing: usize,
    /// A file the importer cannot read (protected AAC, video, ...).
    #[specta(type = Number<usize>)]
    pub tracks_unsupported: usize,
    /// No local file at all (streams, cloud-only items).
    #[specta(type = Number<usize>)]
    pub tracks_not_local: usize,
    /// XML tracks pointing at a file another XML track already points at.
    #[specta(type = Number<usize>)]
    pub duplicate_tracks: usize,
    /// XML tracks a previous import already linked.
    #[specta(type = Number<usize>)]
    pub previously_imported: usize,
    #[specta(type = Number<usize>)]
    pub playlists: usize,
    #[specta(type = Number<usize>)]
    pub playlist_entries: usize,
    #[specta(type = Number<usize>)]
    pub playlist_folders: usize,
    #[specta(type = Number<usize>)]
    pub playlists_already_imported: usize,
    /// Library, Music, Podcasts and the other lists Music.app makes itself.
    #[specta(type = Number<usize>)]
    pub builtin_playlists_skipped: usize,
    pub missing_examples: Vec<String>,
    pub unsupported_examples: Vec<String>,
}

pub async fn preview(pool: &SqlitePool, source: &Path, mappings: &[RootMapping]) -> Result<ItunesPreview, String> {
    let (library, plans) = load_and_plan(pool, source, mappings).await?;
    let known: HashSet<String> = sqlx::query_scalar("SELECT persistent_id FROM library_itunes_tracks WHERE track_id IS NOT NULL")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .collect();
    let imported_playlists = imported_playlist_ids(pool).await?;
    let mut out = ItunesPreview {
        music_folder: library.music_folder.as_deref().and_then(location_to_path),
        tracks: library.tracks.len(),
        ..Default::default()
    };
    for (track, plan) in library.tracks.iter().zip(&plans) {
        if known.contains(&track_key(track)) {
            out.previously_imported += 1;
        }
        if plan.duplicate {
            out.duplicate_tracks += 1;
            continue;
        }
        let path = plan.path.clone().unwrap_or_default();
        match &plan.status {
            Status::NotLocal => out.tracks_not_local += 1,
            Status::Unsupported => {
                out.tracks_unsupported += 1;
                if out.unsupported_examples.len() < EXAMPLES {
                    out.unsupported_examples.push(path);
                }
            }
            Status::Missing => {
                out.tracks_missing += 1;
                if out.missing_examples.len() < EXAMPLES {
                    out.missing_examples.push(path);
                }
            }
            Status::InCatalog(_) => out.tracks_in_catalog += 1,
            Status::ToImport => out.tracks_to_import += 1,
        }
    }
    let local_ids: HashSet<i64> = library
        .tracks
        .iter()
        .zip(&plans)
        .filter(|(_, plan)| plan.status != Status::NotLocal)
        .map(|(track, _)| track.track_id)
        .collect();
    for playlist in &library.playlists {
        if playlist.builtin {
            out.builtin_playlists_skipped += 1;
        } else if playlist.folder {
            out.playlist_folders += 1;
        } else if imported_playlists.contains(&playlist.persistent_id) {
            out.playlists_already_imported += 1;
        } else {
            out.playlists += 1;
            out.playlist_entries += playlist.track_ids.iter().filter(|id| local_ids.contains(id)).count();
        }
    }
    Ok(out)
}

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ItunesImportResult {
    /// XML tracks linked to a track that was already in the catalog.
    #[specta(type = Number<usize>)]
    pub tracks_linked: usize,
    /// Files imported into the catalog by this run.
    #[specta(type = Number<usize>)]
    pub tracks_imported: usize,
    #[specta(type = Number<usize>)]
    pub tracks_failed: usize,
    #[specta(type = Number<usize>)]
    pub tracks_missing: usize,
    #[specta(type = Number<usize>)]
    pub tracks_unsupported: usize,
    #[specta(type = Number<usize>)]
    pub tracks_not_local: usize,
    #[specta(type = Number<usize>)]
    pub duplicate_tracks: usize,
    /// Plays added to local play counts (growth since the last import only).
    #[specta(type = Number<i64>)]
    pub plays_added: i64,
    #[specta(type = Number<i64>)]
    pub skips_added: i64,
    #[specta(type = Number<usize>)]
    pub ratings_applied: usize,
    #[specta(type = Number<usize>)]
    pub loved_tagged: usize,
    /// Empty tag fields filled from the XML.
    #[specta(type = Number<usize>)]
    pub fields_filled: usize,
    /// Fields where the file's own tag differs from the XML and was kept.
    #[specta(type = Number<usize>)]
    pub fields_kept_from_file: usize,
    #[specta(type = Number<usize>)]
    pub bpm_applied: usize,
    #[specta(type = Number<usize>)]
    pub playlists_created: usize,
    /// Created under a new name because the name was taken.
    #[specta(type = Number<usize>)]
    pub playlists_renamed: usize,
    #[specta(type = Number<usize>)]
    pub playlists_already_imported: usize,
    #[specta(type = Number<usize>)]
    pub playlist_entries: usize,
    /// Entries kept but not linked to a catalog track (file missing or not
    /// importable); they link up by path when the file joins the catalog.
    #[specta(type = Number<usize>)]
    pub playlist_entries_unavailable: usize,
    /// Entries with no local file at all, left out.
    #[specta(type = Number<usize>)]
    pub playlist_entries_skipped: usize,
    /// First import failures (the rest are only counted).
    pub errors: Vec<ImportFailure>,
}

async fn import_missing(pool: &SqlitePool, plans: &[Planned], result: &mut ItunesImportResult) -> Result<(), String> {
    let roots: Vec<(String, String)> = sqlx::query("SELECT path, id FROM library_roots")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|row| (row.get(0), row.get(1)))
        .collect();
    let mut by_root: HashMap<Option<String>, Vec<PathBuf>> = HashMap::new();
    for plan in plans.iter().filter(|p| p.status == Status::ToImport && !p.duplicate) {
        let Some(path) = &plan.path else { continue };
        let root_id = roots
            .iter()
            .filter(|(root, _)| under(path, root))
            .max_by_key(|(root, _)| root.len())
            .map(|(_, id)| id.clone());
        by_root.entry(root_id).or_default().push(PathBuf::from(path));
    }
    let mut imported = ImportResult::default();
    for (root_id, paths) in by_root {
        for chunk in paths.chunks(IMPORT_BATCH) {
            import_batch(pool, chunk.to_vec(), root_id.as_deref(), &mut imported).await;
        }
    }
    result.tracks_imported = imported.imported;
    result.tracks_failed = imported.errors.len();
    result.errors = imported.errors.into_iter().take(ERRORS_KEPT).collect();
    Ok(())
}

fn file_stem(path: &str) -> String {
    Path::new(path).file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default()
}

/// Tag values from the XML that may fill a gap, in their stored text form.
fn xml_fields(track: &XmlTrack) -> Vec<(EditField, String)> {
    let number = |value: Option<i64>, low: i64| value.filter(|n| (low..=9999).contains(n)).map(|n| n.to_string());
    [
        (EditField::Title, Some(track.name.clone())),
        (EditField::Artist, Some(track.artist.clone())),
        (EditField::AlbumArtist, Some(track.album_artist.clone())),
        (EditField::Album, Some(track.album.clone())),
        (EditField::Genre, Some(track.genre.clone())),
        (EditField::Comment, Some(track.comments.clone())),
        (EditField::Year, number(track.year, 1000)),
        (EditField::TrackNo, number(track.track_number, 1)),
        (EditField::DiscNo, number(track.disc_number, 1)),
    ]
    .into_iter()
    .filter_map(|(field, value)| value.filter(|v| !v.is_empty()).map(|v| (field, v)))
    .collect()
}

fn later(current: Option<String>, candidate: Option<&String>) -> Option<String> {
    match (current, candidate) {
        (Some(current), Some(candidate)) if candidate > &current => Some(candidate.clone()),
        (None, Some(candidate)) => Some(candidate.clone()),
        (current, _) => current,
    }
}

async fn apply_overlay(
    conn: &mut SqliteConnection,
    id: &str,
    track: &XmlTrack,
    fill_tags: bool,
    result: &mut ItunesImportResult,
    bpm_ids: &mut Vec<String>,
) -> Result<(), String> {
    let err = |e: sqlx::Error| e.to_string();
    let key = track_key(track);
    let previous = sqlx::query("SELECT track_id, play_count, skip_count FROM library_itunes_tracks WHERE persistent_id=?")
        .bind(&key)
        .fetch_optional(&mut *conn)
        .await
        .map_err(err)?;
    // Counts already added only matter if they went to this same catalog
    // track; a track removed and re-imported starts from zero again.
    let (seen_plays, seen_skips) = match previous {
        Some(row) if row.get::<Option<String>, _>(0).as_deref() == Some(id) => (row.get::<i64, _>(1), row.get::<i64, _>(2)),
        _ => (0, 0),
    };
    let plays = (track.play_count - seen_plays).max(0);
    let skips = (track.skip_count - seen_skips).max(0);

    let row = sqlx::query(
        "SELECT rating, last_played_at, added_at, path, title, artist, album_artist, album, genre, comment, \
         COALESCE(CAST(year AS TEXT), ''), COALESCE(CAST(track_no AS TEXT), ''), COALESCE(CAST(disc_no AS TEXT), ''), bpm \
         FROM library_tracks WHERE id=?",
    )
    .bind(id)
    .fetch_one(&mut *conn)
    .await
    .map_err(err)?;
    let rating: i64 = row.get(0);
    let new_rating = match track.stars() {
        Some(stars) if rating == 0 => {
            result.ratings_applied += 1;
            stars
        }
        _ => rating,
    };
    let last_played = later(row.get(1), track.last_played.as_ref());
    let added_at: String = row.get(2);
    let added_at = match &track.date_added {
        Some(date) if date < &added_at => date.clone(),
        _ => added_at,
    };
    sqlx::query("UPDATE library_tracks SET play_count = play_count + ?, skip_count = skip_count + ?, rating=?, last_played_at=?, added_at=? WHERE id=?")
        .bind(plays)
        .bind(skips)
        .bind(new_rating)
        .bind(&last_played)
        .bind(&added_at)
        .bind(id)
        .execute(&mut *conn)
        .await
        .map_err(err)?;
    result.plays_added += plays;
    result.skips_added += skips;

    if track.loved {
        let tag = tag_id_for(conn, LOVED_TAG).await.map_err(err)?;
        let added = sqlx::query("INSERT OR IGNORE INTO library_track_tags (track_id, tag_id) VALUES (?,?)")
            .bind(id)
            .bind(&tag)
            .execute(&mut *conn)
            .await
            .map_err(err)?
            .rows_affected();
        result.loved_tagged += added as usize;
    }

    let edited: HashSet<String> = sqlx::query_scalar("SELECT field FROM library_track_overrides WHERE track_id=?")
        .bind(id)
        .fetch_all(&mut *conn)
        .await
        .map_err(err)?
        .into_iter()
        .collect();
    let path: String = row.get(3);
    let current = |field: EditField| -> String {
        let index = match field {
            EditField::Title => 4,
            EditField::Artist => 5,
            EditField::AlbumArtist => 6,
            EditField::Album => 7,
            EditField::Genre => 8,
            EditField::Comment => 9,
            EditField::Year => 10,
            EditField::TrackNo => 11,
            EditField::DiscNo => 12,
        };
        row.get(index)
    };
    let mut edits = Vec::new();
    let fields = if fill_tags { xml_fields(track) } else { Vec::new() };
    for (field, value) in fields {
        if edited.contains(field.column()) {
            continue;
        }
        let now = current(field);
        // Extraction uses the file name when a file has no title tag; that
        // placeholder is a gap, not a tag.
        let gap = now.trim().is_empty() || (field == EditField::Title && now == file_stem(&path));
        if gap && now != value {
            edits.push(FieldEdit { field, value: Some(value) });
        } else if now.trim() != value.trim() {
            result.fields_kept_from_file += 1;
        }
    }
    if !edits.is_empty() {
        result.fields_filled += apply_edits_on(conn, &[id.to_owned()], &edits).await?.len();
    }

    let bpm: Option<f64> = row.get(13);
    if let Some(value) = track.bpm.filter(|v| (30..=300).contains(v)) {
        if bpm.is_none() {
            let inserted = sqlx::query("INSERT OR IGNORE INTO library_analysis_user (track_id, bpm) VALUES (?,?)")
                .bind(id)
                .bind(value as f64)
                .execute(&mut *conn)
                .await
                .map_err(err)?
                .rows_affected();
            if inserted > 0 {
                result.bpm_applied += 1;
                bpm_ids.push(id.to_owned());
            }
        }
    }

    sqlx::query(
        "INSERT INTO library_itunes_tracks (persistent_id, track_id, path, play_count, skip_count) VALUES (?,?,?,?,?) \
         ON CONFLICT(persistent_id) DO UPDATE SET track_id=excluded.track_id, path=excluded.path, \
         play_count=excluded.play_count, skip_count=excluded.skip_count, imported_at=CURRENT_TIMESTAMP",
    )
    .bind(&key)
    .bind(id)
    .bind(&path)
    .bind(track.play_count)
    .bind(track.skip_count)
    .execute(&mut *conn)
    .await
    .map_err(err)?;
    Ok(())
}

fn folder_chain(library: &XmlLibrary, parent: Option<&str>) -> Vec<String> {
    let by_id: HashMap<&str, (&str, Option<&str>)> = library
        .playlists
        .iter()
        .map(|p| (p.persistent_id.as_str(), (p.name.as_str(), p.parent_persistent_id.as_deref())))
        .collect();
    let mut chain = Vec::new();
    let mut visited = HashSet::new();
    let mut next = parent;
    while let Some(id) = next {
        if !visited.insert(id) {
            break;
        }
        let Some((name, parent)) = by_id.get(id) else { break };
        chain.push((*name).to_owned());
        next = *parent;
    }
    chain.reverse();
    chain
}

async fn import_playlists(
    pool: &SqlitePool,
    library: &XmlLibrary,
    plans: &[Planned],
    ids: &[Option<String>],
    result: &mut ItunesImportResult,
) -> Result<(), String> {
    let index: HashMap<i64, usize> = library.tracks.iter().enumerate().map(|(i, t)| (t.track_id, i)).collect();
    let already = imported_playlist_ids(pool).await?;
    for playlist in library.playlists.iter().filter(|p| !p.builtin && !p.folder) {
        if already.contains(&playlist.persistent_id) {
            result.playlists_already_imported += 1;
            continue;
        }
        let folders = folder_chain(library, playlist.parent_persistent_id.as_deref());
        let own = if playlist.name.is_empty() { "Untitled playlist".to_owned() } else { playlist.name.clone() };
        let wanted: String = folders.iter().cloned().chain([own]).collect::<Vec<_>>().join(FOLDER_SEPARATOR);
        let name = free_playlist_name(pool, &wanted, "iTunes").await?;
        if name != wanted {
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
        let mut position = 0i64;
        for track_id in &playlist.track_ids {
            let Some(&i) = index.get(track_id) else {
                result.playlist_entries_skipped += 1;
                continue;
            };
            let (track, plan) = (&library.tracks[i], &plans[i]);
            let Some(path) = plan.path.clone().filter(|_| plan.status != Status::NotLocal) else {
                result.playlist_entries_skipped += 1;
                continue;
            };
            if ids[i].is_none() {
                result.playlist_entries_unavailable += 1;
            }
            let raw = RawEntry {
                entry_id: String::new(),
                track_id: ids[i].clone(),
                title: if track.name.is_empty() { file_stem(&path) } else { track.name.clone() },
                artist: track.artist.clone(),
                duration: track.total_time.map(|ms| ms as f64 / 1000.0).unwrap_or(0.0),
                path,
            };
            insert_entry(&mut tx, &playlist_id, position, &uuid::Uuid::new_v4().to_string(), &raw).await?;
            position += 1;
        }
        sqlx::query(
            "INSERT INTO library_itunes_playlists (persistent_id, playlist_id, folder_path) VALUES (?,?,?) \
             ON CONFLICT(persistent_id) DO UPDATE SET playlist_id=excluded.playlist_id, folder_path=excluded.folder_path, imported_at=CURRENT_TIMESTAMP",
        )
        .bind(&playlist.persistent_id)
        .bind(&playlist_id)
        .bind(folders.join(FOLDER_SEPARATOR))
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
        tx.commit().await.map_err(|e| e.to_string())?;
        result.playlists_created += 1;
        result.playlist_entries += position as usize;
    }
    Ok(())
}

pub async fn commit(pool: &SqlitePool, source: &Path, mappings: &[RootMapping]) -> Result<ItunesImportResult, String> {
    let (library, plans) = load_and_plan(pool, source, mappings).await?;
    let mut result = ItunesImportResult::default();
    for plan in &plans {
        if plan.duplicate {
            result.duplicate_tracks += 1;
            continue;
        }
        match plan.status {
            Status::NotLocal => result.tracks_not_local += 1,
            Status::Unsupported => result.tracks_unsupported += 1,
            Status::Missing => result.tracks_missing += 1,
            Status::InCatalog(_) => result.tracks_linked += 1,
            Status::ToImport => {}
        }
    }
    import_missing(pool, &plans, &mut result).await?;

    let catalog = catalog_paths(pool).await?;
    let ids: Vec<Option<String>> = plans
        .iter()
        .map(|plan| match (&plan.status, &plan.path) {
            (Status::InCatalog(id), _) => Some(id.clone()),
            (Status::ToImport, Some(path)) => catalog.get(&nfc(path)).cloned(),
            _ => None,
        })
        .collect();

    let mut bpm_ids = Vec::new();
    // Every XML entry of a file adds its plays; only the first one fills tags.
    let linked: Vec<(&XmlTrack, &String, bool)> = library
        .tracks
        .iter()
        .zip(&ids)
        .zip(&plans)
        .filter_map(|((track, id), plan)| id.as_ref().map(|id| (track, id, !plan.duplicate)))
        .collect();
    for chunk in linked.chunks(OVERLAY_CHUNK) {
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
        for (track, id, fill_tags) in chunk {
            apply_overlay(&mut tx, id, track, *fill_tags, &mut result, &mut bpm_ids).await?;
        }
        tx.commit().await.map_err(|e| e.to_string())?;
    }
    super::analysis::refresh_effective(pool, &bpm_ids).await?;

    import_playlists(pool, &library, &plans, &ids, &mut result).await?;
    Ok(result)
}

#[tauri::command]
#[specta::specta]
pub async fn library_itunes_pick(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let dialog_app = app.clone();
    let picked = tauri::async_runtime::spawn_blocking(move || {
        dialog_app
            .dialog()
            .file()
            .add_filter("iTunes or Music library", &["xml"])
            .blocking_pick_file()
            .and_then(|file| file.into_path().ok())
    })
    .await
    .map_err(|e| e.to_string())?;
    Ok(picked.map(|p| p.to_string_lossy().into_owned()))
}

#[tauri::command]
#[specta::specta]
pub async fn library_itunes_preview(
    app: tauri::AppHandle,
    source_path: String,
    mappings: Vec<RootMapping>,
) -> Result<ItunesPreview, String> {
    preview(&pool(&app).await?, Path::new(&source_path), &mappings).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_itunes_commit(
    app: tauri::AppHandle,
    source_path: String,
    mappings: Vec<RootMapping>,
) -> Result<ItunesImportResult, String> {
    commit(&pool(&app).await?, Path::new(&source_path), &mappings).await
}
