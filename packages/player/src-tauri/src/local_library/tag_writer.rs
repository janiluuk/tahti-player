//! Optional, explicit write-back of hand-edited tags into the audio files
//! (desktop-pro-library.md Phase 4). Everything else in the catalog leaves
//! files alone; this only runs when the user asks, and only writes the fields
//! they edited.
//!
//! Supported formats: FLAC (Vorbis comments) and WAV (RIFF INFO), the two the
//! importer accepts. Writes are recoverable: the file is copied to a temp
//! file beside it, tagged there, re-read to verify, then atomically renamed
//! over the original; on any failure the original is untouched. By default a
//! `.tahti-backup` copy of the original is kept next to it.

use std::path::{Path, PathBuf};

use lofty::config::WriteOptions;
use lofty::file::TaggedFileExt;
use lofty::prelude::*;
use lofty::probe::Probe;
use lofty::tag::{ItemKey, Tag, TagType};
use serde::Serialize;
use specta_typescript::Number;
use sqlx::{Row, SqlitePool};

use super::catalog::EditField;
use super::{metadata, pool};

pub const WRITABLE_FORMATS: [&str; 2] = ["flac", "wav"];

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WriteSkip {
    pub path: String,
    pub reason: String,
}

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WriteTagsPreview {
    /// Files that would be written.
    #[specta(type = Number<usize>)]
    pub writable: usize,
    /// Selected tracks with no hand-edited fields.
    #[specta(type = Number<usize>)]
    pub no_edits: usize,
    pub skipped: Vec<WriteSkip>,
    /// Formats this can write, for the "supported formats" note.
    pub formats: Vec<String>,
}

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct WriteTagsResult {
    #[specta(type = Number<usize>)]
    pub written: usize,
    pub skipped: Vec<WriteSkip>,
    pub failed: Vec<WriteSkip>,
    /// Edits the app's own reader now sees in the file, so they no longer
    /// need to be kept as overrides.
    #[specta(type = Number<usize>)]
    pub edits_settled: usize,
    /// Edits written to the file but not visible to the app's reader (for
    /// example WAV INFO stored after the audio); kept as overrides so the
    /// library still shows them.
    #[specta(type = Number<usize>)]
    pub edits_kept: usize,
    /// Edited fields the file format has no place for (kept in the library only).
    #[specta(type = Number<usize>)]
    pub fields_unsupported: usize,
}

struct Candidate {
    id: String,
    path: PathBuf,
    format: String,
    edits: Vec<(EditField, String)>,
}

fn skip(path: &str, reason: &str) -> WriteSkip {
    WriteSkip { path: path.to_owned(), reason: reason.to_owned() }
}

async fn classify(
    pool: &SqlitePool,
    ids: &[String],
) -> Result<(Vec<Candidate>, usize, Vec<WriteSkip>), String> {
    let mut ok = Vec::new();
    let mut no_edits = 0usize;
    let mut skipped = Vec::new();
    for id in ids {
        let Some(row) = sqlx::query("SELECT path, format FROM library_tracks WHERE id=?")
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())?
        else {
            continue;
        };
        let path: String = row.get(0);
        let format: String = row.get(1);
        let edits: Vec<(EditField, String)> = sqlx::query("SELECT field, value FROM library_track_overrides WHERE track_id=?")
            .bind(id)
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?
            .into_iter()
            .filter_map(|r| {
                let column: String = r.get(0);
                EditField::ALL.into_iter().find(|f| f.column() == column).map(|f| (f, r.get::<String, _>(1)))
            })
            .collect();
        if edits.is_empty() {
            no_edits += 1;
            continue;
        }
        if !WRITABLE_FORMATS.contains(&format.to_ascii_lowercase().as_str()) {
            skipped.push(skip(&path, &format!("{} files can't be written yet", format.to_uppercase())));
            continue;
        }
        match std::fs::metadata(&path) {
            Err(_) => skipped.push(skip(&path, "The file is missing")),
            Ok(meta) if meta.permissions().readonly() => skipped.push(skip(&path, "The file is read-only")),
            Ok(_) => ok.push(Candidate { id: id.clone(), path: PathBuf::from(path), format: format.to_ascii_lowercase(), edits }),
        }
    }
    Ok((ok, no_edits, skipped))
}

