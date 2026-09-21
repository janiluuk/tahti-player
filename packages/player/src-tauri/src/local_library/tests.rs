use std::sync::atomic::{AtomicU32, Ordering};

use sqlx::sqlite::{SqliteConnectOptions, SqlitePool};

use super::{
    add_root, collect_audio_paths, collect_audio_paths_with_skipped, discover_new_paths,
    get_root, import_batch, import_paths, list, list_roots, list_unavailable,
    refresh_root_availability, relink, relink_root, remove, remove_root, rescan_unavailable,
    resolve_path, facets, filter_options, list_query, matching_ids_query, folder_of, Availability, ListQuery, TrackFilters, remove_many, list_filtered, matching_ids, prepare_playback, SortColumn, TrackSort, totals, FacetFilter, FacetKind, ImportResult,
};

static DB_COUNTER: AtomicU32 = AtomicU32::new(0);

async fn pool() -> SqlitePool {
    let id = DB_COUNTER.fetch_add(1, Ordering::Relaxed);
    let options: SqliteConnectOptions =
        format!("sqlite:file:testlib_{id}?mode=memory&cache=shared")
            .parse()
            .unwrap();
    let options = crate::db::configure(options);
    let pool = SqlitePool::connect_with(options).await.unwrap();
    sqlx::migrate!("./migrations/library")
        .run(&pool)
        .await
        .unwrap();
    pool
}

/// Writes a minimal PCM16 mono WAV file symphonia can decode and tag.
fn write_wav(path: &std::path::Path, title: &str, artist: &str) {
    write_wav_tagged(path, &[("INAM", title), ("IART", artist)]);
}

/// Same WAV with an arbitrary set of RIFF INFO tags.
fn write_wav_tagged(path: &std::path::Path, tags: &[(&str, &str)]) {
    let samples: Vec<i16> = (0..4410).map(|i| ((i % 100) * 300) as i16).collect();
    let data_len = (samples.len() * 2) as u32;
    let mut bytes = Vec::new();
    bytes.extend_from_slice(b"RIFF");
    bytes.extend_from_slice(&(36 + data_len).to_le_bytes());
    bytes.extend_from_slice(b"WAVEfmt ");
    bytes.extend_from_slice(&16u32.to_le_bytes());
    bytes.extend_from_slice(&1u16.to_le_bytes()); // PCM
    bytes.extend_from_slice(&1u16.to_le_bytes()); // mono
    bytes.extend_from_slice(&44100u32.to_le_bytes());
    bytes.extend_from_slice(&(44100u32 * 2).to_le_bytes());
    bytes.extend_from_slice(&2u16.to_le_bytes());
    bytes.extend_from_slice(&16u16.to_le_bytes());
    // The WAV reader returns as soon as it sees the `data` chunk, so `LIST` must precede it.
    let mut list_chunk = Vec::new();
    list_chunk.extend_from_slice(b"INFO");
    for (tag, value) in tags.iter().copied() {
        let mut value_bytes = value.as_bytes().to_vec();
        value_bytes.push(0); // null terminator, counted in len
        let len = value_bytes.len() as u32;
        if value_bytes.len() % 2 != 0 {
            value_bytes.push(0); // alignment pad, NOT counted in len
        }
        list_chunk.extend_from_slice(tag.as_bytes());
        list_chunk.extend_from_slice(&len.to_le_bytes());
        list_chunk.extend_from_slice(&value_bytes);
    }
    bytes.extend_from_slice(b"LIST");
    bytes.extend_from_slice(&(list_chunk.len() as u32).to_le_bytes());
    bytes.extend_from_slice(&list_chunk);
    bytes.extend_from_slice(b"data");
    bytes.extend_from_slice(&data_len.to_le_bytes());
    for sample in &samples {
        bytes.extend_from_slice(&sample.to_le_bytes());
    }
    let riff_size = (bytes.len() - 8) as u32;
    bytes[4..8].copy_from_slice(&riff_size.to_le_bytes());
    std::fs::write(path, bytes).unwrap();
}

#[tokio::test]
async fn imports_wav_and_extracts_tags() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "Test Song", "Test Artist");

    let pool = pool().await;
    let result = import_paths(&pool, vec![path]).await;

    assert_eq!(result.imported, 1, "errors: {:?}", result.errors);
    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!(page.total, 1);
    assert_eq!(page.tracks[0].title, "Test Song");
    assert_eq!(page.tracks[0].artist, "Test Artist");
    assert_eq!(page.tracks[0].format, "wav");
    assert_eq!(page.tracks[0].sample_rate, 44100);
}

#[test]
fn collects_supported_audio_recursively_in_stable_order() {
    let dir = tempfile::tempdir().unwrap();
    let nested = dir.path().join("Disc 2");
    std::fs::create_dir_all(&nested).unwrap();
    let first = dir.path().join("01-first.wav");
    let second = nested.join("02-second.FLAC");
    write_wav(&first, "First", "Artist");
    write_wav(&second, "Second", "Artist");
    std::fs::write(dir.path().join("cover.jpg"), b"not audio").unwrap();

    let paths = collect_audio_paths(dir.path()).unwrap();

    assert_eq!(paths, vec![first, second]);
}

#[test]
fn counts_unsupported_files_seen_during_a_folder_walk_as_skipped() {
    let dir = tempfile::tempdir().unwrap();
    let nested = dir.path().join("Disc 2");
    std::fs::create_dir_all(&nested).unwrap();
    write_wav(&dir.path().join("01-first.wav"), "First", "Artist");
    write_wav(&nested.join("02-second.FLAC"), "Second", "Artist");
    std::fs::write(dir.path().join("cover.jpg"), b"not audio").unwrap();
    std::fs::write(nested.join("liner-notes.pdf"), b"not audio").unwrap();

    let (paths, skipped) = collect_audio_paths_with_skipped(dir.path()).unwrap();

    assert_eq!(paths.len(), 2);
    assert_eq!(skipped, 2, "cover.jpg and liner-notes.pdf should be skipped, not imported or errored");
}

#[test]
fn rejects_a_folder_scan_root_that_is_not_a_directory() {
    let dir = tempfile::tempdir().unwrap();
    let file = dir.path().join("track.wav");
    write_wav(&file, "Track", "Artist");

    assert_eq!(
        collect_audio_paths(&file).unwrap_err(),
        "Selected path is not a folder"
    );
}

#[tokio::test]
async fn rejects_unsupported_extension() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("notes.txt");
    std::fs::write(&path, b"not audio").unwrap();

    let pool = pool().await;
    let result = import_paths(&pool, vec![path]).await;

    assert_eq!(result.imported, 0);
    assert_eq!(result.errors.len(), 1);
}

#[tokio::test]
async fn reimporting_same_path_updates_instead_of_duplicating() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "First Title", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    write_wav(&path, "Second Title", "Artist");
    let result = import_paths(&pool, vec![path]).await;

    assert_eq!(result.imported, 1);
    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!(page.total, 1);
    assert_eq!(page.tracks[0].title, "Second Title");
}

