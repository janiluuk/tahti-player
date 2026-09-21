use std::sync::atomic::{AtomicU32, Ordering};

use sqlx::sqlite::{SqliteConnectOptions, SqlitePool};

use super::{
    add_root, collect_audio_paths, collect_audio_paths_with_skipped, discover_new_paths,
    get_root, import_batch, import_paths, list, list_roots, list_unavailable,
    refresh_root_availability, relink, relink_root, remove, remove_root, rescan_unavailable,
    resolve_path, facets, filter_options, list_query, matching_ids_query, folder_of, Availability, ListQuery, TrackFilters, remove_many, list_filtered, matching_ids, prepare_playback, SortColumn, TrackSort, totals, FacetFilter, FacetKind, ImportResult,
};

static DB_COUNTER: AtomicU32 = AtomicU32::new(0);

pub(super) async fn pool() -> SqlitePool {
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
pub(super) fn write_wav(path: &std::path::Path, title: &str, artist: &str) {
    write_wav_tagged(path, &[("INAM", title), ("IART", artist)]);
}

/// Same WAV with an arbitrary set of RIFF INFO tags.
pub(super) fn write_wav_tagged(path: &std::path::Path, tags: &[(&str, &str)]) {
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
    for column in [SortColumn::Artist, SortColumn::Album] {
        let sort = TrackSort { column, descending: true };
        let started = std::time::Instant::now();
        list_filtered(&pool, "", None, Some(&sort), 50_000).await.unwrap();
        let took = started.elapsed();
        eprintln!("100k {column:?} descending page 500: {took:?}");
        assert!(took.as_millis() < 100, "indexed {column:?} desc sort took {took:?}");
    }
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

// --- Local playlists (Phase 3) ---

use super::playlists::{
    add_tracks, create_playlist, delete_playlist, duplicate_playlist, entries_page, entry_ids,
    get_playlist, list_playlists, move_entries, playable_track_ids, remove_entries,
    rename_playlist, restore_entries, set_order,
};

async fn entry_titles(pool: &SqlitePool, playlist: &str) -> Vec<String> {
    let mut titles = Vec::new();
    let mut offset = 0;
    loop {
        let page = entries_page(pool, playlist, offset).await.unwrap();
        if page.entries.is_empty() {
            return titles;
        }
        offset += page.entries.len() as i64;
        titles.extend(page.entries.into_iter().map(|e| e.title));
    }
}

/// `n` seeded tracks with ids gen-0..gen-n and titles "Generated Track 00000i".
async fn playlist_pool(n: usize) -> SqlitePool {
    let pool = pool().await;
    seed_generated_rows(&pool, n).await;
    pool
}
fn gen_ids(range: std::ops::Range<usize>) -> Vec<String> {
    range.map(|i| format!("gen-{i}")).collect()
}
fn short(title: &str) -> usize {
    title.rsplit(' ').next().unwrap().parse().unwrap()
}

#[tokio::test]
async fn playlists_are_created_renamed_and_kept_unique_ignoring_case() {
    let pool = pool().await;
    let a = create_playlist(&pool, "  Night drive  ").await.unwrap();
    assert_eq!(a.name, "Night drive");
    assert!(create_playlist(&pool, "night DRIVE").await.unwrap_err().contains("already exists"));
    assert!(create_playlist(&pool, "   ").await.unwrap_err().contains("name"));
    let b = create_playlist(&pool, "Focus").await.unwrap();
    assert!(rename_playlist(&pool, &b.id, "NIGHT drive").await.unwrap_err().contains("already exists"));
    assert_eq!(rename_playlist(&pool, &b.id, "Deep focus").await.unwrap().name, "Deep focus");
    assert!(rename_playlist(&pool, "nope", "x").await.is_err());
    let names: Vec<String> = list_playlists(&pool).await.unwrap().into_iter().map(|p| p.name).collect();
    assert_eq!(names, ["Deep focus", "Night drive"]);
}

#[tokio::test]
async fn adding_keeps_order_allows_repeats_and_can_insert_at_an_index() {
    let pool = playlist_pool(10).await;
    let p = create_playlist(&pool, "P").await.unwrap();
    let added = add_tracks(&pool, &p.id, &["gen-3".into(), "gen-1".into(), "gen-3".into(), "missing".into()], None).await.unwrap();
    assert_eq!(added, 3, "unknown ids skipped, repeats kept");
    assert_eq!(entry_titles(&pool, &p.id).await.iter().map(|t| short(t)).collect::<Vec<_>>(), [3, 1, 3]);

    add_tracks(&pool, &p.id, &["gen-8".into(), "gen-9".into()], Some(1)).await.unwrap();
    assert_eq!(entry_titles(&pool, &p.id).await.iter().map(|t| short(t)).collect::<Vec<_>>(), [3, 8, 9, 1, 3]);

    let ids = entry_ids(&pool, &p.id).await.unwrap();
    assert_eq!(ids.len(), 5);
    assert_eq!(ids.iter().collect::<std::collections::HashSet<_>>().len(), 5, "each entry has its own id");
    let summary = get_playlist(&pool, &p.id).await.unwrap();
    assert_eq!(summary.track_count, 5);
    assert!((summary.duration_sec - 900.0).abs() < 0.001);
}

#[tokio::test]
async fn moving_entries_keeps_the_block_order_and_counts_among_unmoved() {
    let pool = playlist_pool(8).await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &gen_ids(0..8), None).await.unwrap();
    let ids = entry_ids(&pool, &p.id).await.unwrap();
    let order = |pool: &SqlitePool| {
        let id = p.id.clone();
        let pool = pool.clone();
        async move { entry_titles(&pool, &id).await.iter().map(|t| short(t)).collect::<Vec<_>>() }
    };

    // Move 1 and 2 (given out of order) to sit before the entry that is 4th among the rest.
    move_entries(&pool, &p.id, &[ids[2].clone(), ids[1].clone()], 4).await.unwrap();
    assert_eq!(order(&pool).await, [0, 3, 4, 5, 1, 2, 6, 7]);
    move_entries(&pool, &p.id, &[ids[7].clone()], 0).await.unwrap();
    assert_eq!(order(&pool).await, [7, 0, 3, 4, 5, 1, 2, 6]);
    move_entries(&pool, &p.id, &[ids[7].clone()], 99).await.unwrap();
    assert_eq!(order(&pool).await, [0, 3, 4, 5, 1, 2, 6, 7], "past the end clamps");
    move_entries(&pool, &p.id, &[], 0).await.unwrap();
    move_entries(&pool, &p.id, &["nope".into()], 0).await.unwrap();
    assert_eq!(order(&pool).await, [0, 3, 4, 5, 1, 2, 6, 7]);
}

#[tokio::test]
async fn removing_returns_the_entries_and_restoring_undoes_it_exactly() {
    let pool = playlist_pool(6).await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &["gen-0".into(), "gen-1".into(), "gen-1".into(), "gen-2".into(), "gen-3".into()], None).await.unwrap();
    let before = entry_ids(&pool, &p.id).await.unwrap();

    let removed = remove_entries(&pool, &p.id, &[before[1].clone(), before[3].clone()]).await.unwrap();
    assert_eq!(removed.iter().map(|r| r.entry_id.clone()).collect::<Vec<_>>(), [before[1].clone(), before[3].clone()]);
    assert_eq!(entry_titles(&pool, &p.id).await.iter().map(|t| short(t)).collect::<Vec<_>>(), [0, 1, 3]);

    restore_entries(&pool, &p.id, &removed, &before).await.unwrap();
    assert_eq!(entry_ids(&pool, &p.id).await.unwrap(), before, "same ids, same order");
    restore_entries(&pool, &p.id, &removed, &before).await.unwrap();
    assert_eq!(entry_ids(&pool, &p.id).await.unwrap(), before, "idempotent");
}

