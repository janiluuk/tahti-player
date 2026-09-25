use sqlx::SqlitePool;

use super::catalog::{add_tag, apply_edits, merge_tracks, play_history, record_play, set_color, set_rating, EditField, FieldEdit};
use super::playlists::{add_tracks, create_playlist, entries_page};
use super::tag_writer::{preview, write_tags};
use super::test_support::{pool, write_wav_tagged};
use super::{import_paths, list_query, LibraryTrack, ListQuery};

async fn tracks(pool: &SqlitePool) -> Vec<LibraryTrack> {
    let query = ListQuery { search: "", filter: None, filters: None, sort: None };
    list_query(pool, &query, 0).await.unwrap().tracks
}

fn edit(field: EditField, value: &str) -> FieldEdit {
    FieldEdit { field, value: Some(value.to_owned()) }
}

#[tokio::test]
async fn writing_tags_is_recoverable_and_only_touches_edited_files() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let (a, b) = (dir.path().join("a.wav"), dir.path().join("b.wav"));
    write_wav_tagged(&a, &[("INAM", "Song"), ("IART", "Old Artist")]);
    write_wav_tagged(&b, &[("INAM", "Other"), ("IART", "Untouched")]);
    import_paths(&pool, vec![a.clone(), b.clone()]).await;
    let all = tracks(&pool).await;
    let id_of = |t: &str| all.iter().find(|x| x.title == t).unwrap().id.clone();
    let (ida, idb) = (id_of("Song"), id_of("Other"));
    apply_edits(&pool, &[ida.clone()], &[edit(EditField::Artist, "New Artist"), edit(EditField::Album, "Album X"), edit(EditField::Year, "2001"), edit(EditField::Genre, "House"), edit(EditField::Comment, "note"), edit(EditField::AlbumArtist, "Various"), edit(EditField::TrackNo, "3"), edit(EditField::DiscNo, "2")]).await.unwrap();
    let original_b = std::fs::read(&b).unwrap();
    let original_a = std::fs::read(&a).unwrap();

    let p = preview(&pool, &[ida.clone(), idb.clone()]).await.unwrap();
    assert_eq!((p.writable, p.no_edits), (1, 1));

    let result = write_tags(&pool, &[ida.clone(), idb.clone()], true).await.unwrap();
    assert_eq!((result.written, result.failed.len()), (1, 0), "{:?}", result.failed);
    assert_eq!(std::fs::read(&b).unwrap(), original_b, "files without edits are never touched");
    assert_ne!(std::fs::read(&a).unwrap(), original_a);
    let backup = dir.path().join("a.wav.tahti-backup");
    assert_eq!(std::fs::read(&backup).unwrap(), original_a, "the original is kept as a backup");
    assert!(!dir.path().join("a.tahti-tmp.wav").exists(), "no temp file is left behind");
    assert_eq!(result.edits_settled + result.edits_kept, 8);

    // The file now really holds the tags: a fresh import (catalog untouched by edits) sees them
    // or, if this app's reader cannot see them in this container, the edits are kept as overrides.
    let fresh = pool_after(&a).await;
    let _ = &fresh;
    let t = fresh.iter().find(|t| t.title == "Song").unwrap();
    assert_eq!(t.artist, "New Artist");
    assert_eq!(t.album, "Album X");
    assert_eq!(t.year, Some(2001));
    assert_eq!((t.genre.as_str(), t.comment.as_str()), ("House", "note"));
    assert_eq!(t.track_no, Some(3));
    // WAV's INFO chunk has no album artist or disc number: reported, and the
    // catalog keeps those two edits.
    assert_eq!(result.fields_unsupported, 2);
    assert_eq!(result.edits_kept, 2);
    assert_eq!(result.edits_settled, 6);
    assert_eq!(std::fs::read(&b).unwrap(), original_b);
    // The backup is not picked up as a library file.
    assert!(!super::is_supported_audio_file(&backup));
    let _ = idb;
}

