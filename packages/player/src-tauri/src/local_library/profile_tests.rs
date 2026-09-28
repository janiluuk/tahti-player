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

fn peak_rss_mb() -> u64 {
    std::fs::read_to_string("/proc/self/status")
        .ok()
        .and_then(|text| {
            text.lines()
                .find(|l| l.starts_with("VmHWM:"))
                .and_then(|l| l.split_whitespace().nth(1)?.parse::<u64>().ok())
        })
        .unwrap_or(0)
        / 1024
}

/// An `iTunes Music Library.xml` shaped like a real export: ~30 keys per
/// track (Unicode names, dates, counts), nested playlist folders and big
/// playlists. Written straight to disk so the generator never holds it.
fn write_itunes_library(path: &Path, tracks: usize) -> u64 {
    use std::io::Write;
    let mut out = std::io::BufWriter::new(std::fs::File::create(path).unwrap());
    write!(
        out,
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE plist PUBLIC \"-//Apple Computer//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n\
         <plist version=\"1.0\">\n<dict>\n\t<key>Major Version</key><integer>1</integer>\n\t<key>Minor Version</key><integer>1</integer>\n\
         \t<key>Application Version</key><string>12.13.2.3</string>\n\t<key>Music Folder</key><string>file:///Users/me/Music/iTunes/iTunes%20Media/</string>\n\
         \t<key>Library Persistent ID</key><string>0123456789ABCDEF</string>\n\t<key>Tracks</key>\n\t<dict>\n"
    )
    .unwrap();
    for i in 0..tracks {
        let artist = format!("Artistí {:04} ☆", i % 4000);
        let album = format!("Albümi {:05}", i % 9000);
        write!(
            out,
            "\t\t<key>{i}</key>\n\t\t<dict>\n\
             \t\t\t<key>Track ID</key><integer>{i}</integer>\n\
             \t\t\t<key>Size</key><integer>{size}</integer>\n\
             \t\t\t<key>Total Time</key><integer>{ms}</integer>\n\
             \t\t\t<key>Disc Number</key><integer>1</integer>\n\t\t\t<key>Disc Count</key><integer>1</integer>\n\
             \t\t\t<key>Track Number</key><integer>{no}</integer>\n\t\t\t<key>Track Count</key><integer>12</integer>\n\
             \t\t\t<key>Year</key><integer>{year}</integer>\n\
             \t\t\t<key>BPM</key><integer>{bpm}</integer>\n\
             \t\t\t<key>Date Modified</key><date>2021-03-04T05:06:07Z</date>\n\
             \t\t\t<key>Date Added</key><date>2019-01-02T03:04:05Z</date>\n\
             \t\t\t<key>Bit Rate</key><integer>320</integer>\n\t\t\t<key>Sample Rate</key><integer>44100</integer>\n\
             \t\t\t<key>Play Count</key><integer>{plays}</integer>\n\
             \t\t\t<key>Play Date</key><integer>3700000000</integer>\n\
             \t\t\t<key>Play Date UTC</key><date>2021-04-05T06:07:08Z</date>\n\
             \t\t\t<key>Skip Count</key><integer>{skips}</integer>\n\
             \t\t\t<key>Skip Date</key><date>2021-02-03T04:05:06Z</date>\n\
             \t\t\t<key>Rating</key><integer>{rating}</integer>\n\
             \t\t\t<key>Album Rating</key><integer>60</integer>\n\t\t\t<key>Album Rating Computed</key><true/>\n\
             {loved}\
             \t\t\t<key>Artwork Count</key><integer>1</integer>\n\
             \t\t\t<key>Persistent ID</key><string>{pid:016X}</string>\n\
             \t\t\t<key>Track Type</key><string>File</string>\n\
             \t\t\t<key>File Folder Count</key><integer>5</integer>\n\t\t\t<key>Library Folder Count</key><integer>1</integer>\n\
             \t\t\t<key>Name</key><string>Kappale {i} – Ääni &amp; Valo</string>\n\
             \t\t\t<key>Artist</key><string>{artist}</string>\n\
             \t\t\t<key>Album Artist</key><string>{artist}</string>\n\
             \t\t\t<key>Composer</key><string>Säveltäjä {c}</string>\n\
             \t\t\t<key>Album</key><string>{album}</string>\n\
             \t\t\t<key>Genre</key><string>Electronic</string>\n\
             \t\t\t<key>Kind</key><string>MPEG audio file</string>\n\
             \t\t\t<key>Comments</key><string>Ripped from CD, checked {i}</string>\n\
             \t\t\t<key>Sort Name</key><string>Kappale {i}</string>\n\
             \t\t\t<key>Location</key><string>file:///Users/me/Music/iTunes/iTunes%20Media/Music/Artist%C3%AD%20{a:04}%20%E2%98%86/Alb%C3%BCmi%20{b:05}/{no:02}%20Kappale%20{i}.mp3</string>\n\
             \t\t</dict>\n",
            size = 4_000_000 + i % 9_000_000,
            ms = 180_000 + (i % 240) * 1000,
            no = i % 12 + 1,
            year = 1970 + i % 55,
            bpm = 90 + i % 60,
            plays = i % 50,
            skips = i % 7,
            rating = (i % 6) * 20,
            loved = if i % 13 == 0 { "\t\t\t<key>Loved</key><true/>\n" } else { "" },
            pid = 0xA000_0000_0000_0000u64 + i as u64,
            c = i % 700,
            a = i % 4000,
            b = i % 9000,
        )
        .unwrap();
    }
    write!(out, "\t</dict>\n\t<key>Playlists</key>\n\t<array>\n").unwrap();
    let mut playlist = |out: &mut std::io::BufWriter<std::fs::File>, name: &str, pid: String, parent: Option<String>, folder: bool, items: &mut dyn Iterator<Item = usize>| {
        write!(out, "\t\t<dict>\n\t\t\t<key>Name</key><string>{name}</string>\n\t\t\t<key>Playlist Persistent ID</key><string>{pid}</string>\n").unwrap();
        if let Some(parent) = parent {
            write!(out, "\t\t\t<key>Parent Persistent ID</key><string>{parent}</string>\n").unwrap();
        }
        if folder {
            write!(out, "\t\t\t<key>Folder</key><true/>\n").unwrap();
        }
        write!(out, "\t\t\t<key>All Items</key><true/>\n\t\t\t<key>Playlist Items</key>\n\t\t\t<array>\n").unwrap();
        for id in items {
            write!(out, "\t\t\t\t<dict>\n\t\t\t\t\t<key>Track ID</key><integer>{id}</integer>\n\t\t\t\t</dict>\n").unwrap();
        }
        write!(out, "\t\t\t</array>\n\t\t</dict>\n").unwrap();
    };
    write!(out, "\t\t<dict>\n\t\t\t<key>Name</key><string>Library</string>\n\t\t\t<key>Master</key><true/>\n\t\t\t<key>Playlist Persistent ID</key><string>MASTER</string>\n\t\t\t<key>Playlist Items</key>\n\t\t\t<array>\n").unwrap();
    for id in 0..tracks {
        write!(out, "\t\t\t\t<dict>\n\t\t\t\t\t<key>Track ID</key><integer>{id}</integer>\n\t\t\t\t</dict>\n").unwrap();
    }
    write!(out, "\t\t\t</array>\n\t\t</dict>\n").unwrap();
    for folder in 0..10 {
        let folder_id = format!("F{folder:015}");
        playlist(&mut out, &format!("Kansio {folder}"), folder_id.clone(), None, true, &mut std::iter::empty());
        for list in 0..20 {
            let start = (folder * 20 + list) * 97 % tracks.max(1);
            let len = 50 + (list * 37) % 1500;
            playlist(&mut out, &format!("Lista {folder}/{list} ♪"), format!("L{folder:03}{list:012}"), Some(folder_id.clone()), false, &mut (0..len).map(|k| (start + k * 7) % tracks.max(1)));
        }
    }
    write!(out, "\t</array>\n</dict>\n</plist>\n").unwrap();
    out.flush().unwrap();
    std::fs::metadata(path).unwrap().len()
}