#[tokio::test]
async fn set_order_undoes_a_move() {
    let pool = playlist_pool(5).await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &gen_ids(0..5), None).await.unwrap();
    let before = entry_ids(&pool, &p.id).await.unwrap();
    move_entries(&pool, &p.id, &[before[4].clone()], 0).await.unwrap();
    assert_ne!(entry_ids(&pool, &p.id).await.unwrap(), before);
    set_order(&pool, &p.id, &before).await.unwrap();
    assert_eq!(entry_ids(&pool, &p.id).await.unwrap(), before);
}

#[tokio::test]
async fn duplicating_copies_order_and_repeats_with_new_ids_and_unique_names() {
    let pool = playlist_pool(4).await;
    let p = create_playlist(&pool, "Mix").await.unwrap();
    add_tracks(&pool, &p.id, &["gen-2".into(), "gen-0".into(), "gen-2".into()], None).await.unwrap();

    let copy = duplicate_playlist(&pool, &p.id).await.unwrap();
    let copy2 = duplicate_playlist(&pool, &p.id).await.unwrap();
    assert_eq!((copy.name.as_str(), copy2.name.as_str()), ("Mix copy", "Mix copy 2"));
    assert_eq!(entry_titles(&pool, &copy.id).await, entry_titles(&pool, &p.id).await);
    let originals = entry_ids(&pool, &p.id).await.unwrap();
    assert!(entry_ids(&pool, &copy.id).await.unwrap().iter().all(|id| !originals.contains(id)));
    delete_playlist(&pool, &copy.id).await.unwrap();
    assert_eq!(entry_titles(&pool, &p.id).await.len(), 3, "deleting the copy leaves the original");
}

