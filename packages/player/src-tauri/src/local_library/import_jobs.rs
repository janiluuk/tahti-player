//! Persisted import jobs, so an import interrupted by quitting the app or by
//! cancelling continues later from the files it had not reached (see
//! migration `0016_import_jobs.sql`).

use std::collections::HashSet;

use super::*;

pub(super) const PATH_PENDING: i64 = 0;
pub(super) const PATH_IMPORTED: i64 = 1;
pub(super) const PATH_FAILED: i64 = 2;

/// Unfinished imports waiting to be resumed.
#[derive(Debug, Clone, Serialize, specta::Type, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PendingImport {
    /// Files not yet reached.
    #[specta(type = Number<usize>)]
    pub files: usize,
    #[specta(type = Number<usize>)]
    pub jobs: usize,
}

/// One job's remaining work.
pub(super) struct JobRun {
    pub job_id: Option<String>,
    pub root_id: Option<String>,
    pub paths: Vec<PathBuf>,
}

fn path_key(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

/// Records a new job for `paths`. An unfinished job with the same non-empty
/// `source` and root (the same folder imported again) is replaced by it, and
/// files that job already imported are left out, so importing an interrupted
/// folder again only reads what it had not reached plus files it failed on.
/// Returns the job id and the paths still to import.
pub(super) async fn start_job(
    pool: &SqlitePool,
    source: &str,
    root_id: Option<&str>,
    paths: Vec<PathBuf>,
) -> Result<(String, Vec<PathBuf>), String> {
    let mut tx = pool.begin().await.map_err(|err| err.to_string())?;
    let mut finished = HashSet::new();
    if !source.is_empty() {
        let previous = sqlx::query_scalar::<_, String>(
            "SELECT id FROM library_import_jobs WHERE source = ? AND root_id IS ?",
        )
        .bind(source)
        .bind(root_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;
        for id in previous {
            finished.extend(
                sqlx::query_scalar::<_, String>(
                    "SELECT path FROM library_import_job_paths WHERE job_id = ? AND done = ?",
                )
                .bind(&id)
                .bind(PATH_IMPORTED)
                .fetch_all(&mut *tx)
                .await
                .map_err(|err| err.to_string())?,
            );
            sqlx::query("DELETE FROM library_import_jobs WHERE id = ?")
                .bind(&id)
                .execute(&mut *tx)
                .await
                .map_err(|err| err.to_string())?;
        }
    }
    let remaining: Vec<PathBuf> = paths
        .into_iter()
        .filter(|path| !finished.contains(&path_key(path)))
        .collect();
    let id = uuid::Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO library_import_jobs (id, source, root_id) VALUES (?, ?, ?)")
        .bind(&id)
        .bind(source)
        .bind(root_id)
        .execute(&mut *tx)
        .await
        .map_err(|err| err.to_string())?;
    for path in &remaining {
        sqlx::query("INSERT OR IGNORE INTO library_import_job_paths (job_id, path) VALUES (?, ?)")
            .bind(&id)
            .bind(path_key(path))
            .execute(&mut *tx)
            .await
            .map_err(|err| err.to_string())?;
    }
    tx.commit().await.map_err(|err| err.to_string())?;
    Ok((id, remaining))
}

/// Marks `paths` of `job_id` with `state` inside the caller's transaction.
pub(super) async fn mark_paths(
    conn: &mut sqlx::SqliteConnection,
    job_id: &str,
    paths: &[(String, i64)],
) -> Result<(), sqlx::Error> {
    for (path, state) in paths {
        sqlx::query("UPDATE library_import_job_paths SET done = ? WHERE job_id = ? AND path = ?")
            .bind(state)
            .bind(job_id)
            .bind(path)
            .execute(&mut *conn)
            .await?;
    }
    Ok(())
}

/// Deletes a job that has nothing pending left. A job with pending paths
/// (interrupted, or a batch that could not be saved) is kept for resuming.
pub(super) async fn finish_job(pool: &SqlitePool, job_id: &str) -> Result<(), String> {
    sqlx::query(
        "DELETE FROM library_import_jobs WHERE id = ? AND NOT EXISTS \
         (SELECT 1 FROM library_import_job_paths WHERE job_id = ? AND done = ?)",
    )
    .bind(job_id)
    .bind(job_id)
    .bind(PATH_PENDING)
    .execute(pool)
    .await
    .map_err(|err| err.to_string())?;
    Ok(())
}

pub async fn pending_imports(pool: &SqlitePool) -> Result<Option<PendingImport>, String> {
    let (jobs, files) = sqlx::query_as::<_, (i64, i64)>(
        "SELECT COUNT(DISTINCT job_id), COUNT(*) FROM library_import_job_paths WHERE done = ?",
    )
    .bind(PATH_PENDING)
    .fetch_one(pool)
    .await
    .map_err(|err| err.to_string())?;
    Ok((files > 0).then_some(PendingImport {
        files: files as usize,
        jobs: jobs as usize,
    }))
}

/// Every unfinished job's pending paths, oldest job first. Jobs with nothing
/// pending are deleted on the way.
pub(super) async fn pending_runs(pool: &SqlitePool) -> Result<Vec<JobRun>, String> {
    let jobs = sqlx::query_as::<_, (String, Option<String>)>(
        "SELECT id, root_id FROM library_import_jobs ORDER BY created_at, rowid",
    )
    .fetch_all(pool)
    .await
    .map_err(|err| err.to_string())?;
    let mut runs = Vec::new();
    for (id, root_id) in jobs {
        let paths = sqlx::query_scalar::<_, String>(
            "SELECT path FROM library_import_job_paths WHERE job_id = ? AND done = ? ORDER BY path",
        )
        .bind(&id)
        .bind(PATH_PENDING)
        .fetch_all(pool)
        .await
        .map_err(|err| err.to_string())?;
        if paths.is_empty() {
            finish_job(pool, &id).await?;
            continue;
        }
        runs.push(JobRun {
            job_id: Some(id),
            root_id,
            paths: paths.into_iter().map(PathBuf::from).collect(),
        });
    }
    Ok(runs)
}

pub async fn discard_pending_imports(pool: &SqlitePool) -> Result<(), String> {
    sqlx::query("DELETE FROM library_import_jobs")
        .execute(pool)
        .await
        .map_err(|err| err.to_string())?;
    Ok(())
}

/// Runs jobs batch by batch. `is_cancelled` is checked before each batch and
/// `on_progress` gets one event per batch plus a final one with no current
/// path. Finished jobs are deleted; interrupted ones stay for resuming.
pub(super) async fn run_jobs(
    pool: &SqlitePool,
    runs: Vec<JobRun>,
    skipped: usize,
    is_cancelled: impl Fn() -> bool,
    mut on_progress: impl FnMut(ImportProgress),
) -> ImportResult {
    let total: usize = runs.iter().map(|run| run.paths.len()).sum();
    let mut result = ImportResult {
        skipped,
        ..Default::default()
    };
    let mut done = 0usize;
    'jobs: for run in runs {
        for batch in run.paths.chunks(IMPORT_BATCH) {
            if is_cancelled() {
                result.cancelled = true;
                break 'jobs;
            }
            on_progress(ImportProgress {
                done,
                total,
                imported: result.imported,
                failed: result.errors.len(),
                skipped: result.skipped,
                current_path: batch.first().map(|path| path_key(path)),
            });
            import_batch_in_job(
                pool,
                batch.to_vec(),
                run.root_id.as_deref(),
                run.job_id.as_deref(),
                &mut result,
            )
            .await;
            done += batch.len();
        }
        if let Some(job_id) = &run.job_id {
            if let Err(error) = finish_job(pool, job_id).await {
                log::warn!("Could not close import job {job_id}: {error}");
            }
        }
    }
    on_progress(ImportProgress {
        done: total,
        total,
        imported: result.imported,
        failed: result.errors.len(),
        skipped: result.skipped,
        current_path: None,
    });
    result
}

/// How many unfinished imports are waiting (files and jobs), or `None`.
#[tauri::command]
#[specta::specta]
pub async fn library_import_pending(app: tauri::AppHandle) -> Result<Option<PendingImport>, String> {
    pending_imports(&pool(&app).await?).await
}

/// Continues every unfinished import with the files it had not reached, with
/// the usual progress events and cancellation.
#[tauri::command]
#[specta::specta]
pub async fn library_import_resume(app: tauri::AppHandle) -> Result<ImportResult, String> {
    reset_cancel_import(&app);
    let pool = pool(&app).await?;
    let runs = pending_runs(&pool).await?;
    Ok(run_jobs_with_app(&app, &pool, runs, 0).await)
}

/// Forgets unfinished imports. Tracks they already imported stay.
#[tauri::command]
#[specta::specta]
pub async fn library_import_discard(app: tauri::AppHandle) -> Result<(), String> {
    discard_pending_imports(&pool(&app).await?).await
}
