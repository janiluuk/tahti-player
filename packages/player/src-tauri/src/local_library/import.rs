//! Import pipeline: walking folders for audio files, batched extraction and
//! insertion with progress and cancellation, plus the import commands.

use super::*;

/// Event emitted during `library_import`/`library_import_folder`/
/// `library_import_paths` so the frontend can render a live progress bar
/// instead of blocking behind a single opaque "Working..." state.
pub(super) const IMPORT_PROGRESS_EVENT: &str = "library://import-progress";

#[derive(Clone, Debug, Serialize, specta::Type)]
pub struct ImportFailure {
    pub path: String,
    pub error: String,
}

#[derive(Serialize, specta::Type, Default)]
pub struct ImportResult {
    #[specta(type = Number<usize>)]
    pub imported: usize,
    /// Files walked (folder import / drag-drop) that were neither imported
    /// nor errored -- unsupported extensions, silently ignored before this
    /// counter existed.
    #[specta(type = Number<usize>)]
    pub skipped: usize,
    pub errors: Vec<ImportFailure>,
    /// True when `library_import_cancel` interrupted the loop before every
    /// path was processed. Paths not yet reached are neither imported,
    /// skipped nor counted as errors.
    pub cancelled: bool,
}

/// Progress event payload for `IMPORT_PROGRESS_EVENT`. `current_path` is
/// `None` on the final (100%) event.
#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ImportProgress {
    #[specta(type = Number<usize>)]
    pub done: usize,
    #[specta(type = Number<usize>)]
    pub total: usize,
    #[specta(type = Number<usize>)]
    pub imported: usize,
    #[specta(type = Number<usize>)]
    pub failed: usize,
    #[specta(type = Number<usize>)]
    pub skipped: usize,
    pub current_path: Option<String>,
}

pub(crate) fn is_supported_audio_file(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|value| value.to_str())
            .map(str::to_ascii_lowercase)
            .as_deref(),
        Some("flac") | Some("wav")
    )
}

/// Recursively walks `root`, returning supported audio files (stable path
/// order, symlinks not followed) plus a count of files seen but skipped
/// (present but unsupported extension).
pub(super) fn collect_audio_paths_with_skipped(root: &Path) -> Result<(Vec<PathBuf>, usize), String> {
    if !root.is_dir() {
        return Err("Selected path is not a folder".into());
    }
    let mut paths = Vec::new();
    let mut skipped = 0usize;
    let mut pending = vec![root.to_path_buf()];
    while let Some(directory) = pending.pop() {
        for entry in std::fs::read_dir(&directory).map_err(|err| err.to_string())? {
            let entry = entry.map_err(|err| err.to_string())?;
            let path = entry.path();
            let file_type = entry.file_type().map_err(|err| err.to_string())?;
            if file_type.is_dir() {
                pending.push(path);
            } else if file_type.is_file() {
                if is_supported_audio_file(&path) {
                    paths.push(path);
                } else {
                    skipped += 1;
                }
            }
        }
    }
    paths.sort();
    Ok((paths, skipped))
}

#[cfg(test)]
pub(super) fn collect_audio_paths(root: &Path) -> Result<Vec<PathBuf>, String> {
    collect_audio_paths_with_skipped(root).map(|(paths, _skipped)| paths)
}

/// Files read + written per batch. Tag extraction runs concurrently across a
/// batch (each on the blocking pool) and the whole batch commits in one
/// transaction: one WAL commit per 16 files instead of one per file, which is
/// what makes a several-thousand-file import fast. Also the granularity of
/// progress events and cancellation.
pub(super) const IMPORT_BATCH: usize = 16;