#[tokio::test]
async fn deleting_a_track_keeps_its_entries_visibly_unavailable_and_reimport_relinks_them() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("keep.wav");
    write_wav(&path, "Keep me", "Artist");
    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &[id.clone(), id.clone()], None).await.unwrap();

    remove(&pool, &id).await.unwrap();
    let page = entries_page(&pool, &p.id, 1).await.unwrap(); // offset > 0: no relink pass
    assert_eq!(page.total, 2, "entries survive the track");
    assert!(page.entries.iter().all(|e| e.unavailable && e.track.is_none() && e.title == "Keep me"));
    assert_eq!(get_playlist(&pool, &p.id).await.unwrap().unavailable_count, 2);
    assert!(playable_track_ids(&pool, &p.id).await.unwrap().is_empty());

    import_paths(&pool, vec![path]).await; // same file comes back with a new track id
    let page = entries_page(&pool, &p.id, 0).await.unwrap();
    assert!(page.entries.iter().all(|e| !e.unavailable && e.track.is_some()), "relinked by path");
    assert_eq!(playable_track_ids(&pool, &p.id).await.unwrap().len(), 2);
}

#[tokio::test]
async fn missing_files_count_as_unavailable_but_keep_their_place() {
    let pool = playlist_pool(3).await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &gen_ids(0..3), None).await.unwrap();
    sqlx::query("UPDATE library_tracks SET available = 0 WHERE id = 'gen-1'").execute(&pool).await.unwrap();

    let page = entries_page(&pool, &p.id, 0).await.unwrap();
    assert_eq!(page.entries.iter().map(|e| e.unavailable).collect::<Vec<_>>(), [false, true, false]);
    assert_eq!(get_playlist(&pool, &p.id).await.unwrap().unavailable_count, 1);
    assert_eq!(playable_track_ids(&pool, &p.id).await.unwrap().len(), 3, "playback prep decides, entries stay");
}

#[tokio::test]
async fn relinking_a_track_keeps_playlist_membership() {
    let old = tempfile::tempdir().unwrap();
    let new = tempfile::tempdir().unwrap();
    let from = old.path().join("a.wav");
    let to = new.path().join("a.wav");
    write_wav(&from, "Moved", "Artist");
    std::fs::copy(&from, &to).unwrap();
    let pool = pool().await;
    import_paths(&pool, vec![from.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &[id.clone()], None).await.unwrap();
    std::fs::remove_file(&from).unwrap();

    relink(&pool, &id, to.clone()).await.unwrap();

    let page = entries_page(&pool, &p.id, 0).await.unwrap();
    assert_eq!(page.entries[0].track.as_ref().unwrap().id, id);
    assert!(page.entries[0].path.ends_with("a.wav") && !page.entries[0].unavailable);
}

#[tokio::test]
async fn deleting_a_playlist_removes_its_entries_but_never_tracks() {
    let pool = playlist_pool(3).await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &gen_ids(0..3), None).await.unwrap();
    delete_playlist(&pool, &p.id).await.unwrap();
    assert_eq!(sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM library_playlist_entries").fetch_one(&pool).await.unwrap(), 0);
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 3);
    assert!(get_playlist(&pool, &p.id).await.is_err());
}