pub async fn preview(pool: &SqlitePool, ids: &[String]) -> Result<WriteTagsPreview, String> {
    let (ok, no_edits, skipped) = classify(pool, ids).await?;
    Ok(WriteTagsPreview {
        writable: ok.len(),
        no_edits,
        skipped,
        formats: WRITABLE_FORMATS.iter().map(|f| f.to_uppercase()).collect(),
    })
}

fn number(value: &str) -> Option<u32> {
    value.parse().ok()
}

fn apply(tag: &mut Tag, edits: &[(EditField, String)]) {
    for (field, value) in edits {
        let text = value.as_str();
        match field {
            EditField::Title => tag.set_title(text.to_owned()),
            EditField::Artist => set_or_clear(tag, ItemKey::TrackArtist, text),
            EditField::Album => set_or_clear(tag, ItemKey::AlbumTitle, text),
            EditField::AlbumArtist => set_or_clear(tag, ItemKey::AlbumArtist, text),
            EditField::Genre => set_or_clear(tag, ItemKey::Genre, text),
            EditField::Comment => set_or_clear(tag, ItemKey::Comment, text),
            EditField::Year => match number(text) {
                Some(n) => tag.set_year(n),
                None => tag.remove_year(),
            },
            EditField::TrackNo => match number(text) {
                Some(n) => tag.set_track(n),
                None => tag.remove_track(),
            },
            EditField::DiscNo => match number(text) {
                Some(n) => tag.set_disk(n),
                None => tag.remove_disk(),
            },
        }
    }
}

fn set_or_clear(tag: &mut Tag, key: ItemKey, value: &str) {
    if value.is_empty() {
        tag.remove_key(&key);
    } else {
        tag.insert_text(key, value.to_owned());
    }
}

/// Copies `path` to a temp file, tags the copy, verifies it, and swaps it in.
fn write_one(path: &Path, format: &str, edits: &[(EditField, String)], keep_backup: bool) -> Result<Vec<EditField>, String> {
    let dir = path.parent().ok_or("No folder")?;
    let stem = path.file_stem().and_then(|s| s.to_str()).ok_or("Bad file name")?;
    let temp = dir.join(format!("{stem}.tahti-tmp.{format}"));
    let result = (|| -> Result<Vec<EditField>, String> {
        std::fs::copy(path, &temp).map_err(|e| format!("Could not copy the file: {e}"))?;
        let mut tagged = Probe::open(&temp)
            .and_then(|p| p.read())
            .map_err(|e| format!("Could not read the tags: {e}"))?;
        // FLAC: its own tag. WAV: RIFF INFO (the tag the importer reads),
        // plus any ID3v2 chunk already in the file so the two never disagree.
        let main = if format == "wav" { TagType::RiffInfo } else { tagged.primary_tag_type() };
        if tagged.tag(main).is_none() {
            tagged.insert_tag(Tag::new(main));
        }
        let kinds: Vec<TagType> = tagged.tags().iter().map(|t| t.tag_type()).collect();
        for kind in kinds {
            if let Some(tag) = tagged.tag_mut(kind) {
                apply(tag, edits);
            }
        }
        tagged
            .save_to_path(&temp, WriteOptions::default())
            .map_err(|e| format!("Could not write the tags: {e}"))?;
        // Verify: the tagged copy must parse, keep the same audio properties
        // and hold what we wrote.
        let before = Probe::open(path).and_then(|p| p.read()).map_err(|e| e.to_string())?;
        let after = Probe::open(&temp).and_then(|p| p.read()).map_err(|e| format!("The tagged copy did not verify: {e}"))?;
        if before.properties().duration() != after.properties().duration()
            || before.properties().sample_rate() != after.properties().sample_rate()
        {
            return Err("The tagged copy's audio did not match the original.".to_owned());
        }
        metadata::read(&temp).map_err(|e| format!("The tagged copy did not verify: {e}"))?;
        let written = after.tag(main).ok_or("The tags were not saved")?;
        // A container that has no slot for a field (RIFF INFO has no album
        // artist or disc number) silently drops it: report that, don't fail.
        let mut unsupported = Vec::new();
        for (field, value) in edits {
            let got = match field {
                EditField::Title => written.title().map(|v| v.to_string()),
                EditField::Artist => written.artist().map(|v| v.to_string()),
                EditField::Album => written.album().map(|v| v.to_string()),
                EditField::AlbumArtist => written.get_string(&ItemKey::AlbumArtist).map(str::to_owned),
                EditField::Genre => written.genre().map(|v| v.to_string()),
                EditField::Comment => written.comment().map(|v| v.to_string()),
                EditField::Year => written.year().map(|v| v.to_string()),
                EditField::TrackNo => written.track().map(|v| v.to_string()),
                EditField::DiscNo => written.disk().map(|v| v.to_string()),
            }
            .unwrap_or_default();
            if got.is_empty() && !value.is_empty() {
                unsupported.push(*field);
            } else if got != *value {
                return Err(format!("The saved {} did not read back as written.", field.column()));
            }
        }
        if keep_backup {
            let mut backup = dir.join(format!("{stem}.{format}.tahti-backup"));
            let mut n = 2;
            while backup.exists() {
                backup = dir.join(format!("{stem}.{format}.tahti-backup{n}"));
                n += 1;
            }
            std::fs::copy(path, &backup).map_err(|e| format!("Could not keep a backup copy: {e}"))?;
        }
        std::fs::rename(&temp, path).map_err(|e| format!("Could not replace the file: {e}"))?;
        Ok(unsupported)
    })();
    if result.is_err() {
        let _ = std::fs::remove_file(&temp);
    }
    result
}