pub(super) async fn insert_track(
    conn: &mut sqlx::SqliteConnection,
    track: &LibraryTrack,
    root_id: Option<&str>,
) -> Result<(), sqlx::Error> {
    // A successful (re)import proves the file exists right now -- clear
    // any stale missing state a prior resolve/re-scan had persisted,
    // same self-heal `resolve_path` does on a direct resolve. Re-importing
    // an ad hoc track under a root adopts it into that root; an existing
    // root membership is never stolen.
    sqlx::query("INSERT INTO library_tracks (id,path,title,artist,album,format,duration,sample_rate,channels,bits_per_sample,size_bytes,root_id,album_artist,track_no,disc_no,year,genre,comment,bitrate_kbps,folder) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(path) DO UPDATE SET title=excluded.title, artist=excluded.artist, album=excluded.album, album_artist=excluded.album_artist, track_no=excluded.track_no, disc_no=excluded.disc_no, year=excluded.year, genre=excluded.genre, comment=excluded.comment, bitrate_kbps=excluded.bitrate_kbps, folder=excluded.folder, format=excluded.format, duration=excluded.duration, sample_rate=excluded.sample_rate, channels=excluded.channels, bits_per_sample=excluded.bits_per_sample, size_bytes=excluded.size_bytes, available=1, unavailable_since=NULL, root_id=COALESCE(library_tracks.root_id, excluded.root_id)")
        .bind(&track.id).bind(&track.path).bind(&track.title).bind(&track.artist).bind(&track.album).bind(&track.format).bind(track.duration).bind(track.sample_rate).bind(track.channels).bind(track.bits_per_sample).bind(track.size_bytes).bind(root_id)
        .bind(&track.album_artist).bind(track.track_no).bind(track.disc_no).bind(track.year).bind(&track.genre).bind(&track.comment).bind(track.bitrate_kbps).bind(folder_of(&track.path))
        .execute(&mut *conn).await?;
    catalog::reapply_overrides(conn, track).await?;
    Ok(())
}

pub(crate) async fn import_batch(
    pool: &SqlitePool,
    paths: Vec<PathBuf>,
    root_id: Option<&str>,
    result: &mut ImportResult,
) {
    let reads = futures::future::join_all(paths.into_iter().map(|path| async move {
        let display = path.to_string_lossy().into_owned();
        tauri::async_runtime::spawn_blocking(move || metadata::read(&path))
            .await
            .map_err(|err| err.to_string())
            .and_then(|track| track)
            .map_err(|error| ImportFailure {
                path: display,
                error,
            })
    }))
    .await;
    let mut tracks = Vec::with_capacity(reads.len());
    for read in reads {
        match read {
            Ok(track) => tracks.push(track),
            Err(failure) => result.errors.push(failure),
        }
    }
    if tracks.is_empty() {
        return;
    }
    let mut tx = match pool.begin().await {
        Ok(tx) => tx,
        Err(error) => {
            for track in tracks {
                result.errors.push(ImportFailure {
                    path: track.path,
                    error: error.to_string(),
                });
            }
            return;
        }
    };
    let mut written = 0usize;
    for track in &tracks {
        match insert_track(&mut tx, track, root_id).await {
            Ok(()) => written += 1,
            Err(error) => result.errors.push(ImportFailure {
                path: track.path.clone(),
                error: error.to_string(),
            }),
        }
    }
    match tx.commit().await {
        Ok(()) => result.imported += written,
        Err(error) => result.errors.push(ImportFailure {
            path: tracks.first().map(|t| t.path.clone()).unwrap_or_default(),
            error: format!("Could not save {written} tracks: {error}"),
        }),
    }
}

pub async fn import_paths(pool: &SqlitePool, paths: Vec<PathBuf>) -> ImportResult {
    let mut result = ImportResult::default();
    for batch in paths.chunks(IMPORT_BATCH) {
        import_batch(pool, batch.to_vec(), None, &mut result).await;
    }
    result
}

/// Same import as `import_paths`, plus a `skipped` starting count (files
/// already excluded during folder walking), an optional root to tag/adopt
/// tracks into and, for the Tauri command-driven paths, a live
/// `IMPORT_PROGRESS_EVENT` per batch and cooperative cancellation via
/// `LibraryState::cancel_import` (checked between batches).
pub(super) async fn import_paths_with_progress(
    app: &tauri::AppHandle,
    pool: &SqlitePool,
    paths: Vec<PathBuf>,
    skipped: usize,
    root_id: Option<&str>,
) -> ImportResult {
    let total = paths.len();
    let mut result = ImportResult {
        skipped,
        ..Default::default()
    };
    let mut done = 0usize;
    for batch in paths.chunks(IMPORT_BATCH) {
        if app
            .state::<LibraryState>()
            .cancel_import
            .load(Ordering::Relaxed)
        {
            result.cancelled = true;
            break;
        }
        let _ = app.emit(
            IMPORT_PROGRESS_EVENT,
            ImportProgress {
                done,
                total,
                imported: result.imported,
                failed: result.errors.len(),
                skipped: result.skipped,
                current_path: batch
                    .first()
                    .map(|path| path.to_string_lossy().into_owned()),
            },
        );
        import_batch(pool, batch.to_vec(), root_id, &mut result).await;
        done += batch.len();
    }
    let _ = app.emit(
        IMPORT_PROGRESS_EVENT,
        ImportProgress {
            done: total,
            total,
            imported: result.imported,
            failed: result.errors.len(),
            skipped: result.skipped,
            current_path: None,
        },
    );
    result
}