async fn pool_after(path: &std::path::Path) -> Vec<LibraryTrack> {
    let fresh = pool().await;
    import_paths(&fresh, vec![path.to_path_buf()]).await;
    tracks(&fresh).await
}

#[tokio::test]
async fn unsupported_read_only_and_missing_files_are_skipped_with_a_reason() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let (a, b) = (dir.path().join("a.wav"), dir.path().join("b.wav"));
    write_wav_tagged(&a, &[("INAM", "A"), ("IART", "x")]);
    write_wav_tagged(&b, &[("INAM", "B"), ("IART", "x")]);
    import_paths(&pool, vec![a.clone(), b.clone()]).await;
    let ids: Vec<String> = tracks(&pool).await.into_iter().map(|t| t.id).collect();
    apply_edits(&pool, &ids, &[edit(EditField::Genre, "House")]).await.unwrap();
    let mut perms = std::fs::metadata(&a).unwrap().permissions();
    perms.set_readonly(true);
    std::fs::set_permissions(&a, perms).unwrap();
    std::fs::remove_file(&b).unwrap();

    let result = write_tags(&pool, &ids, true).await.unwrap();
    assert_eq!(result.written, 0);
    let reasons: Vec<&str> = result.skipped.iter().map(|s| s.reason.as_str()).collect();
    assert!(reasons.contains(&"The file is read-only"), "{reasons:?}");
    assert!(reasons.contains(&"The file is missing"), "{reasons:?}");

    let mut perms = std::fs::metadata(&a).unwrap().permissions();
    #[allow(clippy::permissions_set_readonly_false)]
    perms.set_readonly(false);
    std::fs::set_permissions(&a, perms).unwrap();
}

#[tokio::test]
async fn a_failed_write_leaves_the_original_untouched() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let a = dir.path().join("a.wav");
    write_wav_tagged(&a, &[("INAM", "A"), ("IART", "x")]);
    import_paths(&pool, vec![a.clone()]).await;
    let id = tracks(&pool).await[0].id.clone();
    apply_edits(&pool, &[id.clone()], &[edit(EditField::Genre, "House")]).await.unwrap();
    // Corrupt the file after import so tagging cannot succeed.
    std::fs::write(&a, b"not audio at all").unwrap();
    let result = write_tags(&pool, &[id], true).await.unwrap();
    assert_eq!((result.written, result.failed.len()), (0, 1));
    assert_eq!(std::fs::read(&a).unwrap(), b"not audio at all");
    assert!(!dir.path().join("a.tahti-tmp.wav").exists());
    assert!(!dir.path().join("a.wav.tahti-backup").exists());
}

#[tokio::test]
async fn merging_duplicates_keeps_the_best_user_data_and_moves_playlist_entries() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let (a, b) = (dir.path().join("a.wav"), dir.path().join("b.wav"));
    write_wav_tagged(&a, &[("INAM", "Keep"), ("IART", "x")]);
    write_wav_tagged(&b, &[("INAM", "Drop"), ("IART", "x")]);
    import_paths(&pool, vec![a, b]).await;
    let all = tracks(&pool).await;
    let keep = all.iter().find(|t| t.title == "Keep").unwrap().id.clone();
    let drop = all.iter().find(|t| t.title == "Drop").unwrap().id.clone();
    set_rating(&pool, &[keep.clone()], 2).await.unwrap();
    set_rating(&pool, &[drop.clone()], 5).await.unwrap();
    set_color(&pool, &[drop.clone()], "red").await.unwrap();
    add_tag(&pool, &[keep.clone()], "one").await.unwrap();
    add_tag(&pool, &[drop.clone()], "two").await.unwrap();
    record_play(&pool, &keep).await.unwrap();
    record_play(&pool, &drop).await.unwrap();
    record_play(&pool, &drop).await.unwrap();
    let playlist = create_playlist(&pool, "Set").await.unwrap();
    add_tracks(&pool, &playlist.id, &[drop.clone(), keep.clone()], None).await.unwrap();

    let result = merge_tracks(&pool, &keep, &[drop.clone(), keep.clone()]).await.unwrap();
    assert_eq!((result.removed, result.playlist_entries_moved), (1, 1));
    let left = tracks(&pool).await;
    assert_eq!(left.len(), 1);
    let t = &left[0];
    assert_eq!((t.rating, t.color.as_str(), t.play_count), (5, "red", 3));
    let tags: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM library_track_tags WHERE track_id=?").bind(&keep).fetch_one(&pool).await.unwrap();
    assert_eq!(tags, 2);
    let page = entries_page(&pool, &playlist.id, 0).await.unwrap();
    assert!(page.entries.iter().all(|e| e.track.as_ref().map(|t| t.id.as_str()) == Some(keep.as_str())));
    assert_eq!(page.entries.len(), 2, "both playlist slots survive");
    assert_eq!(play_history(&pool, 0).await.unwrap().total, 3);
    assert!(merge_tracks(&pool, "nope", &[]).await.is_err());
}