#[tokio::test]
async fn long_playlists_page_in_order_without_gaps() {
    let pool = playlist_pool(450).await;
    let p = create_playlist(&pool, "Big").await.unwrap();
    add_tracks(&pool, &p.id, &gen_ids(0..450), None).await.unwrap();
    let ids = entry_ids(&pool, &p.id).await.unwrap();
    move_entries(&pool, &p.id, &[ids[449].clone()], 0).await.unwrap();
    let titles = entry_titles(&pool, &p.id).await;
    assert_eq!(titles.len(), 450);
    assert_eq!(short(&titles[0]), 449);
    assert_eq!(short(&titles[1]), 0);
    let first = entries_page(&pool, &p.id, 0).await.unwrap();
    assert_eq!((first.entries.len(), first.total, first.entries[0].position), (200, 450, 0));
}

/// Phase 3 exit demo, first half: a 50-track playlist from filtered results,
/// reordered, order and repeats intact.
#[tokio::test]
async fn exit_demo_fifty_tracks_from_filtered_results_reordered() {
    let pool = pool().await;
    seed_varied_rows(&pool, 2_000).await;
    let filters = TrackFilters { formats: vec!["flac".into()], year_min: Some(2000), year_max: Some(2005), ..Default::default() };
    let query = ListQuery { filters: Some(&filters), sort: Some(&TrackSort { column: SortColumn::Album, descending: false }), ..Default::default() };
    let ids: Vec<String> = matching_ids_query(&pool, &query).await.unwrap().into_iter().take(50).collect();
    assert_eq!(ids.len(), 50);

    let p = create_playlist(&pool, "From filters").await.unwrap();
    assert_eq!(add_tracks(&pool, &p.id, &ids, None).await.unwrap(), 50);
    let entries = entry_ids(&pool, &p.id).await.unwrap();
    move_entries(&pool, &p.id, &entries[40..45].to_vec(), 0).await.unwrap();
    move_entries(&pool, &p.id, &[entries[0].clone()], 49).await.unwrap();

    let page = entries_page(&pool, &p.id, 0).await.unwrap();
    assert_eq!(page.total, 50);
    let tracks: Vec<String> = page.entries.iter().map(|e| e.track.as_ref().unwrap().id.clone()).collect();
    assert_eq!(tracks[..5], ids[40..45]);
    assert_eq!(tracks[49], ids[0]);
    assert_eq!(playable_track_ids(&pool, &p.id).await.unwrap(), tracks);
}

// --- M3U / M3U8 (Phase 3) ---

use super::m3u::{
    commit_import, export_playlist, format_m3u, parse_m3u, preview_import, relative_path,
    relink_entry, EntryStatus, ExportEntry, ExportStyle,
};
use std::path::{Path, PathBuf};

#[test]
fn parses_extinf_names_comments_and_blank_lines() {
    let text = "\u{feff}#EXTM3U\r\n#PLAYLIST:Night drive\r\n\r\n#EXTINF:215,Vladislav Delay - Huone\r\n/music/a.flac\r\n# just a comment\r\n#EXTINF:-1,No artist here\r\n/music/b.flac\r\n/music/c.flac\r\n";
    let parsed = parse_m3u(text.as_bytes(), Path::new("/lists"));
    assert_eq!(parsed.name.as_deref(), Some("Night drive"));
    assert_eq!(parsed.entries.len(), 3);
    let first = &parsed.entries[0];
    assert_eq!((first.artist.as_deref(), first.title.as_deref(), first.duration), (Some("Vladislav Delay"), Some("Huone"), Some(215.0)));
    assert_eq!(first.path, PathBuf::from("/music/a.flac"));
    let second = &parsed.entries[1];
    assert_eq!((second.artist.as_deref(), second.title.as_deref(), second.duration), (None, Some("No artist here"), None), "negative length ignored");
    assert_eq!(parsed.entries[2].title, None, "EXTINF applies to one line only");
    assert_eq!(parsed.entries[2].line, 9);
}

#[test]
fn resolves_relative_file_url_windows_and_remote_lines() {
    let text = "songs/a.flac\n../other/b.flac\n./c.flac\nfile:///music/My%20Songs/d.flac\nC:\\Music\\e.flac\nhttps://radio.example/stream\n";
    let parsed = parse_m3u(text.as_bytes(), Path::new("/lists/mine"));
    let paths: Vec<String> = parsed.entries.iter().map(|e| e.path.to_string_lossy().replace('\\', "/")).collect();
    assert_eq!(paths[0], "/lists/mine/songs/a.flac");
    assert_eq!(paths[1], "/lists/other/b.flac");
    assert_eq!(paths[2], "/lists/mine/c.flac");
    assert_eq!(paths[3], "/music/My Songs/d.flac");
    assert!(paths[4].ends_with("C:/Music/e.flac"), "{}", paths[4]);
    assert!(parsed.entries[5].remote && !parsed.entries[0].remote);
}

