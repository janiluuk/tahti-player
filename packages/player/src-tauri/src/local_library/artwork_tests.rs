use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::time::Duration;

use lofty::config::WriteOptions;
use lofty::file::TaggedFileExt;
use lofty::picture::{MimeType, Picture, PictureType};
use lofty::prelude::*;
use lofty::tag::Tag;

use super::artwork::{self, prune_unused, store, MAX_ARTWORK_BYTES};
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

    assert_eq!(store(dir.path(), &huge).unwrap(), None);
    assert_eq!(store(dir.path(), b"II*\0 tiff").unwrap(), None);
    assert_eq!(store(dir.path(), &[]).unwrap(), None);
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

    assert_eq!(prune_unused(private.path(), &used, Duration::from_secs(3600)).unwrap(), 0, "recent files are kept");
    assert_eq!(prune_unused(private.path(), &used, Duration::ZERO).unwrap(), 1);
    assert!(private.path().join(&kept_key).exists());
    assert!(!private.path().join(&gone_key).exists());
    assert!(private.path().join("notes.txt").exists());
}
