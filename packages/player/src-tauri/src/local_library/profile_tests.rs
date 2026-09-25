//! Native profiling and soak harness (Phase 6). All ignored: they measure,
//! they don't assert budgets on shared CI hardware.
//!
//! ```text
//! cargo test --release --lib profile_native -- --ignored --nocapture
//! SOAK_SECS=1800 cargo test --release --lib profile_soak -- --ignored --nocapture
//! ```
//! `TRACKS` (default 3000) sizes the fixture. Memory is read from
//! `/proc/self/smaps_rollup` (Linux), so numbers are for the whole test
//! process: library code, SQLite and the test runtime.

use std::path::Path;
use std::sync::Arc;
use std::time::{Duration, Instant};

use super::analysis::{analyze_tracks, AnalysisControl};
use super::analysis_tests::write_kick_wav;
use super::test_support::{pool, write_wav_tagged};
use super::{add_root, discover_new_paths, list_query, ListQuery, LibraryRoot};

fn smaps_kb(field: &str) -> u64 {
    std::fs::read_to_string("/proc/self/smaps_rollup")
        .ok()
        .and_then(|text| {
            text.lines()
                .find(|l| l.starts_with(field))
                .and_then(|l| l.split_whitespace().nth(1)?.parse().ok())
        })
        .unwrap_or(0)
}

fn mem() -> String {
    format!("RSS {} MB, PSS {} MB", smaps_kb("Rss:") / 1024, smaps_kb("Pss:") / 1024)
}

fn cpu_secs() -> f64 {
    // utime + stime of this process, in clock ticks (USER_HZ is 100 on Linux).
    std::fs::read_to_string("/proc/self/stat")
        .ok()
        .and_then(|s| {
            let rest = s.rsplit(')').next()?.to_string();
            let f: Vec<&str> = rest.split_whitespace().collect();
            Some((f.get(11)?.parse::<f64>().ok()? + f.get(12)?.parse::<f64>().ok()?) / 100.0)
        })
        .unwrap_or(0.0)
}

fn env_num(name: &str, default: u64) -> u64 {
    std::env::var(name).ok().and_then(|v| v.parse().ok()).unwrap_or(default)
}

fn fixture(dir: &Path, tracks: usize, analysed: usize) {
    for i in 0..tracks {
        let folder = dir.join(format!("artist-{:03}", i % 200)).join(format!("album-{:02}", i % 7));
        std::fs::create_dir_all(&folder).unwrap();
        let file = folder.join(format!("track-{i:05}.wav"));
        if i < analysed {
            write_kick_wav(&file, 100.0 + (i % 40) as f64, 20.0, "House");
        } else {
            let title = format!("Track {i:05}");
            let artist = format!("Artist {}", i % 200);
            write_wav_tagged(&file, &[("INAM", title.as_str()), ("IART", artist.as_str())]);
        }
    }
}

async fn scan(pool: &sqlx::SqlitePool, root: &LibraryRoot) -> usize {
    let (fresh, _) = discover_new_paths(pool, root).await.unwrap();
    let count = fresh.len();
    let mut result = super::ImportResult::default();
    for batch in fresh.chunks(500) {
        super::import_batch(pool, batch.to_vec(), Some(&root.id), &mut result).await;
    }
    super::reconcile::refresh_changed(pool, root).await.unwrap();
    super::refresh_root_availability(pool, &root.id).await.unwrap();
    count
}

async fn searches(pool: &sqlx::SqlitePool) -> Duration {
    let started = Instant::now();
    for term in ["Track 0012", "Artist 17", "zzz-nothing", "track", "0042"] {
        list_query(pool, &ListQuery { search: term, ..Default::default() }, 0).await.unwrap();
    }
    started.elapsed() / 5
}