#[tokio::test]
async fn list_filters_by_search_across_fields() {
    let dir = tempfile::tempdir().unwrap();
    let a = dir.path().join("a.wav");
    let b = dir.path().join("b.wav");
    write_wav(&a, "Alpha", "Band One");
    write_wav(&b, "Beta", "Band Two");

    let pool = pool().await;
    import_paths(&pool, vec![a, b]).await;

    let page = list(&pool, "Band One", 0).await.unwrap();
    assert_eq!(page.total, 1);
    assert_eq!(page.tracks[0].title, "Alpha");
}

#[tokio::test]
async fn list_search_escapes_sql_wildcards() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "100% Real", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![path]).await;

    assert_eq!(list(&pool, "100% Real", 0).await.unwrap().total, 1);
    assert_eq!(list(&pool, "100_ Real", 0).await.unwrap().total, 0);
}

#[tokio::test]
async fn resolve_path_fails_once_file_is_missing() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "Title", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();

    assert!(resolve_path(&pool, &id).await.is_ok());
    std::fs::remove_file(&path).unwrap();
    let error = resolve_path(&pool, &id).await.unwrap_err();
    assert!(error.contains("unavailable"));
}

#[tokio::test]
async fn resolve_path_persists_unavailable_state() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "Title", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    assert!(list(&pool, "", 0).await.unwrap().tracks[0].available);

    std::fs::remove_file(&path).unwrap();
    assert!(resolve_path(&pool, &id).await.is_err());

    // Unlike the transient error above, this must survive a fresh read --
    // Phase 1's relink UI needs to list missing tracks without re-resolving
    // every row on every page load.
    let row = list(&pool, "", 0)
        .await
        .unwrap()
        .tracks
        .into_iter()
        .next()
        .unwrap();
    assert!(!row.available);
    assert!(row.unavailable_since.is_some());

    let missing = list_unavailable(&pool).await.unwrap();
    assert_eq!(missing.len(), 1);
    assert_eq!(missing[0].id, id);
}

#[tokio::test]
async fn resolve_path_self_heals_once_file_returns() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "Title", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();

    std::fs::remove_file(&path).unwrap();
    assert!(resolve_path(&pool, &id).await.is_err());
    assert!(!list(&pool, "", 0).await.unwrap().tracks[0].available);

    // Reconnected drive / restored file: the next successful resolve clears
    // the missing state rather than leaving it stuck until a future re-scan.
    write_wav(&path, "Title", "Artist");
    assert!(resolve_path(&pool, &id).await.is_ok());
    let row = list(&pool, "", 0)
        .await
        .unwrap()
        .tracks
        .into_iter()
        .next()
        .unwrap();
    assert!(row.available);
    assert!(row.unavailable_since.is_none());
    assert_eq!(list_unavailable(&pool).await.unwrap().len(), 0);
}

#[tokio::test]
async fn reimporting_a_missing_track_clears_unavailable_state() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "First Title", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    std::fs::remove_file(&path).unwrap();
    resolve_path(&pool, &id).await.ok();
    assert!(!list(&pool, "", 0).await.unwrap().tracks[0].available);

    write_wav(&path, "Second Title", "Artist");
    import_paths(&pool, vec![path]).await;

    let row = list(&pool, "", 0)
        .await
        .unwrap()
        .tracks
        .into_iter()
        .next()
        .unwrap();
    assert!(row.available);
    assert!(row.unavailable_since.is_none());
    assert_eq!(row.title, "Second Title");
}

#[tokio::test]
async fn rescan_restores_returned_files_and_keeps_missing_files() {
    let dir = tempfile::tempdir().unwrap();
    let restored = dir.path().join("restored.wav");
    let missing = dir.path().join("missing.wav");
    write_wav(&restored, "Restored", "Artist");
    write_wav(&missing, "Missing", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![restored.clone(), missing.clone()]).await;
    let tracks = list(&pool, "", 0).await.unwrap().tracks;
    let restored_id = tracks
        .iter()
        .find(|track| track.title == "Restored")
        .unwrap()
        .id
        .clone();
    let missing_id = tracks
        .iter()
        .find(|track| track.title == "Missing")
        .unwrap()
        .id
        .clone();
    std::fs::remove_file(&restored).unwrap();
    std::fs::remove_file(&missing).unwrap();
    assert!(resolve_path(&pool, &restored_id).await.is_err());
    assert!(resolve_path(&pool, &missing_id).await.is_err());

    write_wav(&restored, "Restored", "Artist");
    let unavailable = rescan_unavailable(&pool).await.unwrap();

    assert_eq!(unavailable.len(), 1);
    assert_eq!(unavailable[0].id, missing_id);
    assert!(resolve_path(&pool, &restored_id).await.is_ok());
    assert_eq!(rescan_unavailable(&pool).await.unwrap().len(), 1);
}

#[tokio::test]
async fn relink_preserves_id_and_refreshes_metadata() {
    let dir = tempfile::tempdir().unwrap();
    let original = dir.path().join("original.wav");
    let replacement = dir.path().join("replacement.wav");
    write_wav(&original, "Old title", "Old artist");
    write_wav(&replacement, "New title", "New artist");

    let pool = pool().await;
    import_paths(&pool, vec![original.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    std::fs::remove_file(&original).unwrap();
    assert!(resolve_path(&pool, &id).await.is_err());

    let track = relink(&pool, &id, replacement.clone()).await.unwrap();

    assert_eq!(track.id, id);
    assert_eq!(
        std::fs::canonicalize(&track.path).unwrap(),
        std::fs::canonicalize(replacement).unwrap()
    );
    assert_eq!(track.title, "New title");
    assert_eq!(track.artist, "New artist");
    assert!(track.available);
    assert!(track.unavailable_since.is_none());
    assert_eq!(list_unavailable(&pool).await.unwrap().len(), 0);
    assert_eq!(resolve_path(&pool, &id).await.unwrap(), track.path);
}

#[tokio::test]
async fn relink_rejects_unknown_tracks_and_duplicate_paths() {
    let dir = tempfile::tempdir().unwrap();
    let first = dir.path().join("first.wav");
    let second = dir.path().join("second.wav");
    write_wav(&first, "First", "Artist");
    write_wav(&second, "Second", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![first.clone(), second.clone()]).await;
    let tracks = list(&pool, "", 0).await.unwrap().tracks;
    let first_id = tracks
        .iter()
        .find(|track| track.title == "First")
        .unwrap()
        .id
        .clone();

    assert_eq!(
        relink(&pool, "unknown", first).await.unwrap_err(),
        "Track is not in the library"
    );
    assert_eq!(
        relink(&pool, &first_id, second).await.unwrap_err(),
        "This file is already in your library as a different track."
    );
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 2);
}

#[tokio::test]
async fn resolve_path_rejects_unknown_id() {
    let pool = pool().await;
    assert!(resolve_path(&pool, "missing").await.is_err());
}

#[tokio::test]
async fn remove_deletes_the_track() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "Title", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![path]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();

    remove(&pool, &id).await.unwrap();
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 0);
}

