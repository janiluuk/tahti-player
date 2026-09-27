use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::time::Duration;

use lofty::config::WriteOptions;
use lofty::file::TaggedFileExt;
use lofty::picture::{MimeType, Picture, PictureType};
use lofty::prelude::*;
use lofty::tag::Tag;

use super::artwork::{self, prune_unused, store, Budget, Pruned, Stored, MAX_ARTWORK_BYTES, MAX_CACHE_BYTES};
use super::test_support::{pool, write_wav};
use super::{import_paths, list, remove};

const PNG: &[u8] = &[
    0x89, b'P', b'N', b'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, b'I', b'H', b'D', b'R', 0, 0, 0, 1,
    0, 0, 0, 1, 8, 6, 0, 0, 0, 0x1F, 0x15, 0xC4, 0x89,
];
const JPEG: &[u8] = &[0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10, b'J', b'F', b'I', b'F', 0, 1, 0xFF, 0xD9];

fn fixture(dir: &Path, name: &str) -> PathBuf {
    let target = dir.join(name);
    let source = format!("{}/src/local_library/fixtures/{name}", env!("CARGO_MANIFEST_DIR"));
    std::fs::copy(source, &target).unwrap();
    target
}

/// Embeds `pictures` into the file's primary tag format (Vorbis comments for
/// FLAC, ID3v2 for MP3 and WAV), creating the tag when the file has none.
fn embed(path: &Path, pictures: &[(PictureType, &[u8])]) {
    let tagged = lofty::probe::Probe::open(path).unwrap().read().unwrap();
    let mut tag = tagged
        .primary_tag()
        .cloned()
        .unwrap_or_else(|| Tag::new(tagged.primary_tag_type()));
    for (kind, bytes) in pictures {
        let mime = if bytes.starts_with(PNG) { MimeType::Png } else { MimeType::Jpeg };
        tag.push_picture(Picture::new_unchecked(*kind, Some(mime), None, bytes.to_vec()));
    }
    tag.save_to_path(path, WriteOptions::default()).unwrap();
}

/// The process-wide cache directory the importer writes into.
fn cache_dir() -> &'static Path {
    static DIR: std::sync::OnceLock<tempfile::TempDir> = std::sync::OnceLock::new();
    let dir = DIR.get_or_init(|| tempfile::tempdir().unwrap()).path();
    artwork::set_cache_dir(dir.to_path_buf());
    artwork::cache_dir().unwrap()
}

#[tokio::test]
async fn imports_embedded_art_from_flac_mp3_and_wav() {
    let cache = cache_dir();
    let dir = tempfile::tempdir().unwrap();
    let flac = fixture(dir.path(), "tone.flac");
    let mp3 = fixture(dir.path(), "tone.mp3");
    let wav = dir.path().join("tone.wav");
    write_wav(&wav, "Tone", "Artist");
    embed(&flac, &[(PictureType::CoverFront, PNG)]);
    embed(&mp3, &[(PictureType::CoverFront, JPEG)]);
    embed(&wav, &[(PictureType::CoverFront, PNG)]);
    let pool = pool().await;

    let result = import_paths(&pool, vec![flac, mp3, wav]).await;

    assert_eq!(result.imported, 3, "errors: {:?}", result.errors);
    let tracks = list(&pool, "", 0).await.unwrap().tracks;
    for track in &tracks {
        let key = track.artwork_key.as_deref().unwrap_or_else(|| panic!("no art for {}", track.path));
        let expected: &[u8] = if track.format == "mp3" { JPEG } else { PNG };
        assert_eq!(std::fs::read(cache.join(key)).unwrap(), expected, "{}", track.path);
    }
    let flac_key = tracks.iter().find(|t| t.format == "flac").unwrap().artwork_key.clone();
    let wav_key = tracks.iter().find(|t| t.format == "wav").unwrap().artwork_key.clone();
    assert_eq!(flac_key, wav_key, "identical art is stored once under one key");
    assert!(flac_key.unwrap().ends_with(".png"));
}

#[tokio::test]
async fn prefers_the_front_cover_over_other_pictures() {
    cache_dir();
    let dir = tempfile::tempdir().unwrap();
    let flac = fixture(dir.path(), "tone.flac");
    embed(&flac, &[(PictureType::Artist, JPEG), (PictureType::CoverFront, PNG)]);

    assert_eq!(artwork::read_embedded(&flac).as_deref(), Some(PNG));
}

