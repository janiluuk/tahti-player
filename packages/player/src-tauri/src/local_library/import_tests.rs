use super::test_support::{pool, write_wav, write_wav_tagged};
use super::{collect_audio_paths, collect_audio_paths_with_skipped, import_paths, list};

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
async fn imports_mp3_with_tags_and_a_duration_from_the_tag_reader() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("tone.mp3");
    std::fs::copy(concat!(env!("CARGO_MANIFEST_DIR"), "/src/local_library/fixtures/tone.mp3"), &path).unwrap();

    let pool = pool().await;
    let result = import_paths(&pool, vec![path]).await;

    assert_eq!(result.imported, 1, "errors: {:?}", result.errors);
    let track = &list(&pool, "", 0).await.unwrap().tracks[0];
    assert_eq!(track.format, "mp3");
    assert_eq!(track.title, "Tone MP3");
    assert_eq!(track.artist, "Fixture Artist");
    assert!((1.5..2.5).contains(&track.duration), "duration {}", track.duration);
    assert!(track.bitrate_kbps.is_some());
}

#[test]
fn accepts_every_supported_extension_case_insensitively() {
    for name in ["a.mp3", "b.AIFF", "c.aif", "d.m4a", "e.ogg", "f.oga", "g.Flac", "h.wav"] {
        assert!(super::import::is_supported_audio_file(std::path::Path::new(name)), "{name}");
    }
    assert!(!super::import::is_supported_audio_file(std::path::Path::new("notes.txt")));
    assert!(!super::import::is_supported_audio_file(std::path::Path::new("no-extension")));
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

const FIXTURES: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/src/local_library/fixtures");

#[tokio::test]
async fn a_wav_named_flac_is_recorded_as_wav_with_its_tags() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("mislabelled.flac");
    write_wav(&path, "Hidden Wav", "Wav Artist");

    let pool = pool().await;
    let result = import_paths(&pool, vec![path]).await;

    assert_eq!(result.imported, 1, "errors: {:?}", result.errors);
    let track = &list(&pool, "", 0).await.unwrap().tracks[0];
    assert_eq!(track.format, "wav");
    assert_eq!((track.title.as_str(), track.artist.as_str()), ("Hidden Wav", "Wav Artist"));
    assert!(track.path.ends_with("mislabelled.flac"), "the file keeps its name");
}

#[tokio::test]
async fn an_mp3_named_m4a_is_recorded_as_mp3_with_its_tags_and_duration() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("tone.m4a");
    std::fs::copy(format!("{FIXTURES}/tone.mp3"), &path).unwrap();

    let pool = pool().await;
    let result = import_paths(&pool, vec![path]).await;

    assert_eq!(result.imported, 1, "errors: {:?}", result.errors);
    let track = &list(&pool, "", 0).await.unwrap().tracks[0];
    assert_eq!(track.format, "mp3");
    assert_eq!((track.title.as_str(), track.artist.as_str()), ("Tone MP3", "Fixture Artist"));
    assert!((1.5..2.5).contains(&track.duration), "duration {}", track.duration);
}

#[tokio::test]
async fn correctly_named_files_keep_their_format() {
    let dir = tempfile::tempdir().unwrap();
    let wav = dir.path().join("song.wav");
    write_wav(&wav, "Wav", "A");
    let flac = dir.path().join("tone.flac");
    std::fs::copy(format!("{FIXTURES}/tone.flac"), &flac).unwrap();
    let mp3 = dir.path().join("tone.mp3");
    std::fs::copy(format!("{FIXTURES}/tone.mp3"), &mp3).unwrap();

    let pool = pool().await;
    let result = import_paths(&pool, vec![wav, flac, mp3]).await;

    assert_eq!(result.imported, 3, "errors: {:?}", result.errors);
    let mut formats: Vec<String> = list(&pool, "", 0).await.unwrap().tracks.into_iter().map(|t| t.format).collect();
    formats.sort();
    assert_eq!(formats, ["flac", "mp3", "wav"]);
}

#[test]
fn detected_format_keeps_the_extension_within_the_same_family_or_when_unrecognised() {
    use super::metadata::detect_format;
    let dir = tempfile::tempdir().unwrap();
    let wav = dir.path().join("x.aif");
    write_wav(&wav, "t", "a");
    assert_eq!(detect_format(&wav, "aif"), "wav");
    let aiff = dir.path().join("y.aif");
    let mut form = b"FORM\0\0\0\x04AIFF".to_vec();
    form.extend_from_slice(&[0; 24]);
    std::fs::write(&aiff, form).unwrap();
    assert_eq!(detect_format(&aiff, "aif"), "aif");
    assert_eq!(detect_format(&aiff, "flac"), "aiff");
    let unknown = dir.path().join("z.ogg");
    std::fs::write(&unknown, [0x42u8; 64]).unwrap();
    assert_eq!(detect_format(&unknown, "OGG"), "ogg");
    assert_eq!(detect_format(&dir.path().join("missing.flac"), "flac"), "flac");
}