#[tokio::test(flavor = "multi_thread")]
#[ignore = "measurement; run in release with --nocapture"]
async fn profile_native() {
    let tracks = env_num("TRACKS", 3000) as usize;
    let analysed = 60usize.min(tracks);
    let dir = tempfile::tempdir().unwrap();
    let t = Instant::now();
    fixture(dir.path(), tracks, analysed);
    println!("fixture: {tracks} files ({analysed} 20 s kick tracks) in {:.1?}; baseline {}", t.elapsed(), mem());

    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();
    let (cpu, t) = (cpu_secs(), Instant::now());
    let imported = scan(&pool, &root).await;
    println!("import {imported}: {:.2?} wall, {:.2} s cpu; {}", t.elapsed(), cpu_secs() - cpu, mem());

    let (cpu, t) = (cpu_secs(), Instant::now());
    let again = scan(&pool, &root).await;
    println!("idempotent rescan ({again} new): {:.2?} wall, {:.2} s cpu; {}", t.elapsed(), cpu_secs() - cpu, mem());

    println!("search: {:.1?} average over 5 terms; {}", searches(&pool).await, mem());

    let control = Arc::new(AnalysisControl::default());
    let ids: Vec<String> = sqlx::query_scalar("SELECT id FROM library_tracks WHERE path LIKE '%track-000%' ORDER BY path LIMIT ?")
        .bind(analysed as i64)
        .fetch_all(&pool)
        .await
        .unwrap();
    let (cpu, t) = (cpu_secs(), Instant::now());
    let result = analyze_tracks(&pool, &ids, false, &control, &|_| {}).await.unwrap();
    println!(
        "analysis of {} tracks (20 s each): {:.2?} wall, {:.2} s cpu, analyzed {} failed {}; {}",
        ids.len(), t.elapsed(), cpu_secs() - cpu, result.analyzed, result.failed, mem()
    );

    // Cancellation must stop promptly and leave nothing running or held.
    let control = Arc::new(AnalysisControl::default());
    let flag = Arc::clone(&control);
    let canceller = tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(150)).await;
        flag.cancel.store(true, std::sync::atomic::Ordering::Relaxed);
    });
    let (before, t) = (smaps_kb("Rss:"), Instant::now());
    let result = analyze_tracks(&pool, &ids, true, &control, &|_| {}).await.unwrap();
    canceller.await.unwrap();
    println!(
        "cancelled forced re-analysis after {:.2?}: cancelled={} analyzed {}; RSS {} MB -> {} MB",
        t.elapsed(), result.cancelled, result.analyzed, before / 1024, smaps_kb("Rss:") / 1024
    );
}

#[tokio::test(flavor = "multi_thread")]
#[ignore = "runs for SOAK_SECS (default 60); use 1800 for the 30-minute soak"]
async fn profile_soak() {
    let seconds = env_num("SOAK_SECS", 60);
    let tracks = env_num("TRACKS", 3000) as usize;
    let dir = tempfile::tempdir().unwrap();
    fixture(dir.path(), tracks, 0);
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();
    scan(&pool, &root).await;
    let ids: Vec<String> = sqlx::query_scalar("SELECT id FROM library_tracks ORDER BY path LIMIT 20")
        .fetch_all(&pool)
        .await
        .unwrap();
    println!("soak {seconds} s over {tracks} tracks; start {}", mem());
    let (start, mut next_report, mut cycles) = (Instant::now(), 60u64, 0u64);
    while start.elapsed().as_secs() < seconds {
        // A cycle = rescan + searches + a touched file re-read + a short analysis.
        scan(&pool, &root).await;
        searches(&pool).await;
        let touched = dir.path().join("artist-000/album-00/track-00000.wav");
        let bytes = std::fs::read(&touched).unwrap();
        std::fs::write(&touched, bytes).unwrap();
        let control = Arc::new(AnalysisControl::default());
        analyze_tracks(&pool, &ids[..3], true, &control, &|_| {}).await.unwrap();
        cycles += 1;
        if start.elapsed().as_secs() >= next_report.min(seconds) {
            println!("t={:>5}s cycles {cycles:>5}: {}", start.elapsed().as_secs(), mem());
            next_report += 60;
        }
    }
    println!("done: {cycles} cycles in {:.0?}; end {}", start.elapsed(), mem());
}