#[tokio::test]
async fn reimport_without_art_clears_the_key_and_files_without_art_have_none() {
    cache_dir();
    let dir = tempfile::tempdir().unwrap();
    let flac = fixture(dir.path(), "tone.flac");
    embed(&flac, &[(PictureType::CoverFront, PNG)]);
    let pool = pool().await;
    import_paths(&pool, vec![flac.clone()]).await;
    assert!(list(&pool, "", 0).await.unwrap().tracks[0].artwork_key.is_some());

    fixture(dir.path(), "tone.flac");
    import_paths(&pool, vec![flac]).await;

    assert_eq!(list(&pool, "", 0).await.unwrap().tracks[0].artwork_key, None);
}

#[test]
fn skips_oversized_and_unsupported_pictures() {
    let dir = tempfile::tempdir().unwrap();
    let mut huge = PNG.to_vec();
    huge.resize(MAX_ARTWORK_BYTES + 1, 0);
    let budget = Budget::new(MAX_CACHE_BYTES, 0);

    assert_eq!(store(dir.path(), &huge, &budget).unwrap(), Stored::Unsupported);
    assert_eq!(store(dir.path(), b"II*\0 tiff", &budget).unwrap(), Stored::Unsupported);
    assert_eq!(store(dir.path(), &[], &budget).unwrap(), Stored::Unsupported);
    assert_eq!(std::fs::read_dir(dir.path()).unwrap().count(), 0);
}

#[tokio::test]
async fn prune_removes_only_unreferenced_cache_files() {
    let cache = cache_dir();
    let dir = tempfile::tempdir().unwrap();
    let keep = fixture(dir.path(), "tone.flac");
    let wav = dir.path().join("gone.wav");
    write_wav(&wav, "Gone", "Artist");
    embed(&keep, &[(PictureType::CoverFront, PNG)]);
    embed(&wav, &[(PictureType::CoverFront, JPEG)]);
    let pool = pool().await;
    import_paths(&pool, vec![keep, wav]).await;
    let tracks = list(&pool, "", 0).await.unwrap().tracks;
    let gone = tracks.iter().find(|t| t.format == "wav").unwrap();
    let kept_key = tracks.iter().find(|t| t.format == "flac").unwrap().artwork_key.clone().unwrap();
    let gone_key = gone.artwork_key.clone().unwrap();
    remove(&pool, &gone.id).await.unwrap();

    // Pruning the shared test cache would race other tests, so the same
    // rule is exercised on a private copy of the two files.
    let private = tempfile::tempdir().unwrap();
    for key in [&kept_key, &gone_key] {
        std::fs::copy(cache.join(key), private.path().join(key)).unwrap();
    }
    std::fs::write(private.path().join("notes.txt"), b"not ours").unwrap();
    let used: HashSet<String> = sqlx::query_scalar("SELECT artwork_key FROM library_tracks WHERE artwork_key IS NOT NULL")
        .fetch_all(&pool)
        .await
        .unwrap()
        .into_iter()
        .collect();

    assert_eq!(prune_unused(private.path(), &used, Duration::from_secs(3600)).unwrap().files, 0, "recent files are kept");
    assert_eq!(prune_unused(private.path(), &used, Duration::ZERO).unwrap().files, 1);
    assert!(private.path().join(&kept_key).exists());
    assert!(!private.path().join(&gone_key).exists());
    assert!(private.path().join("notes.txt").exists());
}

/// Backdates a cache file past the prune grace period.
fn age(path: &Path) {
    let file = std::fs::File::options().append(true).open(path).unwrap();
    file.set_modified(std::time::SystemTime::now() - Duration::from_secs(2 * 3600)).unwrap();
}

fn stored_key(stored: Stored) -> String {
    match stored {
        Stored::Key(key) => key,
        other => panic!("expected a key, got {other:?}"),
    }
}

#[test]
fn a_full_cache_skips_new_art_but_still_finds_cached_art() {
    let dir = tempfile::tempdir().unwrap();
    let budget = Budget::new(PNG.len() as u64, 0);

    let png = stored_key(store(dir.path(), PNG, &budget).unwrap());
    assert_eq!(store(dir.path(), JPEG, &budget).unwrap(), Stored::CacheFull);
    assert_eq!(store(dir.path(), PNG, &budget).unwrap(), Stored::Key(png));
    assert_eq!(std::fs::read_dir(dir.path()).unwrap().count(), 1);
    assert_eq!(budget.used(), PNG.len() as u64);

    budget.release(JPEG.len() as u64);
    assert!(matches!(store(dir.path(), JPEG, &budget).unwrap(), Stored::Key(_)));
}

