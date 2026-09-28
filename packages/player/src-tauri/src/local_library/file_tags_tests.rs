use std::path::{Path, PathBuf};

use lofty::config::WriteOptions;
use lofty::file::TaggedFileExt;
use lofty::id3::v2::Id3v2Tag;
use lofty::tag::{Accessor, ItemKey, Tag, TagExt};
use sqlx::{Row, SqlitePool};

use super::analysis::{detail, set_corrections};
use super::test_support::pool;
use super::{import_paths, relink};

fn fixture(dir: &Path, name: &str) -> PathBuf {
    let path = dir.join(name);
    let source = format!("{}/src/local_library/fixtures/{name}", env!("CARGO_MANIFEST_DIR"));
    std::fs::copy(source, &path).unwrap();
    path
}

/// Sets (`Some`) or removes (`None`) items in the file's primary tag type.
fn retag(path: &Path, items: &[(ItemKey, Option<&str>)]) {
    let mut tagged = lofty::read_from_path(path).unwrap();
    let kind = tagged.primary_tag_type();
    if tagged.tag(kind).is_none() {
        tagged.insert_tag(Tag::new(kind));
    }
    let tag = tagged.tag_mut(kind).unwrap();
    for (key, value) in items {
        match value {
            Some(value) => {
                assert!(tag.insert_text(key.clone(), (*value).to_owned()), "{kind:?} cannot hold {key:?}");
            }
            None => tag.remove_key(key),
        }
    }
    tag.save_to_path(path, WriteOptions::default()).unwrap();
}

#[derive(Debug, PartialEq)]
struct Stored {
    tag_bpm: Option<f64>,
    tag_key: Option<String>,
    bpm: Option<f64>,
    musical_key: Option<String>,
    replaygain: [Option<f64>; 4],
}

async fn stored(pool: &SqlitePool, path: &Path) -> (String, Stored) {
    let path = path.canonicalize().unwrap();
    let row = sqlx::query(
        "SELECT id, tag_bpm, tag_key, bpm, musical_key, replaygain_track_gain, replaygain_track_peak,
                replaygain_album_gain, replaygain_album_peak FROM library_tracks WHERE path = ?",
    )
    .bind(path.to_str().unwrap())
    .fetch_one(pool)
    .await
    .unwrap();
    let stored = Stored {
        tag_bpm: row.get(1),
        tag_key: row.get(2),
        bpm: row.get(3),
        musical_key: row.get(4),
        replaygain: [row.get(5), row.get(6), row.get(7), row.get(8)],
    };
    (row.get(0), stored)
}

async fn import(pool: &SqlitePool, path: &Path) {
    let result = import_paths(pool, vec![path.to_path_buf()]).await;
    assert_eq!(result.imported, 1, "errors: {:?}", result.errors);
}

#[tokio::test]
async fn mp3_id3_tbpm_tkey_and_txxx_replaygain_are_read_on_import() {
    let dir = tempfile::tempdir().unwrap();
    let path = fixture(dir.path(), "tone.mp3");
    let mut tag = Id3v2Tag::default();
    tag.set_title("Tone MP3".into());
    tag.insert(lofty::id3::v2::Frame::Text(lofty::id3::v2::TextInformationFrame::new(
        lofty::id3::v2::FrameId::Valid("TBPM".into()),
        lofty::TextEncoding::UTF8,
        "128".into(),
    )));
    tag.insert(lofty::id3::v2::Frame::Text(lofty::id3::v2::TextInformationFrame::new(
        lofty::id3::v2::FrameId::Valid("TKEY".into()),
        lofty::TextEncoding::UTF8,
        "8A".into(),
    )));
    tag.insert_user_text("REPLAYGAIN_TRACK_GAIN".into(), "-6.54 dB".into());
    tag.insert_user_text("REPLAYGAIN_TRACK_PEAK".into(), "0.988547".into());
    tag.insert_user_text("REPLAYGAIN_ALBUM_GAIN".into(), "-7.01 dB".into());
    tag.insert_user_text("REPLAYGAIN_ALBUM_PEAK".into(), "1.020000".into());
    tag.save_to_path(&path, WriteOptions::default()).unwrap();

    let pool = pool().await;
    import(&pool, &path).await;
    let (id, got) = stored(&pool, &path).await;
    assert_eq!(
        got,
        Stored {
            tag_bpm: Some(128.0),
            tag_key: Some("Am".into()),
            bpm: Some(128.0),
            musical_key: Some("Am".into()),
            replaygain: [Some(-6.54), Some(0.988547), Some(-7.01), Some(1.02)],
        },
        "Camelot 8A is stored in analysis notation"
    );
    let d = detail(&pool, &id).await.unwrap();
    assert!(!d.analyzed, "tag values do not count as analysis");
    assert_eq!((d.tag_bpm, d.tag_key.as_deref()), (Some(128.0), Some("Am")));
}