// --- Phase 0 fixture coverage: deterministic collections named in the
// desktop-pro-library plan (tagged/untagged, Unicode paths, duplicate
// filenames, corrupt files, disconnected roots) plus generated bulk rows
// for pagination/search at scale. ---

/// A WAV with no `LIST`/INFO chunk at all — tags absent, not just empty.
fn write_wav_untagged(path: &std::path::Path) {
    let samples: Vec<i16> = (0..4410).map(|i| ((i % 100) * 300) as i16).collect();
    let data_len = (samples.len() * 2) as u32;
    let mut bytes = Vec::new();
    bytes.extend_from_slice(b"RIFF");
    bytes.extend_from_slice(&(36 + data_len).to_le_bytes());
    bytes.extend_from_slice(b"WAVEfmt ");
    bytes.extend_from_slice(&16u32.to_le_bytes());
    bytes.extend_from_slice(&1u16.to_le_bytes());
    bytes.extend_from_slice(&1u16.to_le_bytes());
    bytes.extend_from_slice(&44100u32.to_le_bytes());
    bytes.extend_from_slice(&(44100u32 * 2).to_le_bytes());
    bytes.extend_from_slice(&2u16.to_le_bytes());
    bytes.extend_from_slice(&16u16.to_le_bytes());
    bytes.extend_from_slice(b"data");
    bytes.extend_from_slice(&data_len.to_le_bytes());
    for sample in &samples {
        bytes.extend_from_slice(&sample.to_le_bytes());
    }
    let riff_size = (bytes.len() - 8) as u32;
    bytes[4..8].copy_from_slice(&riff_size.to_le_bytes());
    std::fs::write(path, bytes).unwrap();
}

#[tokio::test]
async fn imports_untagged_file_falling_back_to_filename() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("Untitled Track.wav");
    write_wav_untagged(&path);

    let pool = pool().await;
    let result = import_paths(&pool, vec![path]).await;

    assert_eq!(result.imported, 1, "errors: {:?}", result.errors);
    let page = list(&pool, "", 0).await.unwrap();
    // No tags present: title falls back to the filename stem, artist/album
    // stay empty rather than guessing — matches Phase 1's "filename is a
    // fallback, not a guessed artist" rule already honored by metadata::read.
    assert_eq!(page.tracks[0].title, "Untitled Track");
    assert_eq!(page.tracks[0].artist, "");
    assert_eq!(page.tracks[0].album, "");
}

#[tokio::test]
async fn rejects_corrupt_file_with_supported_extension() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("broken.wav");
    // Valid extension, garbage content: must fail per-file, not panic or
    // abort a batch (Phase 1's "corrupt files do not abort the batch").
    std::fs::write(&path, b"not actually a wav file, just noise bytes").unwrap();

    let pool = pool().await;
    let result = import_paths(&pool, vec![path]).await;

    assert_eq!(result.imported, 0);
    assert_eq!(result.errors.len(), 1);
}

#[tokio::test]
async fn corrupt_file_in_batch_does_not_block_valid_imports() {
    let dir = tempfile::tempdir().unwrap();
    let good = dir.path().join("good.wav");
    let bad = dir.path().join("bad.wav");
    write_wav(&good, "Good Song", "Artist");
    std::fs::write(&bad, b"garbage").unwrap();

    let pool = pool().await;
    let result = import_paths(&pool, vec![bad, good]).await;

    assert_eq!(result.imported, 1);
    assert_eq!(result.errors.len(), 1);
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 1);
}

#[tokio::test]
async fn imports_unicode_path() {
    let dir = tempfile::tempdir().unwrap();
    // Non-ASCII directory and filename: CJK, accents, and an emoji.
    let sub = dir.path().join("Musique — Été 🎧");
    std::fs::create_dir_all(&sub).unwrap();
    let path = sub.join("楽曲.wav");
    write_wav(&path, "Unicode Title", "Ünïcödé Ärtïst");

    let pool = pool().await;
    let result = import_paths(&pool, vec![path]).await;

    assert_eq!(result.imported, 1, "errors: {:?}", result.errors);
    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!(page.tracks[0].title, "Unicode Title");
    assert_eq!(page.tracks[0].artist, "Ünïcödé Ärtïst");
}

#[tokio::test]
async fn same_filename_in_different_folders_are_distinct_tracks() {
    let dir = tempfile::tempdir().unwrap();
    let folder_a = dir.path().join("Album A");
    let folder_b = dir.path().join("Album B");
    std::fs::create_dir_all(&folder_a).unwrap();
    std::fs::create_dir_all(&folder_b).unwrap();
    let path_a = folder_a.join("track01.wav");
    let path_b = folder_b.join("track01.wav");
    write_wav(&path_a, "Song From A", "Artist A");
    write_wav(&path_b, "Song From B", "Artist B");

    let pool = pool().await;
    let result = import_paths(&pool, vec![path_a, path_b]).await;

    // Same basename, different folders/paths: file-location identity is the
    // full path, not the filename, so both are kept as distinct tracks
    // rather than one clobbering the other.
    assert_eq!(result.imported, 2, "errors: {:?}", result.errors);
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 2);
}

#[tokio::test]
async fn disconnected_root_leaves_other_roots_resolvable() {
    let dir = tempfile::tempdir().unwrap();
    let connected = dir.path().join("connected.wav");
    let removable_root = dir.path().join("removable-drive");
    std::fs::create_dir_all(&removable_root).unwrap();
    let disconnected = removable_root.join("disconnected.wav");
    write_wav(&connected, "Connected", "Artist");
    write_wav(&disconnected, "Disconnected", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![connected.clone(), disconnected.clone()]).await;
    let page = list(&pool, "", 0).await.unwrap();
    let connected_id = page
        .tracks
        .iter()
        .find(|track| track.title == "Connected")
        .unwrap()
        .id
        .clone();
    let disconnected_id = page
        .tracks
        .iter()
        .find(|track| track.title == "Disconnected")
        .unwrap()
        .id
        .clone();

    // Simulate the removable drive going away: only that root's file
    // resolves as unavailable; the rest of the catalog is unaffected.
    std::fs::remove_dir_all(&removable_root).unwrap();
    assert!(resolve_path(&pool, &connected_id).await.is_ok());
    assert!(resolve_path(&pool, &disconnected_id).await.is_err());
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 2);
}

