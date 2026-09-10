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