#[tokio::test]
async fn flac_vorbis_comments_are_read_and_unusable_values_stay_null() {
    let dir = tempfile::tempdir().unwrap();
    let path = fixture(dir.path(), "tone.flac");
    retag(
        &path,
        &[
            (ItemKey::Bpm, Some("174.5")),
            (ItemKey::InitialKey, Some("F# minor")),
            (ItemKey::ReplayGainTrackGain, Some("+1.25 dB")),
            (ItemKey::ReplayGainTrackPeak, Some("0.5")),
        ],
    );
    let pool = pool().await;
    import(&pool, &path).await;
    let (_, got) = stored(&pool, &path).await;
    assert_eq!((got.tag_bpm, got.tag_key.as_deref()), (Some(174.5), Some("F#m")));
    assert_eq!(got.replaygain, [Some(1.25), Some(0.5), None, None]);

    retag(
        &path,
        &[
            (ItemKey::Bpm, Some("0")),
            (ItemKey::InitialKey, Some("not a key")),
            (ItemKey::ReplayGainTrackGain, Some("loud")),
            (ItemKey::ReplayGainTrackPeak, Some("0")),
        ],
    );
    import(&pool, &path).await;
    let (_, got) = stored(&pool, &path).await;
    assert_eq!(
        got,
        Stored { tag_bpm: None, tag_key: None, bpm: None, musical_key: None, replaygain: [None; 4] },
        "a re-read replaces the old tag values, and unusable ones become NULL"
    );
}

#[tokio::test]
async fn m4a_tmpo_and_itunes_freeform_atoms_are_read() {
    let dir = tempfile::tempdir().unwrap();
    let path = fixture(dir.path(), "tone.m4a");
    retag(
        &path,
        &[
            (ItemKey::IntegerBpm, Some("124")),
            (ItemKey::InitialKey, Some("Bbm")),
            (ItemKey::ReplayGainAlbumGain, Some("-3.10 dB")),
            (ItemKey::ReplayGainAlbumPeak, Some("0.891")),
        ],
    );
    let pool = pool().await;
    import(&pool, &path).await;
    let (_, got) = stored(&pool, &path).await;
    assert_eq!((got.tag_bpm, got.tag_key.as_deref()), (Some(124.0), Some("A#m")));
    assert_eq!(got.replaygain, [None, None, Some(-3.1), Some(0.891)]);
}

#[tokio::test]
async fn a_user_correction_outranks_tags_across_re_reads() {
    let dir = tempfile::tempdir().unwrap();
    let path = fixture(dir.path(), "tone.flac");
    retag(&path, &[(ItemKey::Bpm, Some("128")), (ItemKey::InitialKey, Some("Am"))]);
    let pool = pool().await;
    import(&pool, &path).await;
    let (id, _) = stored(&pool, &path).await;
    set_corrections(&pool, std::slice::from_ref(&id), Some(100.0), Some("C")).await.unwrap();

    retag(&path, &[(ItemKey::Bpm, Some("130")), (ItemKey::InitialKey, Some("Em"))]);
    import(&pool, &path).await;
    let (_, got) = stored(&pool, &path).await;
    assert_eq!((got.tag_bpm, got.tag_key.as_deref()), (Some(130.0), Some("Em")), "the tag value itself is refreshed");
    assert_eq!((got.bpm, got.musical_key.as_deref()), (Some(100.0), Some("C")), "the correction still wins");

    set_corrections(&pool, std::slice::from_ref(&id), Some(0.0), Some("")).await.unwrap();
    let (_, got) = stored(&pool, &path).await;
    assert_eq!((got.bpm, got.musical_key.as_deref()), (Some(130.0), Some("Em")));
}

#[tokio::test]
async fn relinking_reads_the_new_files_tags() {
    let dir = tempfile::tempdir().unwrap();
    let path = fixture(dir.path(), "tone.flac");
    let pool = pool().await;
    import(&pool, &path).await;
    let (id, got) = stored(&pool, &path).await;
    assert_eq!(got.tag_bpm, None);

    let moved = dir.path().join("moved.flac");
    std::fs::rename(&path, &moved).unwrap();
    retag(&moved, &[(ItemKey::Bpm, Some("122")), (ItemKey::ReplayGainTrackGain, Some("-8 dB"))]);
    relink(&pool, &id, moved.clone()).await.unwrap();
    let (_, got) = stored(&pool, &moved).await;
    assert_eq!((got.tag_bpm, got.bpm, got.replaygain[0]), (Some(122.0), Some(122.0), Some(-8.0)));
}