pub async fn write_tags(pool: &SqlitePool, ids: &[String], keep_backup: bool) -> Result<WriteTagsResult, String> {
    let (candidates, _, skipped) = classify(pool, ids).await?;
    let mut result = WriteTagsResult { skipped, ..Default::default() };
    for c in candidates {
        let (path, format, edits) = (c.path.clone(), c.format.clone(), c.edits.clone());
        let outcome = tauri::async_runtime::spawn_blocking(move || write_one(&path, &format, &edits, keep_backup))
            .await
            .map_err(|e| e.to_string())?;
        let display = c.path.to_string_lossy().into_owned();
        let unsupported = match outcome {
            Ok(fields) => fields,
            Err(error) => {
                result.failed.push(WriteSkip { path: display, reason: error });
                continue;
            }
        };
        result.fields_unsupported += unsupported.len();
        result.written += 1;
        // The file changed: refresh size and forget the old content hash.
        let size = std::fs::metadata(&c.path).map(|m| m.len() as i64).unwrap_or(0);
        sqlx::query("UPDATE library_tracks SET size_bytes=?, content_hash=NULL, hash_size=NULL, hash_mtime=NULL WHERE id=?")
            .bind(size).bind(&c.id)
            .execute(pool).await.map_err(|e| e.to_string())?;
        // An edit stops being an override only once the app's own reader
        // sees it in the file.
        let reread = {
            let p = c.path.clone();
            tauri::async_runtime::spawn_blocking(move || metadata::read(&p)).await.map_err(|e| e.to_string())?
        };
        for (field, value) in &c.edits {
            let seen = reread.as_ref().map(|t| field.value_of(t) == *value).unwrap_or(false);
            if seen {
                sqlx::query("DELETE FROM library_track_overrides WHERE track_id=? AND field=?")
                    .bind(&c.id).bind(field.column())
                    .execute(pool).await.map_err(|e| e.to_string())?;
                result.edits_settled += 1;
            } else {
                result.edits_kept += 1;
            }
        }
    }
    Ok(result)
}

#[tauri::command]
#[specta::specta]
pub async fn library_write_tags_preview(app: tauri::AppHandle, ids: Vec<String>) -> Result<WriteTagsPreview, String> {
    preview(&pool(&app).await?, &ids).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_write_tags(app: tauri::AppHandle, ids: Vec<String>, keep_backup: bool) -> Result<WriteTagsResult, String> {
    write_tags(&pool(&app).await?, &ids, keep_backup).await
}