#[test]
fn falls_back_to_latin1_for_old_m3u_files() {
    let bytes = b"#EXTM3U\n#EXTINF:10,Caf\xe9\n/music/caf\xe9.flac\n";
    let parsed = parse_m3u(bytes, Path::new("/"));
    assert_eq!(parsed.entries[0].title.as_deref(), Some("Caf\u{e9}"));
    assert_eq!(parsed.entries[0].path, PathBuf::from("/music/caf\u{e9}.flac"));
}

#[test]
fn relative_paths_use_dotdot_and_report_when_no_common_root() {
    let base = Path::new("/music/lists");
    assert_eq!(relative_path(Path::new("/music/lists/a.flac"), base), Some(PathBuf::from("a.flac")));
    assert_eq!(relative_path(Path::new("/music/lists/sub/a.flac"), base), Some(PathBuf::from("sub/a.flac")));
    assert_eq!(relative_path(Path::new("/music/albums/a.flac"), base), Some(PathBuf::from("../albums/a.flac")));
    assert_eq!(relative_path(Path::new("/data/a.flac"), base), Some(PathBuf::from("../../data/a.flac")));
}

#[test]
fn formats_absolute_and_relative_lists_with_portability_counts() {
    let entries = vec![
        ExportEntry { path: "/music/lists/in/a.flac".into(), title: "A".into(), artist: "Ann".into(), duration: 60.4 },
        ExportEntry { path: "/music/other/b.flac".into(), title: "B".into(), artist: String::new(), duration: 0.0 },
        ExportEntry { path: "/music/lists/in/a.flac".into(), title: "A".into(), artist: "Ann".into(), duration: 60.4 },
    ];
    let (relative, stats) = format_m3u("Mix", &entries, Path::new("/music/lists"), ExportStyle::Relative);
    assert_eq!(
        relative,
        "#EXTM3U\n#PLAYLIST:Mix\n#EXTINF:60,Ann - A\nin/a.flac\n#EXTINF:0,B\n../other/b.flac\n#EXTINF:60,Ann - A\nin/a.flac\n"
    );
    assert_eq!((stats.written, stats.outside_root, stats.absolute_fallback), (3, 1, 0));
    let (absolute, stats) = format_m3u("Mix", &entries, Path::new("/music/lists"), ExportStyle::Absolute);
    assert!(absolute.contains("\n/music/other/b.flac\n"));
    assert_eq!((stats.outside_root, stats.absolute_fallback), (0, 0));
}

/// Three real WAVs (a, b, c) in `root`, imported.
async fn m3u_library() -> (tempfile::TempDir, SqlitePool, Vec<String>, Vec<PathBuf>) {
    let dir = tempfile::tempdir().unwrap();
    let mut paths = Vec::new();
    for (name, title) in [("a", "Alpha"), ("b", "Beta"), ("c", "Gamma")] {
        let path = dir.path().join(format!("{name}.wav"));
        write_wav(&path, title, "Artist");
        paths.push(path);
    }
    let pool = pool().await;
    import_paths(&pool, paths.clone()).await;
    let mut ids = Vec::new();
    for title in ["Alpha", "Beta", "Gamma"] {
        ids.push(list(&pool, title, 0).await.unwrap().tracks.into_iter().find(|t| t.title == title).unwrap().id);
    }
    (dir, pool, ids, paths)
}