#[tokio::test]
async fn a_wav_reads_bpm_from_its_id3_chunk_next_to_riff_info() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("plain.wav");
    super::test_support::write_wav(&path, "Plain", "Nobody");
    assert_eq!(super::metadata::read_file_tags(&path), super::metadata::FileTags::default());

    let mut tag = Id3v2Tag::default();
    tag.insert_user_text("REPLAYGAIN_TRACK_GAIN".into(), "-2.00 dB".into());
    tag.insert(lofty::id3::v2::Frame::Text(lofty::id3::v2::TextInformationFrame::new(
        lofty::id3::v2::FrameId::Valid("TBPM".into()),
        lofty::TextEncoding::UTF8,
        "96".into(),
    )));
    tag.save_to_path(&path, WriteOptions::default()).unwrap();
    let pool = pool().await;
    import(&pool, &path).await;
    let (_, got) = stored(&pool, &path).await;
    assert_eq!((got.tag_bpm, got.replaygain[0]), (Some(96.0), Some(-2.0)));
}

#[tokio::test]
async fn tags_are_read_by_contents_when_the_extension_is_wrong() {
    let dir = tempfile::tempdir().unwrap();
    let flac = fixture(dir.path(), "tone.flac");
    retag(&flac, &[(ItemKey::Bpm, Some("98")), (ItemKey::InitialKey, Some("Em"))]);
    let path = dir.path().join("mislabelled.m4a");
    std::fs::rename(&flac, &path).unwrap();
    let pool = pool().await;
    import(&pool, &path).await;
    let (_, got) = stored(&pool, &path).await;
    assert_eq!((got.tag_bpm, got.tag_key.as_deref()), (Some(98.0), Some("Em")));
}

#[tokio::test]
async fn analysis_detail_reports_replaygain_from_the_tags() {
    let dir = tempfile::tempdir().unwrap();
    let path = fixture(dir.path(), "tone.flac");
    retag(
        &path,
        &[
            (ItemKey::ReplayGainTrackGain, Some("-6.54 dB")),
            (ItemKey::ReplayGainTrackPeak, Some("0.988547")),
            (ItemKey::ReplayGainAlbumGain, Some("-5.10 dB")),
        ],
    );
    let pool = pool().await;
    import(&pool, &path).await;
    let (id, _) = stored(&pool, &path).await;
    let got = detail(&pool, &id).await.unwrap();
    assert_eq!(
        (got.replaygain_track_gain, got.replaygain_track_peak, got.replaygain_album_gain, got.replaygain_album_peak),
        (Some(-6.54), Some(0.988547), Some(-5.1), None)
    );
}

#[tokio::test]
async fn composer_is_read_on_import_and_on_relink_and_sorts_with_blanks_last() {
    use super::{list_query, ListQuery, SortColumn, TrackSort};
    let dir = tempfile::tempdir().unwrap();
    let flac = fixture(dir.path(), "tone.flac");
    let mp3 = fixture(dir.path(), "tone.mp3");
    let m4a = fixture(dir.path(), "tone.m4a");
    retag(&flac, &[(ItemKey::TrackTitle, Some("By Satie")), (ItemKey::Composer, Some(" Erik Satie "))]);
    retag(&mp3, &[(ItemKey::TrackTitle, Some("By Bach")), (ItemKey::Composer, Some("J. S. Bach"))]);
    retag(&m4a, &[(ItemKey::TrackTitle, Some("Nobody's"))]);
    let pool = pool().await;
    for path in [&flac, &mp3, &m4a] {
        import(&pool, path).await;
    }

    let sort = TrackSort { column: SortColumn::Composer, descending: false };
    let page = list_query(&pool, &ListQuery { search: "", filter: None, filters: None, sort: Some(&sort) }, 0).await.unwrap();
    let rows: Vec<_> = page.tracks.iter().map(|t| (t.title.as_str(), t.composer.as_str())).collect();
    assert_eq!(rows, [("By Satie", "Erik Satie"), ("By Bach", "J. S. Bach"), ("Nobody's", "")]);

    let (id, _) = stored(&pool, &flac).await;
    let moved = dir.path().join("moved.flac");
    std::fs::rename(&flac, &moved).unwrap();
    retag(&moved, &[(ItemKey::Composer, Some("Claude Debussy"))]);
    relink(&pool, &id, moved.clone()).await.unwrap();
    let composer: String = sqlx::query_scalar("SELECT composer FROM library_tracks WHERE id = ?").bind(&id).fetch_one(&pool).await.unwrap();
    assert_eq!(composer, "Claude Debussy");
}
