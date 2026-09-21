//! Background audio analysis (desktop-pro-library.md Phase 5): decoding, the
//! stored results, corrections, and the one-at-a-time job that fills them.
//! The numbers come from `analysis_dsp`; see its header for accuracy limits.
//!
//! Three kinds of BPM/key values are kept apart (`0009_analysis.sql`): the
//! file's own tag, the computed estimate, and the user's correction. The one
//! used for filtering, sorting and smart playlists is copied onto the
//! `library_tracks` row (`bpm`, `musical_key`) with the precedence
//! user > tag > estimate, so those queries stay plain indexed SQL.

use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use specta_typescript::Number;
use sqlx::{Row, SqlitePool};
use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::errors::Error as SymphoniaError;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use tauri::{Emitter, Manager};

use super::analysis_dsp::{normalize_key, Analysis, Analyzer, ALGORITHM_VERSION};
use super::{pool, LibraryState};

const PROGRESS_EVENT: &str = "library://analysis-progress";
const CHUNK: usize = 500;

// ---------------------------------------------------------------- decode

/// Why a decode stopped early.
#[derive(Debug, PartialEq)]
pub enum Stop {
    Cancelled,
    Failed(String),
}

/// Decodes `path` once, feeding the analyzer. `hold` is polled between
/// packets: it may block (pause) and returns `true` to cancel.
pub fn analyze_file(path: &Path, expected_frames: u64, hold: &dyn Fn() -> bool) -> Result<Analysis, Stop> {
    let fail = |message: String| Stop::Failed(message);
    let file = std::fs::File::open(path).map_err(|e| fail(e.to_string()))?;
    let mut hint = Hint::new();
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        hint.with_extension(ext);
    }
    let stream = MediaSourceStream::new(Box::new(file), Default::default());
    let mut probed = symphonia::default::get_probe()
        .format(&hint, stream, &FormatOptions::default(), &MetadataOptions::default())
        .map_err(|e| fail(format!("Unsupported audio: {e}")))?;
    let track = probed.format.default_track().ok_or_else(|| fail("No audio track".into()))?;
    let (track_id, params) = (track.id, track.codec_params.clone());
    let mut decoder = symphonia::default::get_codecs()
        .make(&params, &DecoderOptions::default())
        .map_err(|e| fail(format!("Unsupported encoding: {e}")))?;
    let rate = params.sample_rate.ok_or_else(|| fail("Unknown sample rate".into()))?;
    let channels = params.channels.map(|c| c.count()).unwrap_or(2).max(1);
    let mut analyzer = Analyzer::new(rate, channels, params.n_frames.unwrap_or(expected_frames));
    let mut buffer: Option<SampleBuffer<f32>> = None;
    let mut decoded_any = false;
    loop {
        if hold() {
            return Err(Stop::Cancelled);
        }
        let packet = match probed.format.next_packet() {
            Ok(packet) => packet,
            Err(SymphoniaError::IoError(e)) if e.kind() == std::io::ErrorKind::UnexpectedEof => break,
            Err(SymphoniaError::ResetRequired) => break,
            Err(e) => return Err(fail(e.to_string())),
        };
        if packet.track_id() != track_id {
            continue;
        }
        match decoder.decode(&packet) {
            Ok(audio) => {
                let spec = *audio.spec();
                let capacity = audio.capacity() as u64;
                let buf = buffer.get_or_insert_with(|| SampleBuffer::<f32>::new(capacity, spec));
                if buf.capacity() < audio.frames() * spec.channels.count() {
                    *buf = SampleBuffer::<f32>::new(capacity, spec);
                }
                buf.copy_interleaved_ref(audio);
                if spec.channels.count() == channels {
                    analyzer.push(buf.samples());
                    decoded_any = true;
                }
            }
            // A corrupt packet is skipped, like a player would.
            Err(SymphoniaError::DecodeError(_)) => continue,
            Err(e) => return Err(fail(e.to_string())),
        }
    }
    if !decoded_any {
        return Err(fail("No decodable audio".into()));
    }
    Ok(analyzer.finish())
}

/// BPM/key written in the file's tags, if any.
pub fn read_tag_values(path: &Path) -> (Option<f64>, Option<String>) {
    use lofty::file::TaggedFileExt;
    use lofty::tag::ItemKey;
    let Some(tagged) = lofty::probe::Probe::open(path).ok().and_then(|p| p.read().ok()) else {
        return (None, None);
    };
    let Some(tag) = tagged.primary_tag().or_else(|| tagged.first_tag()) else {
        return (None, None);
    };
    let bpm = tag
        .get_string(&ItemKey::Bpm)
        .and_then(|v| v.trim().parse::<f64>().ok())
        .filter(|v| (30.0..=300.0).contains(v));
    let key = tag.get_string(&ItemKey::InitialKey).and_then(normalize_key);
    (bpm, key)
}