#[tokio::test]
async fn export_then_import_round_trips_order_and_repeats() {
    let (dir, pool, ids, _) = m3u_library().await;
    let original = create_playlist(&pool, "Round trip").await.unwrap();
    add_tracks(&pool, &original.id, &[ids[0].clone(), ids[1].clone(), ids[0].clone(), ids[2].clone()], None).await.unwrap();

    let file = dir.path().join("round trip.m3u8");
    let stats = export_playlist(&pool, &original.id, &file, ExportStyle::Relative).await.unwrap();
    assert_eq!((stats.written, stats.outside_root, stats.absolute_fallback), (4, 0, 0));
    let text = std::fs::read_to_string(&file).unwrap();
    assert!(text.starts_with("#EXTM3U\n#PLAYLIST:Round trip\n"), "{text}");
    assert!(text.contains("\na.wav\n"), "relative names: {text}");

    let preview = preview_import(&pool, &file, None).await.unwrap();
    assert_eq!((preview.total, preview.linked, preview.unresolved.len()), (4, 4, 0));
    assert_eq!(preview.suggested_name, "Round trip");

    let outcome = commit_import(&pool, &file, "Imported copy", true, None).await.unwrap();
    assert_eq!((outcome.linked, outcome.unresolved, outcome.imported), (4, 0, 0));
    assert_eq!(entry_titles(&pool, &outcome.playlist.id).await, entry_titles(&pool, &original.id).await);
    assert_eq!(playable_track_ids(&pool, &outcome.playlist.id).await.unwrap(), playable_track_ids(&pool, &original.id).await.unwrap());
}

#[tokio::test]
async fn import_keeps_unresolved_entries_and_relinks_them_when_the_file_arrives() {
    let (dir, pool, ids, _) = m3u_library().await;
    let _ = ids;
    let outside = dir.path().join("new");
    std::fs::create_dir_all(&outside).unwrap();
    let fresh = outside.join("fresh.wav");
    write_wav(&fresh, "Fresh", "Artist");
    let unsupported = outside.join("song.mp3");
    std::fs::write(&unsupported, b"not really mp3").unwrap();
    let missing = dir.path().join("gone.wav");
    let list_file = dir.path().join("mixed.m3u");
    std::fs::write(
        &list_file,
        format!(
            "#EXTM3U\n#EXTINF:5,Ann - Known\n{}\n{}\n{}\n{}\nhttps://radio.example/live\n",
            dir.path().join("a.wav").display(),
            fresh.display(),
            unsupported.display(),
            missing.display(),
        ),
    )
    .unwrap();

    let preview = preview_import(&pool, &list_file, None).await.unwrap();
    assert_eq!(
        (preview.total, preview.linked, preview.needs_import, preview.missing, preview.unsupported, preview.remote),
        (5, 1, 1, 1, 1, 1)
    );
    let statuses: Vec<EntryStatus> = preview.unresolved.iter().map(|u| u.status).collect();
    assert_eq!(statuses, [EntryStatus::NeedsImport, EntryStatus::Unsupported, EntryStatus::Missing, EntryStatus::Remote]);
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 3, "preview imports nothing");

    // Without importing files, the fresh one stays an unavailable entry.
    let kept = commit_import(&pool, &list_file, "No import", false, None).await.unwrap();
    assert_eq!((kept.linked, kept.unresolved, kept.imported), (1, 4, 0));
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 3);

    let outcome = commit_import(&pool, &list_file, "With import", true, None).await.unwrap();
    assert_eq!((outcome.linked, outcome.unresolved, outcome.imported), (2, 3, 1));
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 4, "fresh.wav joined the library");
    let page = entries_page(&pool, &outcome.playlist.id, 0).await.unwrap();
    assert_eq!(page.total, 5, "nothing dropped");
    assert_eq!(page.entries.iter().map(|e| e.unavailable).collect::<Vec<_>>(), [false, false, true, true, true]);
    assert_eq!(page.entries[0].title, "Alpha", "catalog metadata wins for linked entries");
    assert_eq!(page.entries[2].title, "song");

    // The missing file turns up later: the entry re-links by path on open.
    write_wav(&missing, "Gone", "Artist");
    import_paths(&pool, vec![missing.clone()]).await;
    let page = entries_page(&pool, &outcome.playlist.id, 0).await.unwrap();
    assert!(!page.entries[3].unavailable, "relinked by path");
}

#[tokio::test]
async fn import_rejects_a_taken_name_before_importing_anything() {
    let (dir, pool, _, _) = m3u_library().await;
    create_playlist(&pool, "Taken").await.unwrap();
    let fresh = dir.path().join("fresh.wav");
    write_wav(&fresh, "Fresh", "Artist");
    let file = dir.path().join("x.m3u8");
    std::fs::write(&file, format!("{}\n", fresh.display())).unwrap();

    let error = commit_import(&pool, &file, "taken", true, None).await.unwrap_err();
    assert!(error.contains("already exists"));
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 3, "no files imported on failure");
}