/// Inserts synthetic rows directly (no decode) — a generated metadata
/// fixture for scale, not a real-audio fixture like the ones above.
async fn seed_generated_rows(pool: &SqlitePool, count: usize) {
    let mut tx = pool.begin().await.unwrap();
    for i in 0..count {
        sqlx::query(
            "INSERT INTO library_tracks (id,path,title,artist,album,format,duration,sample_rate,channels,bits_per_sample,size_bytes) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        )
        .bind(format!("gen-{i}"))
        .bind(format!("/fixtures/gen/track-{i:06}.flac"))
        .bind(format!("Generated Track {i:06}"))
        .bind(format!("Generated Artist {}", i % 250))
        .bind(format!("Generated Album {}", i % 40))
        .bind("flac")
        .bind(180.0_f64)
        .bind(44100_i64)
        .bind(2_i64)
        .bind(Some(16_i64))
        .bind(1_000_000_i64)
        .execute(&mut *tx)
        .await
        .unwrap();
    }
    tx.commit().await.unwrap();
}

#[tokio::test]
async fn paginates_and_searches_1k_generated_rows() {
    let pool = pool().await;
    seed_generated_rows(&pool, 1_000).await;

    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!(page.total, 1_000);
    assert_eq!(page.tracks.len(), 100, "list() pages at 100 rows");

    // Titles are zero-padded per-row ("Generated Track 000007"), so this
    // substring is unambiguous — unlike artist/album, which repeat every
    // 250/40 rows and would need modular arithmetic to hand-count.
    let filtered = list(&pool, "000007", 0).await.unwrap();
    assert_eq!(filtered.total, 1);
    assert_eq!(filtered.tracks[0].title, "Generated Track 000007");
}

#[tokio::test]
async fn paginates_10k_generated_rows() {
    let pool = pool().await;
    seed_generated_rows(&pool, 10_000).await;

    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!(page.total, 10_000);

    let last_page = list(&pool, "", 9_900).await.unwrap();
    assert_eq!(last_page.tracks.len(), 100);
}

/// 100k-row fixture: real, deterministic, and exercised on demand rather
/// than on every `cargo test` run — matches the plan's "generated metadata
/// fixtures at 1k/10k/100k rows" without adding ~100k-row insert latency to
/// the default test suite. Run explicitly with:
/// `cargo test --package tahti-player -- --ignored paginates_100k_generated_rows`
#[tokio::test]
#[ignore = "100k-row insert is slow; run explicitly, not on every `cargo test`"]
async fn paginates_100k_generated_rows() {
    let pool = pool().await;
    seed_generated_rows(&pool, 100_000).await;

    let started = std::time::Instant::now();
    let page = list(&pool, "", 0).await.unwrap();
    let browse = started.elapsed();
    assert_eq!(page.total, 100_000);

    let started = std::time::Instant::now();
    let found = list(&pool, "Track 099999", 0).await.unwrap();
    let search = started.elapsed();
    assert_eq!(found.total, 1);

    let mut facet_times = Vec::new();
    for kind in [FacetKind::Artists, FacetKind::Albums, FacetKind::Genres, FacetKind::Folders] {
        let started = std::time::Instant::now();
        let groups = facets(&pool, kind).await.unwrap();
        facet_times.push((kind, groups.len(), started.elapsed()));
    }
    let started = std::time::Instant::now();
    let artist_filter = FacetFilter { kind: FacetKind::Artists, value: "Generated Artist 007".into(), secondary: None };
    let filtered = list_filtered(&pool, "", Some(&artist_filter), None, 0).await.unwrap();
    let filter_time = started.elapsed();
    let mut sort_times = Vec::new();
    for column in ALL_SORTS {
        let sort = TrackSort { column, descending: false };
        let started = std::time::Instant::now();
        list_filtered(&pool, "", None, Some(&sort), 0).await.unwrap();
        list_filtered(&pool, "", None, Some(&sort), 50_000).await.unwrap();
        sort_times.push((column, started.elapsed()));
    }
    eprintln!("100k sorts (first page + page 500): {sort_times:?}");
    for (column, took) in &sort_times {
        assert!(took.as_millis() < 1500, "{column:?} sort took {took:?}");
    }
    eprintln!("100k rows: first page {browse:?}, indexed search {search:?}, facets {facet_times:?}, filtered page ({} rows) {filter_time:?}", filtered.total);
    for (kind, _, took) in &facet_times {
        assert!(took.as_millis() < 1500, "{kind:?} facets took {took:?}");
    }
    // Generous ceilings (debug build, shared CI); the point is "not a scan".
    assert!(browse.as_millis() < 500, "browse took {browse:?}");
    assert!(search.as_millis() < 250, "search took {search:?}");
}

// --- Indexed search (FTS5 trigram) ---

#[tokio::test]
async fn search_matches_substrings_case_insensitively_via_the_index() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "Harbour Lights", "Vladislav Delay");
    let pool = pool().await;
    import_paths(&pool, vec![path]).await;

    assert_eq!(list(&pool, "arbour", 0).await.unwrap().total, 1);
    assert_eq!(list(&pool, "VLADIS", 0).await.unwrap().total, 1);
    assert_eq!(list(&pool, "harbour delay", 0).await.unwrap().total, 1, "terms AND across columns");
    assert_eq!(list(&pool, "harbour nothing", 0).await.unwrap().total, 0);
    // Short terms fall back to the LIKE scan and still match.
    assert_eq!(list(&pool, "Vl", 0).await.unwrap().total, 1);
}

#[tokio::test]
async fn search_index_follows_updates_and_deletes() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "Before Title", "Artist");
    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    assert_eq!(list(&pool, "Before", 0).await.unwrap().total, 1);

    // Re-import with new tags upserts the row; the index must follow.
    write_wav(&path, "After Title", "Artist");
    import_paths(&pool, vec![path]).await;
    assert_eq!(list(&pool, "Before", 0).await.unwrap().total, 0);
    assert_eq!(list(&pool, "After", 0).await.unwrap().total, 1);

    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    remove(&pool, &id).await.unwrap();
    assert_eq!(list(&pool, "After", 0).await.unwrap().total, 0);
}

#[tokio::test]
async fn search_survives_fts_syntax_in_user_input() {
    let pool = pool().await;
    seed_generated_rows(&pool, 10).await;
    for query in ["\"quoted\"", "a OR b NOT c", "title:foo*", "(((", "\"\"\""] {
        assert!(list(&pool, query, 0).await.is_ok(), "query {query:?} must not error");
    }
}

// --- Library roots ---

async fn import_into_root(pool: &SqlitePool, root_id: &str, paths: Vec<std::path::PathBuf>) -> ImportResult {
    let mut result = ImportResult::default();
    import_batch(pool, paths, Some(root_id), &mut result).await;
    result
}

#[tokio::test]
async fn add_root_is_idempotent_and_reports_counts() {
    let dir = tempfile::tempdir().unwrap();
    write_wav(&dir.path().join("a.wav"), "A", "Artist");
    let pool = pool().await;

    let first = add_root(&pool, dir.path()).await.unwrap();
    let second = add_root(&pool, dir.path()).await.unwrap();
    assert_eq!(first.id, second.id);
    assert_eq!(list_roots(&pool).await.unwrap().len(), 1);
    assert!(first.available);
    assert_eq!(first.track_count, 0);

    let (fresh, _) = discover_new_paths(&pool, &first).await.unwrap();
    import_into_root(&pool, &first.id, fresh).await;
    assert_eq!(get_root(&pool, &first.id).await.unwrap().track_count, 1);
}