pub(super) fn reset_cancel_import(app: &tauri::AppHandle) {
    app.state::<LibraryState>()
        .cancel_import
        .store(false, Ordering::Relaxed);
}

#[tauri::command]
#[specta::specta]
pub async fn library_import(app: tauri::AppHandle) -> Result<ImportResult, String> {
    let dialog_app = app.clone();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        dialog_app
            .dialog()
            .file()
            .add_filter("FLAC and WAV audio", &["flac", "wav"])
            .blocking_pick_files()
    })
    .await
    .map_err(|err| err.to_string())?;
    let Some(files) = selected else {
        return Ok(ImportResult::default());
    };
    let paths = files
        .into_iter()
        .map(|file| file.into_path().map_err(|err| err.to_string()))
        .collect::<Result<Vec<_>, _>>()?;
    reset_cancel_import(&app);
    let pool = pool(&app).await?;
    Ok(import_paths_with_progress(&app, &pool, paths, 0, None).await)
}

#[tauri::command]
#[specta::specta]
pub async fn library_import_folder(app: tauri::AppHandle) -> Result<ImportResult, String> {
    let dialog_app = app.clone();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        dialog_app.dialog().file().blocking_pick_folder()
    })
    .await
    .map_err(|err| err.to_string())?;
    let Some(folder) = selected else {
        return Ok(ImportResult::default());
    };
    let root = folder.into_path().map_err(|err| err.to_string())?;
    let (paths, skipped) =
        tauri::async_runtime::spawn_blocking(move || collect_audio_paths_with_skipped(&root))
            .await
            .map_err(|err| err.to_string())??;
    reset_cancel_import(&app);
    let pool = pool(&app).await?;
    Ok(import_paths_with_progress(&app, &pool, paths, skipped, None).await)
}

/// Imports an explicit list of files/folders -- the entry point for native
/// drag-drop, which hands over absolute paths directly rather than going
/// through a picker dialog. Directories are walked the same way folder
/// import does; unsupported files are counted as skipped, not errored.
#[tauri::command]
#[specta::specta]
pub async fn library_import_paths(
    app: tauri::AppHandle,
    paths: Vec<String>,
) -> Result<ImportResult, String> {
    reset_cancel_import(&app);
    let mut collected = Vec::new();
    let mut skipped = 0usize;
    let mut result = ImportResult::default();
    for raw in paths {
        let path = PathBuf::from(&raw);
        match tokio::fs::metadata(&path).await {
            Ok(meta) if meta.is_dir() => {
                let dir = path.clone();
                match tauri::async_runtime::spawn_blocking(move || {
                    collect_audio_paths_with_skipped(&dir)
                })
                .await
                .map_err(|err| err.to_string())
                {
                    Ok(Ok((mut found, found_skipped))) => {
                        collected.append(&mut found);
                        skipped += found_skipped;
                    }
                    Ok(Err(error)) | Err(error) => result.errors.push(ImportFailure {
                        path: raw,
                        error,
                    }),
                }
            }
            Ok(meta) if meta.is_file() => {
                if is_supported_audio_file(&path) {
                    collected.push(path);
                } else {
                    skipped += 1;
                }
            }
            _ => result.errors.push(ImportFailure {
                path: raw,
                error: "Path not found".into(),
            }),
        }
    }
    collected.sort();
    let pool = pool(&app).await?;
    let imported = import_paths_with_progress(&app, &pool, collected, skipped, None).await;
    result.imported += imported.imported;
    result.skipped += imported.skipped;
    result.errors.extend(imported.errors);
    result.cancelled = imported.cancelled;
    Ok(result)
}

/// Interrupts the in-flight import loop before its next file. Checked
/// cooperatively, so a file already being read/inserted still completes.
#[tauri::command]
#[specta::specta]
pub async fn library_import_cancel(app: tauri::AppHandle) -> Result<(), String> {
    app.state::<LibraryState>()
        .cancel_import
        .store(true, Ordering::Relaxed);
    Ok(())
}