#[tokio::test]
async fn play_history_lists_newest_first_and_survives_track_removal() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let a = dir.path().join("a.wav");
    write_wav_tagged(&a, &[("INAM", "A"), ("IART", "x")]);
    import_paths(&pool, vec![a]).await;
    let id = tracks(&pool).await[0].id.clone();
    record_play(&pool, &id).await.unwrap();
    record_play(&pool, &id).await.unwrap();
    record_play(&pool, "unknown").await.unwrap();
    super::remove(&pool, &id).await.unwrap();
    let page = play_history(&pool, 0).await.unwrap();
    assert_eq!(page.total, 2, "an unknown track logs nothing");
    assert_eq!(page.entries[0].title, "A");
    assert!(page.entries[0].track_id.is_none());
    assert!(page.entries[0].id > page.entries[1].id);
}


#[tokio::test]
async fn flac_reads_vorbis_comments_and_round_trips_written_tags() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("tone.flac");
    std::fs::copy(concat!(env!("CARGO_MANIFEST_DIR"), "/src/local_library/fixtures/tone.flac"), &path).unwrap();
    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    let t = tracks(&pool).await.remove(0);
    assert_eq!((t.title.as_str(), t.artist.as_str(), t.album.as_str()), ("Flac Song", "Flac Artist", "Flac Album"));
    assert_eq!((t.track_no, t.year), (Some(4), Some(2011)));

    apply_edits(&pool, &[t.id.clone()], &[
        edit(EditField::Title, "Fixed Title"), edit(EditField::AlbumArtist, "Various"), edit(EditField::DiscNo, "2"),
        edit(EditField::Genre, "Ambient"), edit(EditField::Year, "1999"), edit(EditField::TrackNo, "7"), edit(EditField::Comment, "hi"),
    ]).await.unwrap();
    let original = std::fs::read(&path).unwrap();
    let result = write_tags(&pool, &[t.id.clone()], true).await.unwrap();
    assert_eq!((result.written, result.failed.len(), result.fields_unsupported), (1, 0, 0), "{:?}", result.failed);
    assert_eq!(result.edits_settled, 7, "every FLAC edit is visible to the app's own reader");
    assert_eq!(std::fs::read(dir.path().join("tone.flac.tahti-backup")).unwrap(), original);

    // A brand-new catalog reading the rewritten file sees the edits with no overrides at all.
    let fresh = pool_after(&path).await;
    let f = &fresh[0];
    assert_eq!((f.title.as_str(), f.album_artist.as_str(), f.genre.as_str(), f.comment.as_str()), ("Fixed Title", "Various", "Ambient", "hi"));
    assert_eq!((f.year, f.track_no, f.disc_no), (Some(1999), Some(7), Some(2)));
    assert_eq!(f.album, "Flac Album", "untouched tags survive the write");
    let left: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM library_track_overrides").fetch_one(&pool).await.unwrap();
    assert_eq!(left, 0);
}