#[tokio::test]
async fn relinking_by_folder_finds_moved_files_by_path_suffix_and_unique_name() {
    let (dir, pool, _, _) = m3u_library().await;
    // The list was made on another machine: /old/drive/Music/Album/x.wav and /old/drive/Music/y.wav
    let moved = dir.path().join("moved");
    std::fs::create_dir_all(moved.join("Album")).unwrap();
    std::fs::create_dir_all(moved.join("Elsewhere")).unwrap();
    write_wav(&moved.join("Album/x.wav"), "X", "Artist");
    write_wav(&moved.join("Elsewhere/y.wav"), "Y", "Artist");
    let list_file = dir.path().join("moved.m3u8");
    std::fs::write(&list_file, "/old/drive/Music/Album/x.wav\n/old/drive/Music/y.wav\n/old/drive/Music/none.wav\n").unwrap();

    let without = preview_import(&pool, &list_file, None).await.unwrap();
    assert_eq!((without.missing, without.needs_import), (3, 0));
    let with = preview_import(&pool, &list_file, Some(&moved)).await.unwrap();
    assert_eq!((with.needs_import, with.missing), (2, 1), "suffix match and unique-name match");

    let outcome = commit_import(&pool, &list_file, "Moved", true, Some(&moved)).await.unwrap();
    assert_eq!((outcome.linked, outcome.imported, outcome.unresolved), (2, 2, 1));
}

#[tokio::test]
async fn relinking_an_entry_to_a_chosen_file_imports_it_when_needed() {
    let (dir, pool, ids, _) = m3u_library().await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &[ids[0].clone()], None).await.unwrap();
    remove(&pool, &ids[0]).await.unwrap();
    let entry = entry_ids(&pool, &p.id).await.unwrap().remove(0);
    let replacement = dir.path().join("replacement.wav");
    write_wav(&replacement, "Replacement", "Artist");

    relink_entry(&pool, &p.id, &entry, &replacement).await.unwrap();

    let page = entries_page(&pool, &p.id, 0).await.unwrap();
    assert!(!page.entries[0].unavailable);
    assert_eq!(page.entries[0].title, "Replacement");
    assert!(relink_entry(&pool, &p.id, "nope", &replacement).await.is_err());
}

#[tokio::test]
async fn export_keeps_unavailable_entries_with_their_saved_path_and_name() {
    let (dir, pool, ids, _) = m3u_library().await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &[ids[1].clone()], None).await.unwrap();
    remove(&pool, &ids[1]).await.unwrap();
    let file = dir.path().join("p.m3u8");
    let stats = export_playlist(&pool, &p.id, &file, ExportStyle::Absolute).await.unwrap();
    assert_eq!(stats.written, 1);
    let text = std::fs::read_to_string(&file).unwrap();
    assert!(text.contains("Artist - Beta"), "{text}");
    assert!(text.contains("b.wav"), "{text}");
}