#[test]
fn the_budget_starts_from_the_cache_files_already_on_disk() {
    let dir = tempfile::tempdir().unwrap();
    store(dir.path(), PNG, &Budget::new(MAX_CACHE_BYTES, 0)).unwrap();
    std::fs::write(dir.path().join("notes.txt"), b"not ours").unwrap();

    assert_eq!(Budget::for_dir(MAX_CACHE_BYTES, dir.path()).used(), PNG.len() as u64);
    assert_eq!(artwork::dir_size(&dir.path().join("missing")), 0);
}

#[tokio::test]
async fn prune_frees_orphan_space_and_never_evicts_referenced_art() {
    cache_dir();
    let dir = tempfile::tempdir().unwrap();
    let flac = fixture(dir.path(), "tone.flac");
    embed(&flac, &[(PictureType::CoverFront, PNG)]);
    let pool = pool().await;
    import_paths(&pool, vec![flac]).await;
    let private = tempfile::tempdir().unwrap();
    let unlimited = Budget::new(MAX_CACHE_BYTES, 0);
    let referenced = stored_key(store(private.path(), PNG, &unlimited).unwrap());
    let orphan = stored_key(store(private.path(), JPEG, &unlimited).unwrap());
    age(&private.path().join(&referenced));
    age(&private.path().join(&orphan));
    let budget = Budget::for_dir((PNG.len() + JPEG.len()) as u64, private.path());

    let pruned = artwork::prune(&pool, private.path(), &budget).await.unwrap();

    assert_eq!(pruned, Pruned { files: 1, bytes: JPEG.len() as u64 });
    assert_eq!(budget.used(), PNG.len() as u64);
    assert!(private.path().join(&referenced).exists());
    assert!(!private.path().join(&orphan).exists());

    let tight = Budget::for_dir(PNG.len() as u64, private.path());
    assert_eq!(artwork::prune(&pool, private.path(), &tight).await.unwrap(), Pruned::default());
    assert_eq!(store(private.path(), JPEG, &tight).unwrap(), Stored::CacheFull);
    assert!(private.path().join(&referenced).exists());
}

mod backfill {
    use std::sync::atomic::Ordering;
    use std::sync::{Arc, Mutex};

    use super::*;
    use crate::local_library::artwork_backfill::{
        backfill, ArtworkBackfillProgress, ArtworkBackfillResult, BackfillControl, BATCH,
    };

