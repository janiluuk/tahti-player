use std::cell::Cell;
use std::path::{Path, PathBuf};

use sqlx::SqlitePool;

use super::import_jobs::{
    discard_pending_imports, pending_imports, pending_runs, run_jobs, start_job, JobRun,
    PendingImport,
};
use super::test_support::{pool, write_wav};
use super::{add_root, import_paths, list, remove_root, ImportResult, IMPORT_BATCH};

fn wavs(dir: &Path, count: usize) -> Vec<PathBuf> {
    (0..count)
        .map(|i| {
            let path = dir.join(format!("{i:02}.wav"));
            write_wav(&path, &format!("Track {i:02}"), "Artist");
            path.canonicalize().unwrap()
        })
        .collect()
}

async fn run(pool: &SqlitePool, runs: Vec<JobRun>, cancel_after_batches: Option<usize>) -> ImportResult {
    let batches = Cell::new(0usize);
    run_jobs(
        pool,
        runs,
        0,
        || {
            let seen = batches.get();
            batches.set(seen + 1);
            cancel_after_batches.is_some_and(|limit| seen >= limit)
        },
        |_| {},
    )
    .await
}

async fn job(pool: &SqlitePool, source: &str, paths: Vec<PathBuf>) -> Vec<JobRun> {
    let (job_id, paths) = start_job(pool, source, None, paths).await.unwrap();
    vec![JobRun {
        job_id: Some(job_id),
        root_id: None,
        paths,
    }]
}

async fn total(pool: &SqlitePool) -> i64 {
    list(pool, "", 0).await.unwrap().total
}

/// `fLaC` plus a valid STREAMINFO block and no audio frames: a download or
/// copy cut off right after the header.
fn write_truncated_flac(path: &Path) {
    let mut bytes = b"fLaC".to_vec();
    bytes.extend_from_slice(&[0x80, 0x00, 0x00, 0x22]);
    bytes.extend_from_slice(&4096u16.to_be_bytes());
    bytes.extend_from_slice(&4096u16.to_be_bytes());
    bytes.extend_from_slice(&[0; 6]);
    let packed: u64 = (44_100u64 << 44) | (1 << 41) | (15 << 36) | 44_100;
    bytes.extend_from_slice(&packed.to_be_bytes());
    bytes.extend_from_slice(&[0; 16]);
    std::fs::write(path, bytes).unwrap();
}

#[tokio::test]
async fn a_flac_named_file_that_is_not_audio_fails_only_that_file() {
    let dir = tempfile::tempdir().unwrap();
    let good = wavs(dir.path(), 2);
    let fake = dir.path().join("notes.flac");
    std::fs::write(&fake, "these are liner notes, not audio").unwrap();
    let truncated = dir.path().join("cut-off.flac");
    write_truncated_flac(&truncated);

    let pool = pool().await;
    let mut paths = good.clone();
    paths.push(fake.clone());
    paths.push(truncated.clone());
    let result = import_paths(&pool, paths).await;

    assert_eq!(result.imported, 2, "errors: {:?}", result.errors);
    assert_eq!(result.errors.len(), 2);
    let fake_error = result.errors.iter().find(|f| f.path.ends_with("notes.flac")).unwrap();
    assert!(fake_error.error.starts_with("Not a playable FLAC file"), "{}", fake_error.error);
    assert!(result.errors.iter().any(|f| f.path.ends_with("cut-off.flac")));
    assert_eq!(total(&pool).await, 2);
}

#[tokio::test]
async fn a_cancelled_import_resumes_with_the_files_it_had_not_reached() {
    let dir = tempfile::tempdir().unwrap();
    let paths = wavs(dir.path(), IMPORT_BATCH + 4);
    let pool = pool().await;

    let first = run(&pool, job(&pool, "", paths).await, Some(1)).await;

    assert!(first.cancelled);
    assert_eq!(first.imported, IMPORT_BATCH);
    assert_eq!(
        pending_imports(&pool).await.unwrap(),
        Some(PendingImport { files: 4, jobs: 1 })
    );

    let resumed = run(&pool, pending_runs(&pool).await.unwrap(), None).await;

    assert!(!resumed.cancelled);
    assert_eq!(resumed.imported, 4, "only the files the first run had not reached");
    assert_eq!(total(&pool).await, (IMPORT_BATCH + 4) as i64, "no duplicate rows");
    assert_eq!(pending_imports(&pool).await.unwrap(), None);
    let jobs: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM library_import_jobs")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(jobs, 0, "a finished job is deleted");
}