#[tokio::test(flavor = "multi_thread")]
#[ignore = "profiling: writes a ~110 MB XML (TRACKS, default 55000) and prints timings"]
async fn profile_itunes_xml() {
    use super::itunes_import::preview;
    use super::itunes_xml::parse_library;
    let tracks = env_num("TRACKS", 55_000) as usize;
    let dir = tempfile::tempdir().unwrap();
    let xml = dir.path().join("iTunes Music Library.xml");
    let t = Instant::now();
    let bytes = write_itunes_library(&xml, tracks);
    println!("wrote {tracks} tracks, {:.1} MB in {:.2?}; {}", bytes as f64 / 1e6, t.elapsed(), mem());

    let (rss0, cpu0, t) = (smaps_kb("Rss:"), cpu_secs(), Instant::now());
    let library = parse_library(std::io::BufReader::new(std::fs::File::open(&xml).unwrap())).unwrap();
    println!(
        "parse: {:.2?} wall, {:.2} s cpu; {} tracks, {} playlists; RSS {} -> {} MB, peak {} MB",
        t.elapsed(), cpu_secs() - cpu0, library.tracks.len(), library.playlists.len(),
        rss0 / 1024, smaps_kb("Rss:") / 1024, peak_rss_mb()
    );
    assert_eq!(library.tracks.len(), tracks);
    drop(library);

    let pool = pool().await;
    let (cpu0, t) = (cpu_secs(), Instant::now());
    let p = preview(&pool, &xml, &[]).await.unwrap();
    println!(
        "preview (every file missing): {:.2?} wall, {:.2} s cpu; tracks {}, missing {}, unresolved listed {}, playlists {} ({} entries); {}, peak {} MB",
        t.elapsed(), cpu_secs() - cpu0, p.tracks, p.tracks_missing, p.unresolved.len(), p.playlists, p.playlist_entries, mem(), peak_rss_mb()
    );
    assert_eq!(p.tracks, tracks);
}
