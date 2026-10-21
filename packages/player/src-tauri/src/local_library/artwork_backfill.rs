//! Fills `artwork_key` for tracks that have none: rows imported before
//! artwork extraction existed, or whose picture was skipped while the cache
//! was full. Runs on demand, in bounded batches, and only ever sets a key that
//! is still NULL, so running it again is harmless.

use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use serde::Serialize;
use specta_typescript::Number;
use sqlx::SqlitePool;
use tauri::{Emitter, Manager};

use super::artwork::{self, Budget, Stored};
use super::{pool, LibraryState};

const PROGRESS_EVENT: &str = "library://artwork-backfill-progress";

/// Tracks read per blocking batch; each batch commits before the next starts.
pub const BATCH: i64 = 100;

/// One job at a time; `cancel` is checked before every file.
#[derive(Default)]
pub struct BackfillControl {
    pub cancel: AtomicBool,
    pub running: AtomicBool,
}

#[derive(Debug, Default, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ArtworkBackfillResult {
    #[specta(type = Number<usize>)]
    pub checked: usize,
    /// Tracks that now have artwork.
    #[specta(type = Number<usize>)]
    pub found: usize,
    /// Tracks whose picture was not stored because the cache is full.
    #[specta(type = Number<usize>)]
    pub cache_full: usize,
    pub cancelled: bool,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ArtworkBackfillProgress {
    #[specta(type = Number<usize>)]
    pub done: usize,
    #[specta(type = Number<usize>)]
    pub total: usize,
}

struct BatchOutcome {
    found: Vec<(String, String)>,
    checked: usize,
    cache_full: usize,
    cancelled: bool,
}

fn extract_batch(rows: Vec<(String, String)>, dir: &Path, budget: &Budget, control: &BackfillControl) -> BatchOutcome {
    let mut outcome = BatchOutcome { found: Vec::new(), checked: 0, cache_full: 0, cancelled: false };
    for (id, path) in rows {
        if control.cancel.load(Ordering::Relaxed) {
            outcome.cancelled = true;
            break;
        }
        match artwork::extract_into(Path::new(&path), dir, budget) {
            Stored::Key(key) => outcome.found.push((id, key)),
            Stored::CacheFull => outcome.cache_full += 1,
            Stored::Unsupported => {}
        }
        outcome.checked += 1;
    }
    outcome
}

/// Orphans are pruned first so their space counts toward the cap, then the
/// available tracks without a key are walked in id order.
pub async fn backfill(
    pool: &SqlitePool,
    dir: &Path,
    budget: &'static Budget,
    control: &Arc<BackfillControl>,
    on_progress: &(dyn Fn(ArtworkBackfillProgress) + Sync),
) -> Result<ArtworkBackfillResult, String> {
    artwork::prune(pool, dir, budget).await?;
    let total: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM library_tracks WHERE available = 1 AND artwork_key IS NULL")
            .fetch_one(pool)
            .await
            .map_err(|err| err.to_string())?;
    let mut total = total as usize;
    let mut result = ArtworkBackfillResult::default();
    on_progress(ArtworkBackfillProgress { done: 0, total });
    // Keyset paging: tracks without art stay NULL, so a plain LIMIT would
    // fetch them again forever.
    let mut after = String::new();
    loop {
        let rows: Vec<(String, String)> = sqlx::query_as(
            "SELECT id, path FROM library_tracks WHERE available = 1 AND artwork_key IS NULL AND id > ? ORDER BY id LIMIT ?",
        )
        .bind(&after)
        .bind(BATCH)
        .fetch_all(pool)
        .await
        .map_err(|err| err.to_string())?;
        let Some((last, _)) = rows.last() else {
            break;
        };
        after = last.clone();
        let (batch_dir, job) = (dir.to_path_buf(), Arc::clone(control));
        let outcome = tauri::async_runtime::spawn_blocking(move || extract_batch(rows, &batch_dir, budget, &job))
            .await
            .map_err(|err| err.to_string())?;
        let mut tx = pool.begin().await.map_err(|err| err.to_string())?;
        for (id, key) in &outcome.found {
            let updated = sqlx::query("UPDATE library_tracks SET artwork_key = ? WHERE id = ? AND artwork_key IS NULL")
                .bind(key)
                .bind(id)
                .execute(&mut *tx)
                .await
                .map_err(|err| err.to_string())?;
            result.found += updated.rows_affected() as usize;
        }
        tx.commit().await.map_err(|err| err.to_string())?;
        result.checked += outcome.checked;
        result.cache_full += outcome.cache_full;
        total = total.max(result.checked);
        on_progress(ArtworkBackfillProgress { done: result.checked, total });
        if outcome.cancelled {
            result.cancelled = true;
            break;
        }
    }
    Ok(result)
}

/// Looks for embedded artwork in tracks that have none yet.
#[tauri::command]
#[specta::specta]
pub async fn library_artwork_backfill(app: tauri::AppHandle) -> Result<ArtworkBackfillResult, String> {
    let pool = pool(&app).await?;
    let dir = artwork::init_cache_dir(&app)?;
    let control = Arc::clone(&app.state::<LibraryState>().artwork_backfill);
    if control.running.swap(true, Ordering::SeqCst) {
        return Err("Already looking for missing artwork".into());
    }
    control.cancel.store(false, Ordering::SeqCst);
    let emitter = app.clone();
    let result = backfill(&pool, dir, artwork::cache_budget(dir), &control, &move |progress| {
        let _ = emitter.emit(PROGRESS_EVENT, progress);
    })
    .await;
    control.running.store(false, Ordering::SeqCst);
    result
}

#[tauri::command]
#[specta::specta]
pub async fn library_artwork_backfill_cancel(app: tauri::AppHandle) -> Result<(), String> {
    app.state::<LibraryState>().artwork_backfill.cancel.store(true, Ordering::SeqCst);
    Ok(())
}