    fn leak(budget: Budget) -> &'static Budget {
        Box::leak(Box::new(budget))
    }

    /// A catalog as a pre-artwork build left it: a FLAC and an MP3 with
    /// embedded art, a WAV without, and an unavailable FLAC with art, all
    /// with no `artwork_key`.
    async fn legacy_catalog(dir: &Path) -> sqlx::SqlitePool {
        cache_dir();
        let flac = fixture(dir, "tone.flac");
        let mp3 = fixture(dir, "tone.mp3");
        let wav = dir.join("plain.wav");
        write_wav(&wav, "Plain", "Artist");
        let gone = dir.join("gone.flac");
        std::fs::copy(&flac, &gone).unwrap();
        embed(&flac, &[(PictureType::CoverFront, PNG)]);
        embed(&mp3, &[(PictureType::CoverFront, JPEG)]);
        embed(&gone, &[(PictureType::CoverFront, PNG)]);
        let pool = pool().await;
        let result = import_paths(&pool, vec![flac, mp3, wav, gone]).await;
        assert_eq!(result.imported, 4, "errors: {:?}", result.errors);
        sqlx::query("UPDATE library_tracks SET artwork_key = NULL").execute(&pool).await.unwrap();
        // The stored path is canonical (e.g. /private/var on macOS), so match its file name.
        let marked = sqlx::query("UPDATE library_tracks SET available = 0 WHERE path LIKE '%gone.flac'")
            .execute(&pool)
            .await
            .unwrap();
        assert_eq!(marked.rows_affected(), 1);
        pool
    }

    async fn run(
        pool: &sqlx::SqlitePool,
        dir: &Path,
        budget: &'static Budget,
        control: &Arc<BackfillControl>,
    ) -> (ArtworkBackfillResult, Vec<(usize, usize)>) {
        let events = Mutex::new(Vec::new());
        let report = |p: ArtworkBackfillProgress| events.lock().unwrap().push((p.done, p.total));
        let result = backfill(pool, dir, budget, control, &report).await.unwrap();
        (result, events.into_inner().unwrap())
    }

    async fn keys(pool: &sqlx::SqlitePool) -> Vec<(String, Option<String>)> {
        sqlx::query_as("SELECT format, artwork_key FROM library_tracks WHERE available = 1 ORDER BY format")
            .fetch_all(pool)
            .await
            .unwrap()
    }

    #[tokio::test]
    async fn fills_missing_art_for_available_tracks_and_is_idempotent() {
        let dir = tempfile::tempdir().unwrap();
        let pool = legacy_catalog(dir.path()).await;
        let cache = tempfile::tempdir().unwrap();
        let budget = leak(Budget::new(MAX_CACHE_BYTES, 0));
        let control = Arc::new(BackfillControl::default());

        let (first, events) = run(&pool, cache.path(), budget, &control).await;

        assert_eq!((first.checked, first.found, first.cache_full, first.cancelled), (3, 2, 0, false));
        assert_eq!(events.first(), Some(&(0, 3)));
        assert_eq!(events.last(), Some(&(3, 3)));
        let found = keys(&pool).await;
        let flac = found[0].1.clone().expect("flac art");
        let mp3 = found[1].1.clone().expect("mp3 art");
        assert_eq!(found[2], ("wav".to_owned(), None));
        assert_eq!(std::fs::read(cache.path().join(&flac)).unwrap(), PNG);
        assert_eq!(std::fs::read(cache.path().join(&mp3)).unwrap(), JPEG);
        let unavailable: Option<String> =
            sqlx::query_scalar("SELECT artwork_key FROM library_tracks WHERE available = 0")
                .fetch_one(&pool)
                .await
                .unwrap();
        assert_eq!(unavailable, None);

        let (second, _) = run(&pool, cache.path(), budget, &control).await;

        assert_eq!((second.checked, second.found), (1, 0), "only the track without art is read again");
        assert_eq!(keys(&pool).await, found);
    }

    #[tokio::test]
    async fn stops_when_cancelled_and_resumes_on_the_next_run() {
        let dir = tempfile::tempdir().unwrap();
        let pool = legacy_catalog(dir.path()).await;
        let cache = tempfile::tempdir().unwrap();
        let budget = leak(Budget::new(MAX_CACHE_BYTES, 0));
        let control = Arc::new(BackfillControl::default());
        control.cancel.store(true, Ordering::SeqCst);

        let (cancelled, _) = run(&pool, cache.path(), budget, &control).await;

        assert!(cancelled.cancelled);
        assert_eq!((cancelled.checked, cancelled.found), (0, 0));
        assert!(keys(&pool).await.iter().all(|(_, key)| key.is_none()));

        control.cancel.store(false, Ordering::SeqCst);
        let (resumed, _) = run(&pool, cache.path(), budget, &control).await;
        assert_eq!((resumed.found, resumed.cancelled), (2, false));
    }

    #[tokio::test]
    async fn leaves_tracks_without_a_key_when_the_cache_is_full() {
        let dir = tempfile::tempdir().unwrap();
        let pool = legacy_catalog(dir.path()).await;
        let cache = tempfile::tempdir().unwrap();
        let control = Arc::new(BackfillControl::default());

        let (result, _) = run(&pool, cache.path(), leak(Budget::new(0, 0)), &control).await;

        assert_eq!((result.checked, result.found, result.cache_full), (3, 0, 2));
        assert!(keys(&pool).await.iter().all(|(_, key)| key.is_none()));
        assert_eq!(artwork::dir_size(cache.path()), 0);
    }

    #[tokio::test]
    async fn pages_through_more_tracks_than_one_batch() {
        let pool = pool().await;
        let rows = BATCH as usize * 2 + 17;
        for i in 0..rows {
            sqlx::query("INSERT INTO library_tracks (id,path,title,artist,album,format,duration,sample_rate,channels,size_bytes) VALUES (?,?,'t','a','b','flac',1,44100,2,1)")
                .bind(format!("track-{i:04}"))
                .bind(format!("/missing/{i}.flac"))
                .execute(&pool)
                .await
                .unwrap();
        }
        let cache = tempfile::tempdir().unwrap();
        let control = Arc::new(BackfillControl::default());

        let (result, events) = run(&pool, cache.path(), leak(Budget::new(MAX_CACHE_BYTES, 0)), &control).await;

        assert_eq!((result.checked, result.found), (rows, 0));
        assert_eq!(events.len(), 1 + 3, "one start event and one per batch");
        assert_eq!(events.last(), Some(&(rows, rows)));
    }
}