#[tokio::test]
async fn a_job_left_by_a_quit_resumes_without_rereading_finished_files() {
    let dir = tempfile::tempdir().unwrap();
    let paths = wavs(dir.path(), 5);
    let pool = pool().await;
    // State after a quit mid-import: two files saved and ticked off, three pending.
    import_paths(&pool, paths[..2].to_vec()).await;
    sqlx::query("INSERT INTO library_import_jobs (id, source) VALUES ('crashed', '/music')")
        .execute(&pool)
        .await
        .unwrap();
    for (i, path) in paths.iter().enumerate() {
        sqlx::query("INSERT INTO library_import_job_paths (job_id, path, done) VALUES ('crashed', ?, ?)")
            .bind(path.to_string_lossy().into_owned())
            .bind(i64::from(i < 2))
            .execute(&pool)
            .await
            .unwrap();
    }
    // A finished file edited afterwards would change on a re-read.
    write_wav(&paths[0], "Edited Later", "Artist");

    let resumed = run(&pool, pending_runs(&pool).await.unwrap(), None).await;

    assert_eq!(resumed.imported, 3);
    assert_eq!(total(&pool).await, 5);
    let titles: Vec<String> = list(&pool, "", 0).await.unwrap().tracks.into_iter().map(|t| t.title).collect();
    assert!(titles.contains(&"Track 00".to_owned()), "finished file not re-read: {titles:?}");
    assert_eq!(pending_imports(&pool).await.unwrap(), None);
}

#[tokio::test]
async fn importing_the_same_folder_again_continues_the_interrupted_job() {
    let dir = tempfile::tempdir().unwrap();
    let mut paths = wavs(dir.path(), IMPORT_BATCH + 2);
    let broken = dir.path().join("zz-broken.wav");
    std::fs::write(&broken, b"garbage").unwrap();
    paths.push(broken.canonicalize().unwrap());
    let pool = pool().await;
    run(&pool, job(&pool, "/music", paths.clone()).await, Some(1)).await;

    let (_, remaining) = start_job(&pool, "/music", None, paths.clone()).await.unwrap();

    assert_eq!(remaining, paths[IMPORT_BATCH..].to_vec(), "finished files are left out");
    let jobs: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM library_import_jobs")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(jobs, 1, "the new job replaces the interrupted one");
    let (_, other) = start_job(&pool, "/elsewhere", None, paths.clone()).await.unwrap();
    assert_eq!(other.len(), paths.len(), "another source starts from scratch");
}

#[tokio::test]
async fn failed_files_do_not_keep_a_job_pending_but_are_retried_by_a_new_import() {
    let dir = tempfile::tempdir().unwrap();
    let mut paths = wavs(dir.path(), 1);
    let broken = dir.path().join("broken.flac");
    std::fs::write(&broken, b"garbage").unwrap();
    paths.push(broken.canonicalize().unwrap());
    let pool = pool().await;

    let result = run(&pool, job(&pool, "/music", paths.clone()).await, None).await;

    assert_eq!((result.imported, result.errors.len()), (1, 1));
    assert_eq!(pending_imports(&pool).await.unwrap(), None);
    let (_, remaining) = start_job(&pool, "/music", None, paths.clone()).await.unwrap();
    assert_eq!(remaining.len(), 2, "the job was finished, so a new import reads everything");
}

#[tokio::test]
async fn removing_a_root_or_discarding_drops_unfinished_jobs() {
    let dir = tempfile::tempdir().unwrap();
    let paths = wavs(dir.path(), 3);
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();
    start_job(&pool, &root.path, Some(&root.id), paths.clone()).await.unwrap();
    start_job(&pool, "", None, paths).await.unwrap();
    assert_eq!(pending_imports(&pool).await.unwrap(), Some(PendingImport { files: 6, jobs: 2 }));

    remove_root(&pool, &root.id).await.unwrap();
    assert_eq!(pending_imports(&pool).await.unwrap(), Some(PendingImport { files: 3, jobs: 1 }));

    discard_pending_imports(&pool).await.unwrap();
    assert_eq!(pending_imports(&pool).await.unwrap(), None);
}