#[tokio::test]
async fn a_renamed_file_keeps_its_catalog_id() {
    let dir = tempfile::tempdir().unwrap();
    let old = dir.path().join("a.wav");
    write_wav(&old, "A", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();

    std::fs::create_dir_all(dir.path().join("moved")).unwrap();
    std::fs::rename(&old, dir.path().join("moved").join("a.wav")).unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    let (moved, rest) = super::reconcile::relink_moved(&pool, &root, fresh).await.unwrap();
    assert_eq!(moved, 1);
    assert!(rest.is_empty(), "the moved file is not imported a second time");
    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!(page.total, 1);
    assert_eq!(page.tracks[0].id, id);
    assert!(page.tracks[0].path.ends_with("moved/a.wav"));
}

#[tokio::test]
async fn a_file_renamed_to_a_new_name_keeps_its_catalog_id() {
    let dir = tempfile::tempdir().unwrap();
    let old = dir.path().join("a.wav");
    write_wav(&old, "A", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;
    super::reconcile::refresh_changed(&pool, &root).await.unwrap(); // records mtime
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();

    std::fs::rename(&old, dir.path().join("renamed.wav")).unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    let (moved, rest) = super::reconcile::relink_moved(&pool, &root, fresh).await.unwrap();
    assert_eq!(moved, 1);
    assert!(rest.is_empty());
    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!(page.total, 1);
    assert_eq!(page.tracks[0].id, id);
    assert!(page.tracks[0].path.ends_with("renamed.wav"));
}

#[tokio::test]
async fn a_changed_file_is_re_read_once() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("a.wav");
    write_wav(&path, "Old", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;

    assert_eq!(super::reconcile::refresh_changed(&pool, &root).await.unwrap(), 0, "first pass only records mtime");
    assert_eq!(super::reconcile::refresh_changed(&pool, &root).await.unwrap(), 0);

    write_wav(&path, "A much longer new title", "Artist");
    sqlx::query("UPDATE library_tracks SET mtime = 1")
        .execute(&pool)
        .await
        .unwrap();
    assert_eq!(super::reconcile::refresh_changed(&pool, &root).await.unwrap(), 1);
    assert_eq!(list(&pool, "", 0).await.unwrap().tracks[0].title, "A much longer new title");
    assert_eq!(super::reconcile::refresh_changed(&pool, &root).await.unwrap(), 0, "not re-read again");
}

#[tokio::test]
async fn a_root_on_an_unplugged_drive_goes_missing_and_recovers_with_ids_intact() {
    let dir = tempfile::tempdir().unwrap();
    let root_dir = dir.path().join("Külmä levy 🎧");
    std::fs::create_dir_all(&root_dir).unwrap();
    write_wav(&root_dir.join("楽曲.wav"), "A", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, &root_dir).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();

    let away = dir.path().join("unplugged");
    std::fs::rename(&root_dir, &away).unwrap();
    refresh_root_availability(&pool, &root.id).await.unwrap();
    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!((page.total, page.tracks[0].available), (1, false), "kept, marked missing");

    std::fs::rename(&away, &root_dir).unwrap();
    refresh_root_availability(&pool, &root.id).await.unwrap();
    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!((page.tracks[0].id.clone(), page.tracks[0].available), (id, true));
}

#[tokio::test]
async fn reopening_the_catalog_file_keeps_its_data_and_migrations_are_idempotent() {
    let dir = tempfile::tempdir().unwrap();
    let db = dir.path().join("nested").join("library.db");
    let music = dir.path().join("a.wav");
    write_wav(&music, "A", "Artist");
    let first = super::open(&db).await.unwrap();
    assert_eq!(import_paths(&first, vec![music]).await.imported, 1);
    first.close().await;

    // Offline startup: no network or other file is needed to open the catalog.
    let second = super::open(&db).await.unwrap();
    let page = list(&second, "", 0).await.unwrap();
    assert_eq!((page.total, page.tracks[0].title.as_str()), (1, "A"));
}

#[tokio::test]
async fn a_corrupt_catalog_is_set_aside_and_the_library_starts_fresh() {
    let dir = tempfile::tempdir().unwrap();
    let db = dir.path().join("library.db");
    std::fs::write(&db, b"this is not a sqlite database, just noise").unwrap();

    let (pool, moved) = super::open_recovering(&db).await.unwrap();
    let moved = moved.expect("the damaged file is reported");
    assert_eq!(std::fs::read(&moved).unwrap(), b"this is not a sqlite database, just noise");
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 0);
    pool.close().await;

    // A healthy catalog is never touched.
    let (pool, moved) = super::open_recovering(&db).await.unwrap();
    assert!(moved.is_none());
    pool.close().await;
}

#[tokio::test]
async fn a_healthy_catalog_with_an_unknown_migration_is_not_treated_as_corrupt() {
    let dir = tempfile::tempdir().unwrap();
    let db = dir.path().join("library.db");
    let first = super::open(&db).await.unwrap();
    // As if a newer app version had migrated it further.
    sqlx::query("INSERT INTO _sqlx_migrations (version, description, success, checksum, execution_time) VALUES (99999, 'future', 1, x'00', 0)")
        .execute(&first)
        .await
        .unwrap();
    first.close().await;

    assert!(super::open_recovering(&db).await.is_err(), "left as an error, not wiped");
    assert!(db.exists(), "the newer catalog stays where it is");
    let leftovers = std::fs::read_dir(dir.path()).unwrap().filter_map(Result::ok)
        .filter(|e| e.file_name().to_string_lossy().contains("corrupt")).count();
    assert_eq!(leftovers, 0);
}