#[tokio::test]
async fn rescan_discovers_only_new_files() {
    let dir = tempfile::tempdir().unwrap();
    write_wav(&dir.path().join("a.wav"), "A", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();

    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    assert_eq!(fresh.len(), 1);
    import_into_root(&pool, &root.id, fresh).await;

    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    assert!(fresh.is_empty(), "second scan with no changes finds nothing (idempotent)");

    let nested = dir.path().join("New Album");
    std::fs::create_dir_all(&nested).unwrap();
    write_wav(&nested.join("b.wav"), "B", "Artist");
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    assert_eq!(fresh.len(), 1, "only the newly added file is discovered");
}

#[tokio::test]
async fn ad_hoc_imports_under_a_root_are_adopted_on_scan() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("a.wav");
    write_wav(&path, "A", "Artist");
    let pool = pool().await;
    import_paths(&pool, vec![path]).await; // root_id NULL

    let root = add_root(&pool, dir.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    assert_eq!(fresh.len(), 1, "not yet a member, so re-read once");
    import_into_root(&pool, &root.id, fresh).await;

    assert_eq!(list(&pool, "", 0).await.unwrap().total, 1, "adopted, not duplicated");
    assert_eq!(get_root(&pool, &root.id).await.unwrap().track_count, 1);
}

#[tokio::test]
async fn root_availability_tracks_missing_and_recovered_files() {
    let dir = tempfile::tempdir().unwrap();
    let a = dir.path().join("a.wav");
    let b = dir.path().join("b.wav");
    write_wav(&a, "A", "Artist");
    write_wav(&b, "B", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;

    assert_eq!(refresh_root_availability(&pool, &root.id).await.unwrap(), (0, 0));

    let stash = dir.path().join("b.wav.bak");
    std::fs::rename(&b, &stash).unwrap();
    assert_eq!(refresh_root_availability(&pool, &root.id).await.unwrap(), (1, 0));
    assert_eq!(get_root(&pool, &root.id).await.unwrap().missing_count, 1);
    assert_eq!(list_unavailable(&pool).await.unwrap().len(), 1);
    assert_eq!(refresh_root_availability(&pool, &root.id).await.unwrap(), (0, 0), "no repeat flapping");

    std::fs::rename(&stash, &b).unwrap();
    assert_eq!(refresh_root_availability(&pool, &root.id).await.unwrap(), (0, 1));
    assert_eq!(get_root(&pool, &root.id).await.unwrap().missing_count, 0);
}

#[tokio::test]
async fn removing_a_root_keeps_its_tracks() {
    let dir = tempfile::tempdir().unwrap();
    write_wav(&dir.path().join("a.wav"), "A", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;

    remove_root(&pool, &root.id).await.unwrap();

    assert!(list_roots(&pool).await.unwrap().is_empty());
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 1);
    assert!(get_root(&pool, &root.id).await.is_err());
}

#[tokio::test]
async fn relinking_a_root_moves_proven_tracks_and_keeps_ids() {
    let old = tempfile::tempdir().unwrap();
    std::fs::create_dir_all(old.path().join("Album")).unwrap();
    write_wav(&old.path().join("Album/one.wav"), "One", "Artist");
    write_wav(&old.path().join("two.wav"), "Two", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, old.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;
    let ids_before: Vec<String> = list(&pool, "", 0).await.unwrap().tracks.into_iter().map(|t| t.id).collect();

    // The drive "moves": same layout at a new location; one file is missing there.
    let new = tempfile::tempdir().unwrap();
    std::fs::create_dir_all(new.path().join("Album")).unwrap();
    std::fs::copy(old.path().join("Album/one.wav"), new.path().join("Album/one.wav")).unwrap();
    std::fs::remove_dir_all(old.path().join("Album")).unwrap();
    std::fs::remove_file(old.path().join("two.wav")).unwrap();

    let result = relink_root(&pool, &root.id, new.path()).await.unwrap();

    assert_eq!(result.relinked, 1);
    assert_eq!(result.unmatched, 1);
    assert!(result.root.path.starts_with(new.path().canonicalize().unwrap().to_str().unwrap()));
    let after = list(&pool, "", 0).await.unwrap().tracks;
    let ids_after: Vec<String> = after.iter().map(|t| t.id.clone()).collect();
    assert_eq!(ids_before.len(), ids_after.len());
    let one = after.iter().find(|t| t.title == "One").unwrap();
    assert!(one.available);
    assert!(one.path.starts_with(new.path().canonicalize().unwrap().to_str().unwrap()));
}

#[tokio::test]
async fn relinking_to_a_folder_with_no_matching_files_is_rejected() {
    let old = tempfile::tempdir().unwrap();
    write_wav(&old.path().join("a.wav"), "A", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, old.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;

    let wrong = tempfile::tempdir().unwrap();
    let error = relink_root(&pool, &root.id, wrong.path()).await.unwrap_err();
    assert!(error.contains("None of this root"), "{error}");
    assert_eq!(get_root(&pool, &root.id).await.unwrap().path, root.path, "root unchanged");
}

#[tokio::test]
async fn relinking_onto_another_existing_root_is_rejected() {
    let a = tempfile::tempdir().unwrap();
    let b = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let root_a = add_root(&pool, a.path()).await.unwrap();
    add_root(&pool, b.path()).await.unwrap();
    assert!(relink_root(&pool, &root_a.id, b.path()).await.is_err());
}

#[tokio::test]
async fn extracts_rich_tags_bitrate_and_searches_them() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("rich.wav");
    write_wav_tagged(
        &path,
        &[
            ("INAM", "Huone"),
            ("IART", "Vladislav Delay"),
            ("IPRD", "Anima"),
            ("IGNR", "Dub Techno"),
            ("ICMT", "Recorded in Helsinki"),
            ("ICRD", "2001-05-14"),
            ("IPRT", "3/9"),
        ],
    );
    let pool = pool().await;
    let result = import_paths(&pool, vec![path]).await;
    assert_eq!(result.imported, 1, "errors: {:?}", result.errors);

    let track = list(&pool, "", 0).await.unwrap().tracks.remove(0);
    assert_eq!(track.album, "Anima");
    assert_eq!(track.genre, "Dub Techno");
    assert_eq!(track.comment, "Recorded in Helsinki");
    assert_eq!(track.year, Some(2001));
    assert_eq!(track.track_no, Some(3));
    assert!(track.bitrate_kbps.unwrap_or(0) > 0, "bitrate derived from size and duration");

    assert_eq!(list(&pool, "dub tech", 0).await.unwrap().total, 1, "genre is searchable");
    assert_eq!(list(&pool, "helsinki", 0).await.unwrap().total, 1, "comment is searchable");
}

#[tokio::test]
async fn untagged_files_keep_unknown_values_empty_not_guessed() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("plain.wav");
    write_wav_untagged(&path);
    let pool = pool().await;
    import_paths(&pool, vec![path]).await;

    let track = list(&pool, "", 0).await.unwrap().tracks.remove(0);
    assert_eq!(track.artist, "");
    assert_eq!(track.album_artist, "");
    assert_eq!(track.genre, "");
    assert_eq!((track.year, track.track_no, track.disc_no), (None, None, None));
}

// --- Browse facets ---

async fn browse_fixture() -> (tempfile::TempDir, SqlitePool) {
    let dir = tempfile::tempdir().unwrap();
    let a = dir.path().join("Anima");
    let b = dir.path().join("Loose");
    std::fs::create_dir_all(&a).unwrap();
    std::fs::create_dir_all(&b).unwrap();
    // Two tracks of one album (artist differs by case), one compilation
    // track whose album artist overrides its artist, one untagged-genre loose file.
    write_wav_tagged(&a.join("1.wav"), &[("INAM", "One"), ("IART", "Vladislav Delay"), ("IPRD", "Anima"), ("IGNR", "Dub Techno"), ("ICRD", "2001")]);
    write_wav_tagged(&a.join("2.wav"), &[("INAM", "Two"), ("IART", "VLADISLAV DELAY"), ("IPRD", "Anima"), ("IGNR", "dub techno"), ("ICRD", "2001")]);
    write_wav_tagged(&b.join("3.wav"), &[("INAM", "Three"), ("IART", "Guest"), ("IPRD", "Anima"), ("IGNR", "Ambient")]);
    write_wav_tagged(&b.join("4.wav"), &[("INAM", "Four"), ("IART", "Solo")]);
    let pool = pool().await;
    let paths = ["Anima/1.wav", "Anima/2.wav", "Loose/3.wav", "Loose/4.wav"]
        .map(|p| dir.path().join(p))
        .to_vec();
    let result = import_paths(&pool, paths).await;
    assert_eq!(result.imported, 4, "{:?}", result.errors);
    (dir, pool)
}

#[test]
fn folder_of_keeps_the_trailing_separator_in_either_style() {
    assert_eq!(folder_of("/music/a/b.flac"), "/music/a/");
    assert_eq!(folder_of("C:\\music\\a\\b.flac"), "C:\\music\\a\\");
    assert_eq!(folder_of("bare.flac"), "");
}

#[tokio::test]
async fn facets_group_artists_case_insensitively_with_totals() {
    let (_dir, pool) = browse_fixture().await;
    let artists = facets(&pool, FacetKind::Artists).await.unwrap();
    let names: Vec<&str> = artists.iter().map(|g| g.name.as_str()).collect();
    assert_eq!(names.len(), 3, "{names:?}");
    let delay = artists.iter().find(|g| g.name.eq_ignore_ascii_case("vladislav delay")).unwrap();
    assert_eq!(delay.track_count, 2);
    assert!(delay.size_bytes > 0 && delay.duration_sec > 0.0);

    let all = totals(&pool).await.unwrap();
    assert_eq!(all.track_count, 4);
    assert_eq!(all.size_bytes, artists.iter().map(|g| g.size_bytes).sum::<i64>());
}

#[tokio::test]
async fn facets_cover_albums_genres_and_folders() {
    let (_dir, pool) = browse_fixture().await;
    let albums = facets(&pool, FacetKind::Albums).await.unwrap();
    let anima: Vec<_> = albums.iter().filter(|g| g.name == "Anima").collect();
    assert_eq!(anima.len(), 2, "same album name under different artists stays separate");
    assert!(anima.iter().any(|g| g.track_count == 2 && g.year == Some(2001)));

    let genres = facets(&pool, FacetKind::Genres).await.unwrap();
    let dub = genres.iter().find(|g| g.name.eq_ignore_ascii_case("dub techno")).unwrap();
    assert_eq!(dub.track_count, 2, "genre grouping ignores case");
    assert!(genres.iter().any(|g| g.name.is_empty()), "untagged tracks form an unknown group");

    let folders = facets(&pool, FacetKind::Folders).await.unwrap();
    assert_eq!(folders.len(), 2);
    assert!(folders.iter().all(|g| g.name.ends_with('/') || g.name.ends_with('\\')));
}

#[tokio::test]
async fn list_filtered_narrows_by_each_facet_and_combines_with_search() {
    let (_dir, pool) = browse_fixture().await;
    let artist = FacetFilter { kind: FacetKind::Artists, value: "vladislav delay".into(), secondary: None };
    assert_eq!(list_filtered(&pool, "", Some(&artist), None, 0).await.unwrap().total, 2);
    assert_eq!(list_filtered(&pool, "Two", Some(&artist), None, 0).await.unwrap().total, 1);
    assert_eq!(list_filtered(&pool, "Three", Some(&artist), None, 0).await.unwrap().total, 0);

    let album = FacetFilter { kind: FacetKind::Albums, value: "Anima".into(), secondary: Some("Guest".into()) };
    let page = list_filtered(&pool, "", Some(&album), None, 0).await.unwrap();
    assert_eq!((page.total, page.tracks[0].title.as_str()), (1, "Three"));

    let genre = FacetFilter { kind: FacetKind::Genres, value: "Ambient".into(), secondary: None };
    assert_eq!(list_filtered(&pool, "", Some(&genre), None, 0).await.unwrap().total, 1);
    let unknown = FacetFilter { kind: FacetKind::Genres, value: String::new(), secondary: None };
    assert_eq!(list_filtered(&pool, "", Some(&unknown), None, 0).await.unwrap().total, 1);

    let folder = facets(&pool, FacetKind::Folders).await.unwrap().remove(0).name;
    let in_folder = FacetFilter { kind: FacetKind::Folders, value: folder, secondary: None };
    assert_eq!(list_filtered(&pool, "", Some(&in_folder), None, 0).await.unwrap().total, 2);
}

#[tokio::test]
async fn folder_follows_a_root_relink() {
    let old = tempfile::tempdir().unwrap();
    std::fs::create_dir_all(old.path().join("Album")).unwrap();
    write_wav(&old.path().join("Album/one.wav"), "One", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, old.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;

    let new = tempfile::tempdir().unwrap();
    std::fs::create_dir_all(new.path().join("Album")).unwrap();
    std::fs::copy(old.path().join("Album/one.wav"), new.path().join("Album/one.wav")).unwrap();
    relink_root(&pool, &root.id, new.path()).await.unwrap();

    let folders = facets(&pool, FacetKind::Folders).await.unwrap();
    assert_eq!(folders.len(), 1);
    assert!(folders[0].name.starts_with(new.path().canonicalize().unwrap().to_str().unwrap()));
}

// --- Sorting ---

const ALL_SORTS: [SortColumn; 11] = [
    SortColumn::Title,
    SortColumn::Artist,
    SortColumn::Album,
    SortColumn::Genre,
    SortColumn::Year,
    SortColumn::TrackNo,
    SortColumn::Duration,
    SortColumn::Format,
    SortColumn::Size,
    SortColumn::Bitrate,
    SortColumn::Added,
];

#[tokio::test]
async fn every_sort_column_runs_in_both_directions() {
    let (_dir, pool) = browse_fixture().await;
    for column in ALL_SORTS {
        for descending in [false, true] {
            let sort = TrackSort { column, descending };
            let page = list_filtered(&pool, "", None, Some(&sort), 0).await;
            assert_eq!(page.unwrap().total, 4, "{column:?} desc={descending}");
        }
    }
}

#[tokio::test]
async fn sorting_puts_blank_values_last_in_both_directions() {
    let (_dir, pool) = browse_fixture().await;
    // Genres: two "dub techno", "Ambient", and one blank (Solo).
    for descending in [false, true] {
        let sort = TrackSort { column: SortColumn::Genre, descending };
        let tracks = list_filtered(&pool, "", None, Some(&sort), 0).await.unwrap().tracks;
        assert_eq!(tracks.last().unwrap().title, "Four", "desc={descending}");
    }
    let asc = TrackSort { column: SortColumn::Genre, descending: false };
    let titles: Vec<String> = list_filtered(&pool, "", None, Some(&asc), 0).await.unwrap().tracks.into_iter().map(|t| t.title).collect();
    assert_eq!(titles[0], "Three", "Ambient sorts before Dub Techno");
    // Year: 2001 twice, NULL twice.
    for descending in [false, true] {
        let sort = TrackSort { column: SortColumn::Year, descending };
        let tracks = list_filtered(&pool, "", None, Some(&sort), 0).await.unwrap().tracks;
        assert!(tracks[0].year.is_some() && tracks[3].year.is_none(), "desc={descending}");
    }
}

#[tokio::test]
async fn descending_reverses_the_primary_order() {
    let (_dir, pool) = browse_fixture().await;
    let by = |descending| TrackSort { column: SortColumn::Title, descending };
    let asc: Vec<String> = list_filtered(&pool, "", None, Some(&by(false)), 0).await.unwrap().tracks.into_iter().map(|t| t.title).collect();
    let mut desc: Vec<String> = list_filtered(&pool, "", None, Some(&by(true)), 0).await.unwrap().tracks.into_iter().map(|t| t.title).collect();
    desc.reverse();
    assert_eq!(asc, desc);
}

#[tokio::test]
async fn paging_a_sort_with_many_ties_neither_repeats_nor_skips_rows() {
    let pool = pool().await;
    seed_generated_rows(&pool, 450).await; // artists repeat every 250 rows, albums every 40
    for column in [SortColumn::Artist, SortColumn::Album, SortColumn::Format, SortColumn::Year] {
        for descending in [false, true] {
            let sort = TrackSort { column, descending };
            let mut seen = std::collections::HashSet::new();
            let mut offset = 0;
            loop {
                let page = list_filtered(&pool, "", None, Some(&sort), offset).await.unwrap();
                if page.tracks.is_empty() {
                    break;
                }
                offset += page.tracks.len() as i64;
                for track in page.tracks {
                    assert!(seen.insert(track.id), "{column:?} repeated a row");
                }
            }
            assert_eq!(seen.len(), 450, "{column:?} desc={descending} skipped rows");
        }
    }
}

// --- Select all across pages / playback batches ---

#[tokio::test]
async fn matching_ids_follow_the_exact_paging_order_for_any_sort_search_and_filter() {
    let pool = pool().await;
    seed_generated_rows(&pool, 450).await;
    let artist = FacetFilter { kind: FacetKind::Artists, value: "Generated Artist 007".into(), secondary: None };
    let cases: [(&str, Option<&FacetFilter>, Option<TrackSort>); 4] = [
        ("", None, None),
        ("Track 00", None, Some(TrackSort { column: SortColumn::Artist, descending: true })),
        ("", Some(&artist), Some(TrackSort { column: SortColumn::Album, descending: false })),
        ("Generated", None, Some(TrackSort { column: SortColumn::Size, descending: true })),
    ];
    for (search, filter, sort) in cases {
        let ids = matching_ids(&pool, search, filter, sort.as_ref()).await.unwrap();
        let mut paged = Vec::new();
        let mut offset = 0;
        loop {
            let page = list_filtered(&pool, search, filter, sort.as_ref(), offset).await.unwrap();
            if page.tracks.is_empty() {
                break;
            }
            offset += page.tracks.len() as i64;
            paged.extend(page.tracks.into_iter().map(|t| t.id));
        }
        assert_eq!(ids, paged, "search={search:?} sort={sort:?}");
        assert_eq!(
            ids.len() as i64,
            list_filtered(&pool, search, filter, sort.as_ref(), 0).await.unwrap().total
        );
    }
}

#[tokio::test]
async fn prepare_playback_keeps_requested_order_and_skips_missing_files() {
    let dir = tempfile::tempdir().unwrap();
    let paths: Vec<_> = ["a", "b", "c"].iter().map(|n| dir.path().join(format!("{n}.wav"))).collect();
    for (path, title) in paths.iter().zip(["A", "B", "C"]) {
        write_wav(path, title, "Artist");
    }
    let pool = pool().await;
    import_paths(&pool, paths.clone()).await;
    let mut id_of = std::collections::HashMap::new();
    for track in list(&pool, "", 0).await.unwrap().tracks {
        id_of.insert(track.title.clone(), track.id);
    }
    let (a, b, c) = (id_of["A"].clone(), id_of["B"].clone(), id_of["C"].clone());
    std::fs::remove_file(&paths[1]).unwrap();

    let ids = vec![c.clone(), b.clone(), "no-such-id".to_string(), a.clone()];
    let batch = prepare_playback(&pool, &ids).await.unwrap();

    let titles: Vec<&str> = batch.items.iter().map(|i| i.track.title.as_str()).collect();
    assert_eq!(titles, ["C", "A"], "requested order, missing and unknown skipped");
    assert_eq!(batch.unavailable, 1);
    assert!(batch.items.iter().all(|i| std::path::Path::new(&i.path).is_file()));
    let all = list(&pool, "", 0).await.unwrap().tracks;
    let missing = all.iter().find(|t| t.id == b).unwrap();
    assert!(!missing.available, "missing state persisted");
}

#[tokio::test]
async fn prepare_playback_handles_more_ids_than_one_sql_chunk() {
    let pool = pool().await;
    seed_generated_rows(&pool, 1_200).await;
    let ids = matching_ids(&pool, "", None, None).await.unwrap();
    let batch = prepare_playback(&pool, &ids).await.unwrap();
    // Generated rows point at files that do not exist, so all are unavailable --
    // the point is that every chunk was read and accounted for.
    assert_eq!(batch.items.len() + batch.unavailable, 1_200);
}

#[tokio::test]
async fn remove_many_deletes_in_one_go_and_keeps_search_in_sync() {
    let pool = pool().await;
    seed_generated_rows(&pool, 1_200).await;
    let ids = matching_ids(&pool, "", None, None).await.unwrap();
    let doomed: Vec<String> = ids.iter().take(1_100).cloned().collect();

    let removed = remove_many(&pool, &doomed).await.unwrap();

    assert_eq!(removed, 1_100);
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 100);
    assert_eq!(remove_many(&pool, &doomed).await.unwrap(), 0, "already gone");
    assert_eq!(remove_many(&pool, &[]).await.unwrap(), 0);
    let kept = list(&pool, "Generated Track", 0).await.unwrap();
    assert_eq!(kept.total, 100, "search index followed the deletes");
}

// --- Range filters and the Phase 2 exit demo ---

/// Rows that vary in every filterable column: 3 formats, 35 years, 2 discs,
/// 12 track numbers, bitrates and durations, 10 folders.
async fn seed_varied_rows(pool: &SqlitePool, count: usize) {
    let mut tx = pool.begin().await.unwrap();
    for i in 0..count {
        let format = ["flac", "wav", "mp3"][i % 3];
        sqlx::query(
            "INSERT INTO library_tracks (id,path,title,artist,album,format,duration,sample_rate,channels,bits_per_sample,size_bytes,year,disc_no,track_no,bitrate_kbps,folder,genre) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        )
        .bind(format!("var-{i}"))
        .bind(format!("/fixtures/{}/track-{i:06}.{format}", i % 10))
        .bind(format!("Varied Track {i:06}"))
        .bind(format!("Varied Artist {}", i % 50))
        .bind(format!("Varied Album {}", i % 40))
        .bind(format)
        .bind(60.0_f64 + (i % 600) as f64)
        .bind(44100_i64)
        .bind(2_i64)
        .bind(Some(16_i64))
        .bind(1_000_000_i64 + i as i64)
        .bind(1990_i64 + (i % 35) as i64)
        .bind(1_i64 + (i % 2) as i64)
        .bind(1_i64 + (i % 12) as i64)
        .bind(128_i64 + (i % 20) as i64 * 64)
        .bind(format!("/fixtures/{}/", i % 10))
        .bind(["House", "Techno", "Ambient"][i % 3])
        .execute(&mut *tx)
        .await
        .unwrap();
    }
    tx.commit().await.unwrap();
}

async fn count_with(pool: &SqlitePool, filters: TrackFilters) -> i64 {
    let query = ListQuery { filters: Some(&filters), ..Default::default() };
    list_query(pool, &query, 0).await.unwrap().total
}

#[tokio::test]
async fn each_range_filter_restricts_and_unset_filters_do_not() {
    let pool = pool().await;
    seed_varied_rows(&pool, 700).await;
    let all = count_with(&pool, TrackFilters::default()).await;
    assert_eq!(all, 700);

    let years = count_with(&pool, TrackFilters { year_min: Some(2000), year_max: Some(2004), ..Default::default() }).await;
    assert_eq!(years, 700 / 35 * 5, "5 of 35 years");
    assert_eq!(count_with(&pool, TrackFilters { year_min: Some(2100), ..Default::default() }).await, 0);

    let long = count_with(&pool, TrackFilters { duration_min: Some(300.0), ..Default::default() }).await;
    let short = count_with(&pool, TrackFilters { duration_max: Some(299.9), ..Default::default() }).await;
    assert_eq!(long + short, 700);

    assert_eq!(count_with(&pool, TrackFilters { formats: vec!["FLAC".into()], ..Default::default() }).await, 234, "case-insensitive format");
    assert_eq!(count_with(&pool, TrackFilters { formats: vec!["flac".into(), "wav".into()], ..Default::default() }).await, 467);
    assert!(count_with(&pool, TrackFilters { bitrate_min: Some(1000), ..Default::default() }).await < all);
    assert_eq!(count_with(&pool, TrackFilters { added_since: Some("2000-01-01".into()), ..Default::default() }).await, all);
    assert_eq!(count_with(&pool, TrackFilters { added_since: Some("2999-01-01".into()), ..Default::default() }).await, 0);
    assert_eq!(count_with(&pool, TrackFilters { availability: Some(Availability::Available), ..Default::default() }).await, all);
    assert_eq!(count_with(&pool, TrackFilters { availability: Some(Availability::Missing), ..Default::default() }).await, 0);
    assert_eq!(count_with(&pool, TrackFilters { root_id: Some("nope".into()), ..Default::default() }).await, 0);
}

#[tokio::test]
async fn filters_combine_with_search_and_a_browse_group() {
    let pool = pool().await;
    seed_varied_rows(&pool, 700).await;
    let artist = FacetFilter { kind: FacetKind::Artists, value: "Varied Artist 7".into(), secondary: None };
    let filters = TrackFilters { formats: vec!["wav".into()], ..Default::default() };
    let query = ListQuery { search: "Varied Track", filter: Some(&artist), filters: Some(&filters), sort: None };
    let page = list_query(&pool, &query, 0).await.unwrap();
    assert!(page.total > 0);
    assert!(page.tracks.iter().all(|t| t.artist == "Varied Artist 7" && t.format == "wav"));
    let none = ListQuery { search: "no such text", ..query };
    assert_eq!(list_query(&pool, &none, 0).await.unwrap().total, 0);
}

#[tokio::test]
async fn filter_options_list_formats_and_year_span() {
    let pool = pool().await;
    assert_eq!(filter_options(&pool).await.unwrap().year_min, None);
    seed_varied_rows(&pool, 100).await;
    let options = filter_options(&pool).await.unwrap();
    assert_eq!(options.formats, ["flac", "mp3", "wav"]);
    assert_eq!((options.year_min, options.year_max), (Some(1990), Some(2024)));
}

/// Phase 2 exit demo on a 10k fixture: artist + format + year filters, sort by
/// album/disc/track, select all matches across pages, queue in displayed order.
#[tokio::test]
async fn exit_demo_filter_sort_select_all_in_displayed_order() {
    let pool = pool().await;
    seed_varied_rows(&pool, 10_000).await;
    let filter = FacetFilter { kind: FacetKind::Genres, value: "Techno".into(), secondary: None };
    let filters = TrackFilters {
        formats: vec!["wav".into(), "flac".into()],
        year_min: Some(2000),
        year_max: Some(2010),
        ..Default::default()
    };
    let sort = TrackSort { column: SortColumn::Album, descending: false };
    let query = ListQuery { search: "", filter: Some(&filter), filters: Some(&filters), sort: Some(&sort) };

    let ids = matching_ids_query(&pool, &query).await.unwrap();
    let first_page = list_query(&pool, &query, 0).await.unwrap();
    assert_eq!(ids.len() as i64, first_page.total, "select-all covers every page");
    assert!(ids.len() > 100, "spans several pages: {}", ids.len());

    // Displayed order: album, then disc, then track.
    let mut rows = Vec::new();
    let mut offset = 0;
    loop {
        let page = list_query(&pool, &query, offset).await.unwrap();
        if page.tracks.is_empty() {
            break;
        }
        offset += page.tracks.len() as i64;
        rows.extend(page.tracks);
    }
    assert_eq!(rows.iter().map(|t| t.id.clone()).collect::<Vec<_>>(), ids);
    let key = |t: &super::LibraryTrack| (t.album.to_lowercase(), t.disc_no, t.track_no);
    assert!(rows.windows(2).all(|w| key(&w[0]) <= key(&w[1])), "album/disc/track order");
    assert!(rows.iter().all(|t| t.genre == "Techno" && (2000..=2010).contains(&t.year.unwrap())));

    let batch = super::prepare_playback(&pool, &ids[..50]).await.unwrap();
    assert_eq!(batch.items.len() + batch.unavailable, 50);
}