// ---------------------------------------------------------------- storage

fn stamp(path: &str) -> Option<(i64, i64)> {
    let meta = std::fs::metadata(path).ok()?;
    let mtime = meta.modified().ok()?.duration_since(std::time::UNIX_EPOCH).ok()?.as_secs() as i64;
    Some((meta.len() as i64, mtime))
}

/// Copies the winning BPM/key (user > tag > estimate) and the loudness onto
/// the track rows, so filters and sorts stay plain SQL.
pub async fn refresh_effective(pool: &SqlitePool, ids: &[String]) -> Result<(), String> {
    for chunk in ids.chunks(CHUNK) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!(
            "UPDATE library_tracks SET
               bpm = COALESCE((SELECT u.bpm FROM library_analysis_user u WHERE u.track_id = library_tracks.id),
                              (SELECT a.tag_bpm FROM library_analysis a WHERE a.track_id = library_tracks.id),
                              (SELECT a.bpm_estimate FROM library_analysis a WHERE a.track_id = library_tracks.id)),
               musical_key = COALESCE((SELECT u.key FROM library_analysis_user u WHERE u.track_id = library_tracks.id),
                              (SELECT a.tag_key FROM library_analysis a WHERE a.track_id = library_tracks.id),
                              (SELECT a.key_estimate FROM library_analysis a WHERE a.track_id = library_tracks.id)),
               loudness_lufs = (SELECT a.loudness_lufs FROM library_analysis a WHERE a.track_id = library_tracks.id),
               analyzed = EXISTS (SELECT 1 FROM library_analysis a WHERE a.track_id = library_tracks.id)
             WHERE id IN ({marks})"
        );
        let mut query = sqlx::query(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        query.execute(pool).await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

async fn store(pool: &SqlitePool, id: &str, size: i64, mtime: i64, tags: (Option<f64>, Option<String>), a: &Analysis) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO library_analysis (track_id, algo_version, file_size, file_mtime, peaks, loudness_lufs, true_peak_dbtp,
                                       tag_bpm, tag_key, bpm_estimate, bpm_confidence, key_estimate, key_confidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(track_id) DO UPDATE SET algo_version=excluded.algo_version, file_size=excluded.file_size,
           file_mtime=excluded.file_mtime, analyzed_at=CURRENT_TIMESTAMP, peaks=excluded.peaks,
           loudness_lufs=excluded.loudness_lufs, true_peak_dbtp=excluded.true_peak_dbtp, tag_bpm=excluded.tag_bpm,
           tag_key=excluded.tag_key, bpm_estimate=excluded.bpm_estimate, bpm_confidence=excluded.bpm_confidence,
           key_estimate=excluded.key_estimate, key_confidence=excluded.key_confidence",
    )
    .bind(id)
    .bind(ALGORITHM_VERSION)
    .bind(size)
    .bind(mtime)
    .bind(&a.peaks)
    .bind(a.loudness_lufs)
    .bind(a.true_peak_dbtp)
    .bind(tags.0)
    .bind(tags.1)
    .bind(a.bpm.as_ref().map(|b| b.value))
    .bind(a.bpm.as_ref().map(|b| b.confidence))
    .bind(a.key.as_ref().map(|k| k.value.clone()))
    .bind(a.key.as_ref().map(|k| k.confidence))
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    refresh_effective(pool, &[id.to_owned()]).await
}

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisResult {
    #[specta(type = Number<usize>)]
    pub analyzed: usize,
    /// Already analyzed by this algorithm version and unchanged since.
    #[specta(type = Number<usize>)]
    pub reused: usize,
    #[specta(type = Number<usize>)]
    pub failed: usize,
    pub cancelled: bool,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisProgress {
    #[specta(type = Number<usize>)]
    pub done: usize,
    #[specta(type = Number<usize>)]
    pub total: usize,
    pub current_title: Option<String>,
}

/// Cancel/pause flags shared between the job and the commands that steer it.
#[derive(Default)]
pub struct AnalysisControl {
    pub cancel: AtomicBool,
    pub pause: AtomicBool,
    pub running: AtomicBool,
}

impl AnalysisControl {
    /// Blocks while paused; `true` when the job should stop.
    pub fn hold(&self) -> bool {
        while self.pause.load(Ordering::Relaxed) && !self.cancel.load(Ordering::Relaxed) {
            std::thread::sleep(Duration::from_millis(50));
        }
        self.cancel.load(Ordering::Relaxed)
    }
}

/// Analyzes the available tracks in `ids` (all when empty) that have no
/// current result, one at a time. Results are saved per track, so a cancelled
/// or interrupted job resumes by running again: finished tracks are reused.
/// `force` re-analyzes even current results.
pub async fn analyze_tracks(
    pool: &SqlitePool,
    ids: &[String],
    force: bool,
    control: &Arc<AnalysisControl>,
    on_progress: &(dyn Fn(AnalysisProgress) + Sync),
) -> Result<AnalysisResult, String> {
    let mut rows = Vec::new();
    let base = "SELECT t.id, t.path, t.title, t.duration, t.sample_rate, a.algo_version, a.file_size, a.file_mtime
                FROM library_tracks t LEFT JOIN library_analysis a ON a.track_id = t.id WHERE t.available = 1";
    if ids.is_empty() {
        rows = sqlx::query(&format!("{base} ORDER BY t.path")).fetch_all(pool).await.map_err(|e| e.to_string())?;
    } else {
        for chunk in ids.chunks(CHUNK) {
            let marks = vec!["?"; chunk.len()].join(",");
            let sql = format!("{base} AND t.id IN ({marks})");
            let mut query = sqlx::query(&sql);
            for id in chunk {
                query = query.bind(id);
            }
            rows.extend(query.fetch_all(pool).await.map_err(|e| e.to_string())?);
        }
        // Keep the caller's order (album order, queue order).
        let position: std::collections::HashMap<&str, usize> = ids.iter().enumerate().map(|(i, id)| (id.as_str(), i)).collect();
        rows.sort_by_key(|r| position.get(r.get::<String, _>(0).as_str()).copied().unwrap_or(usize::MAX));
    }
    let total = rows.len();
    let mut result = AnalysisResult::default();
    for (index, row) in rows.into_iter().enumerate() {
        if control.hold() {
            result.cancelled = true;
            break;
        }
        let id: String = row.get(0);
        let path: String = row.get(1);
        let title: String = row.get(2);
        let duration: f64 = row.get(3);
        let rate: i64 = row.get(4);
        let (version, size, mtime): (Option<i64>, Option<i64>, Option<i64>) = (row.get(5), row.get(6), row.get(7));
        let current = stamp(&path);
        if !force && version == Some(ALGORITHM_VERSION) && current.is_some() && current == size.zip(mtime) {
            result.reused += 1;
            on_progress(AnalysisProgress { done: index + 1, total, current_title: None });
            continue;
        }
        on_progress(AnalysisProgress { done: index, total, current_title: Some(title) });
        let Some((size, mtime)) = current else {
            result.failed += 1;
            continue;
        };
        let expected = (duration * rate as f64) as u64;
        let (file, flags) = (path.clone(), Arc::clone(control));
        let (analysis, tags) = tauri::async_runtime::spawn_blocking(move || {
            let analysis = analyze_file(Path::new(&file), expected, &|| flags.hold());
            let tags = read_tag_values(Path::new(&file));
            (analysis, tags)
        })
        .await
        .map_err(|e| e.to_string())?;
        match analysis {
            Ok(analysis) => {
                store(pool, &id, size, mtime, tags, &analysis).await?;
                result.analyzed += 1;
            }
            Err(Stop::Cancelled) => {
                result.cancelled = true;
                break;
            }
            Err(Stop::Failed(_)) => result.failed += 1,
        }
        on_progress(AnalysisProgress { done: index + 1, total, current_title: None });
    }
    Ok(result)
}

// ---------------------------------------------------------------- details & corrections

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisDetail {
    pub analyzed: bool,
    /// Analysis was made by an older algorithm or the file changed since.
    pub stale: bool,
    /// `PEAK_BUCKETS` values 0-255 (empty until analyzed).
    pub peaks: Vec<u8>,
    pub loudness_lufs: Option<f64>,
    pub true_peak_dbtp: Option<f64>,
    pub tag_bpm: Option<f64>,
    pub tag_key: Option<String>,
    pub bpm_estimate: Option<f64>,
    pub bpm_confidence: Option<f64>,
    pub key_estimate: Option<String>,
    pub key_confidence: Option<f64>,
    pub user_bpm: Option<f64>,
    pub user_key: Option<String>,
    /// What filters and sorting use: user > tag > estimate.
    pub bpm: Option<f64>,
    pub key: Option<String>,
    pub analyzed_at: Option<String>,
}

pub async fn detail(pool: &SqlitePool, id: &str) -> Result<AnalysisDetail, String> {
    let track = sqlx::query("SELECT path, bpm, musical_key FROM library_tracks WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Track not found")?;
    let path: String = track.get(0);
    let user = sqlx::query("SELECT bpm, key FROM library_analysis_user WHERE track_id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;
    let (user_bpm, user_key) = user.map(|r| (r.get::<Option<f64>, _>(0), r.get::<Option<String>, _>(1))).unwrap_or((None, None));
    let base = AnalysisDetail {
        analyzed: false,
        stale: false,
        peaks: Vec::new(),
        loudness_lufs: None,
        true_peak_dbtp: None,
        tag_bpm: None,
        tag_key: None,
        bpm_estimate: None,
        bpm_confidence: None,
        key_estimate: None,
        key_confidence: None,
        user_bpm,
        user_key,
        bpm: track.get(1),
        key: track.get(2),
        analyzed_at: None,
    };
    let Some(row) = sqlx::query(
        "SELECT algo_version, file_size, file_mtime, peaks, loudness_lufs, true_peak_dbtp, tag_bpm, tag_key,
                bpm_estimate, bpm_confidence, key_estimate, key_confidence, analyzed_at
         FROM library_analysis WHERE track_id = ?",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?
    else {
        return Ok(base);
    };
    let (version, size, mtime): (i64, i64, i64) = (row.get(0), row.get(1), row.get(2));
    Ok(AnalysisDetail {
        analyzed: true,
        stale: version != ALGORITHM_VERSION || stamp(&path) != Some((size, mtime)),
        peaks: row.get(3),
        loudness_lufs: row.get(4),
        true_peak_dbtp: row.get(5),
        tag_bpm: row.get(6),
        tag_key: row.get(7),
        bpm_estimate: row.get(8),
        bpm_confidence: row.get(9),
        key_estimate: row.get(10),
        key_confidence: row.get(11),
        analyzed_at: row.get(12),
        ..base
    })
}

/// What one track's correction looked like, for undo.
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CorrectionSnapshot {
    pub id: String,
    pub bpm: Option<f64>,
    pub key: Option<String>,
}

/// Sets (or, with `None`, clears) the user's BPM and/or key for every id.
/// `bpm`/`key` of `None` leave that value alone; an empty key clears it and a
/// non-positive BPM clears it. Returns the previous corrections for undo.
pub async fn set_corrections(
    pool: &SqlitePool,
    ids: &[String],
    bpm: Option<f64>,
    key: Option<&str>,
) -> Result<Vec<CorrectionSnapshot>, String> {
    let bpm = match bpm {
        Some(v) if v > 0.0 => {
            if !(30.0..=300.0).contains(&v) {
                return Err("BPM must be between 30 and 300".into());
            }
            Some(Some((v * 10.0).round() / 10.0))
        }
        Some(_) => Some(None),
        None => None,
    };
    let key = match key {
        Some(text) if text.trim().is_empty() => Some(None),
        Some(text) => Some(Some(normalize_key(text).ok_or_else(|| format!("Not a musical key: {text}"))?)),
        None => None,
    };
    let previous = corrections(pool, ids).await?;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    for snapshot in &previous {
        let next = CorrectionSnapshot {
            id: snapshot.id.clone(),
            bpm: bpm.unwrap_or(snapshot.bpm),
            key: key.clone().unwrap_or_else(|| snapshot.key.clone()),
        };
        write_correction(&mut tx, &next).await?;
    }
    tx.commit().await.map_err(|e| e.to_string())?;
    refresh_effective(pool, ids).await?;
    Ok(previous)
}

pub async fn restore_corrections(pool: &SqlitePool, snapshots: &[CorrectionSnapshot]) -> Result<usize, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    for snapshot in snapshots {
        write_correction(&mut tx, snapshot).await?;
    }
    tx.commit().await.map_err(|e| e.to_string())?;
    let ids: Vec<String> = snapshots.iter().map(|s| s.id.clone()).collect();
    refresh_effective(pool, &ids).await?;
    Ok(snapshots.len())
}

async fn write_correction(tx: &mut sqlx::SqliteConnection, s: &CorrectionSnapshot) -> Result<(), String> {
    if s.bpm.is_none() && s.key.is_none() {
        sqlx::query("DELETE FROM library_analysis_user WHERE track_id = ?").bind(&s.id).execute(&mut *tx).await
    } else {
        sqlx::query(
            "INSERT INTO library_analysis_user (track_id, bpm, key) VALUES (?, ?, ?)
             ON CONFLICT(track_id) DO UPDATE SET bpm = excluded.bpm, key = excluded.key, updated_at = CURRENT_TIMESTAMP",
        )
        .bind(&s.id)
        .bind(s.bpm)
        .bind(&s.key)
        .execute(&mut *tx)
        .await
    }
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn corrections(pool: &SqlitePool, ids: &[String]) -> Result<Vec<CorrectionSnapshot>, String> {
    let mut out = Vec::new();
    for chunk in ids.chunks(CHUNK) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!(
            "SELECT t.id, u.bpm, u.key FROM library_tracks t LEFT JOIN library_analysis_user u ON u.track_id = t.id WHERE t.id IN ({marks})"
        );
        let mut query = sqlx::query(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        for row in query.fetch_all(pool).await.map_err(|e| e.to_string())? {
            out.push(CorrectionSnapshot { id: row.get(0), bpm: row.get(1), key: row.get(2) });
        }
    }
    Ok(out)
}

/// Drops stored results (the file's tags and the user's corrections stay
/// where they are; corrections are not analysis).
pub async fn clear_analysis(pool: &SqlitePool, ids: &[String]) -> Result<(), String> {
    for chunk in ids.chunks(CHUNK) {
        let marks = vec!["?"; chunk.len()].join(",");
        let sql = format!("DELETE FROM library_analysis WHERE track_id IN ({marks})");
        let mut query = sqlx::query(&sql);
        for id in chunk {
            query = query.bind(id);
        }
        query.execute(pool).await.map_err(|e| e.to_string())?;
    }
    refresh_effective(pool, ids).await
}

#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisSummary {
    #[specta(type = Number<i64>)]
    pub analyzed: i64,
    #[specta(type = Number<i64>)]
    pub total: i64,
    pub running: bool,
    pub paused: bool,
}

// ---------------------------------------------------------------- commands

#[tauri::command]
#[specta::specta]
pub async fn library_analyze_tracks(app: tauri::AppHandle, ids: Vec<String>, force: bool) -> Result<AnalysisResult, String> {
    let pool = pool(&app).await?;
    let control = Arc::clone(&app.state::<LibraryState>().analysis);
    if control.running.swap(true, Ordering::SeqCst) {
        return Err("Analysis is already running".into());
    }
    control.cancel.store(false, Ordering::SeqCst);
    control.pause.store(false, Ordering::SeqCst);
    let emitter = app.clone();
    let result = analyze_tracks(&pool, &ids, force, &control, &move |p| {
        let _ = emitter.emit(PROGRESS_EVENT, p);
    })
    .await;
    control.running.store(false, Ordering::SeqCst);
    control.pause.store(false, Ordering::SeqCst);
    result
}

#[tauri::command]
#[specta::specta]
pub async fn library_analysis_cancel(app: tauri::AppHandle) -> Result<(), String> {
    app.state::<LibraryState>().analysis.cancel.store(true, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn library_analysis_pause(app: tauri::AppHandle, paused: bool) -> Result<(), String> {
    app.state::<LibraryState>().analysis.pause.store(paused, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn library_analysis_summary(app: tauri::AppHandle) -> Result<AnalysisSummary, String> {
    let pool = pool(&app).await?;
    let control = &app.state::<LibraryState>().analysis;
    let (analyzed, total): (i64, i64) =
        sqlx::query_as("SELECT COALESCE(SUM(analyzed), 0), COUNT(*) FROM library_tracks WHERE available = 1")
            .fetch_one(&pool)
            .await
            .map_err(|e| e.to_string())?;
    Ok(AnalysisSummary {
        analyzed,
        total,
        running: control.running.load(Ordering::SeqCst),
        paused: control.pause.load(Ordering::SeqCst),
    })
}

#[tauri::command]
#[specta::specta]
pub async fn library_analysis_detail(app: tauri::AppHandle, id: String) -> Result<AnalysisDetail, String> {
    detail(&pool(&app).await?, &id).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_set_corrections(
    app: tauri::AppHandle,
    ids: Vec<String>,
    bpm: Option<f64>,
    key: Option<String>,
) -> Result<Vec<CorrectionSnapshot>, String> {
    set_corrections(&pool(&app).await?, &ids, bpm, key.as_deref()).await
}

#[tauri::command]
#[specta::specta]
pub async fn library_restore_corrections(app: tauri::AppHandle, snapshots: Vec<CorrectionSnapshot>) -> Result<u32, String> {
    Ok(restore_corrections(&pool(&app).await?, &snapshots).await? as u32)
}

#[tauri::command]
#[specta::specta]
pub async fn library_clear_analysis(app: tauri::AppHandle, ids: Vec<String>) -> Result<(), String> {
    clear_analysis(&pool(&app).await?, &ids).await
}
