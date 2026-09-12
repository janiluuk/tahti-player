use std::sync::atomic::{AtomicU32, Ordering};

use sqlx::sqlite::{SqliteConnectOptions, SqlitePool};

use super::{import_paths, list, remove, resolve_path};

static DB_COUNTER: AtomicU32 = AtomicU32::new(0);

async fn pool() -> SqlitePool {
    let id = DB_COUNTER.fetch_add(1, Ordering::Relaxed);
    let options: SqliteConnectOptions = format!("sqlite:file:testlib_{id}?mode=memory&cache=shared")
        .parse()
        .unwrap();
    let options = crate::db::configure(options);
    let pool = SqlitePool::connect_with(options).await.unwrap();
    sqlx::migrate!("./migrations/library").run(&pool).await.unwrap();
    pool
}

/// Writes a minimal PCM16 mono WAV file symphonia can decode and tag.
fn write_wav(path: &std::path::Path, title: &str, artist: &str) {
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
    for (tag, value) in [("INAM", title), ("IART", artist)] {
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

    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!(page.total, 100_000);
}
