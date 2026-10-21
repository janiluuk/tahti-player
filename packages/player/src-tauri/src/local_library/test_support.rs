use std::sync::atomic::{AtomicU32, Ordering};

use sqlx::sqlite::{SqliteConnectOptions, SqlitePool};

use super::playlists::entries_page;
use super::{import_batch, ImportResult};

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

/// Inserts synthetic rows directly (no decode) — a generated metadata
/// fixture for scale, not a real-audio fixture like the ones above.
pub(super) async fn seed_generated_rows(pool: &SqlitePool, count: usize) {
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

pub(super) async fn import_into_root(pool: &SqlitePool, root_id: &str, paths: Vec<std::path::PathBuf>) -> ImportResult {
    let mut result = ImportResult::default();
    import_batch(pool, paths, Some(root_id), &mut result).await;
    result
}

/// Rows that vary in every filterable column: 3 formats, 35 years, 2 discs,
/// 12 track numbers, bitrates and durations, 10 folders.
pub(super) async fn seed_varied_rows(pool: &SqlitePool, count: usize) {
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

pub(super) async fn entry_titles(pool: &SqlitePool, playlist: &str) -> Vec<String> {
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
