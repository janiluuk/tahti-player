use std::path::{Path, PathBuf};

use sqlx::SqlitePool;

use super::catalog::{
    add_tag, apply_edits, duplicate_groups, edit_preview, field_summary, hash_tracks, list_tags,
    provenance, record_play, remove_tag, restore_edits, restore_user_data, set_color, set_rating,
    DuplicateKind, EditField, FieldEdit,
};
use super::test_support::{pool, write_wav_tagged};
use super::{import_paths, list_query, ListQuery, LibraryTrack, SortColumn, TrackFilters, TrackSort};

fn edit(field: EditField, value: &str) -> FieldEdit {
    FieldEdit { field, value: Some(value.to_owned()) }
}

fn revert(field: EditField) -> FieldEdit {
    FieldEdit { field, value: None }
}

/// An album of three tracks in `dir`, imported; returns their ids in track order.
async fn album(pool: &SqlitePool, dir: &Path) -> Vec<String> {
    let mut paths = Vec::new();
    for (i, title) in ["One", "Two", "Three"].iter().enumerate() {
        let path = dir.join(format!("{i}.wav"));
        write_wav_tagged(&path, &[("INAM", title), ("IART", "Old Artist"), ("IPRD", "Old Album")]);
        paths.push(path);
    }
    let result = import_paths(pool, paths).await;
    assert_eq!(result.imported, 3);
    all_tracks(pool).await.into_iter().map(|t| t.id).collect()
}

async fn all_tracks(pool: &SqlitePool) -> Vec<LibraryTrack> {
    let query = ListQuery { search: "", filter: None, filters: None, sort: None };
    list_query(pool, &query, 0).await.unwrap().tracks
}

async fn track(pool: &SqlitePool, id: &str) -> LibraryTrack {
    all_tracks(pool).await.into_iter().find(|t| t.id == id).unwrap()
}

#[tokio::test]
async fn bulk_edit_changes_every_track_and_undo_restores_exactly() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let ids = album(&pool, dir.path()).await;

    let outcome = apply_edits(&pool, &ids, &[edit(EditField::Album, "New Album"), edit(EditField::Year, "1999")])
        .await
        .unwrap();
    assert_eq!(outcome.tracks_changed, 3);
    for id in &ids {
        let t = track(&pool, id).await;
        assert_eq!((t.album.as_str(), t.year), ("New Album", Some(1999)));
    }

    let restored = restore_edits(&pool, &outcome.undo).await.unwrap();
    assert_eq!(restored, 6);
    for id in &ids {
        let t = track(&pool, id).await;
        assert_eq!((t.album.as_str(), t.year), ("Old Album", None));
    }
    let leftovers: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM library_track_overrides")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(leftovers, 0, "undo must not leave override rows behind");
}

#[tokio::test]
async fn a_rescan_keeps_edits_and_tracks_the_new_file_tag() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let ids = album(&pool, dir.path()).await;
    apply_edits(&pool, &ids[..1], &[edit(EditField::Artist, "Corrected"), edit(EditField::Title, "Fixed")])
        .await
        .unwrap();

    // The file's own tags change on disk, then the folder is imported again.
    let path: PathBuf = dir.path().join("0.wav");
    write_wav_tagged(&path, &[("INAM", "One"), ("IART", "Retagged Externally"), ("IPRD", "Old Album")]);
    import_paths(&pool, vec![path]).await;

    let t = track(&pool, &ids[0]).await;
    assert_eq!(t.artist, "Corrected", "the edit must survive a rescan");
    assert_eq!(t.title, "Fixed");
    let fields = provenance(&pool, &ids[0]).await.unwrap();
    let artist = fields.iter().find(|f| f.field == EditField::Artist).unwrap();
    assert!(artist.edited);
    assert_eq!(artist.file_value, "Retagged Externally", "provenance shows the file's latest tag");

    // Reverting now goes back to the *new* file tag, not the one from import time.
    apply_edits(&pool, &ids[..1], &[revert(EditField::Artist)]).await.unwrap();
    assert_eq!(track(&pool, &ids[0]).await.artist, "Retagged Externally");
}

#[tokio::test]
async fn an_edit_that_matches_the_file_tag_stops_being_an_override() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let ids = album(&pool, dir.path()).await;
    apply_edits(&pool, &ids[..1], &[edit(EditField::Artist, "Someone")]).await.unwrap();
    let path = dir.path().join("0.wav");
    write_wav_tagged(&path, &[("INAM", "One"), ("IART", "Someone"), ("IPRD", "Old Album")]);
    import_paths(&pool, vec![path]).await;

    let fields = provenance(&pool, &ids[0]).await.unwrap();
    assert!(!fields.iter().find(|f| f.field == EditField::Artist).unwrap().edited);
}

#[tokio::test]
async fn preview_reports_what_would_change_and_changes_nothing() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let ids = album(&pool, dir.path()).await;
    apply_edits(&pool, &ids[..1], &[edit(EditField::Genre, "House")]).await.unwrap();

    let preview = edit_preview(&pool, &ids, &[edit(EditField::Genre, "House")]).await.unwrap();
    assert_eq!((preview.tracks_changed, preview.tracks_unchanged), (2, 1));
    assert_eq!(preview.examples.len(), 2);
    assert_eq!(preview.examples[0].after, "House");

    for id in &ids[1..] {
        assert_eq!(track(&pool, id).await.genre, "", "a preview must not write");
    }
    let rows: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM library_track_overrides")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(rows, 1);
}

#[tokio::test]
async fn invalid_edits_are_rejected_before_anything_is_written() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let ids = album(&pool, dir.path()).await;

    assert!(apply_edits(&pool, &ids, &[edit(EditField::Album, "Fine"), edit(EditField::Year, "abc")]).await.is_err());
    assert!(apply_edits(&pool, &ids, &[edit(EditField::Year, "12")]).await.is_err());
    assert!(apply_edits(&pool, &ids, &[edit(EditField::Title, "  ")]).await.is_err());
    assert_eq!(track(&pool, &ids[0]).await.album, "Old Album");
    // Clearing a number is allowed and stored as empty.
    apply_edits(&pool, &ids, &[edit(EditField::TrackNo, "")]).await.unwrap();
}

#[tokio::test]
async fn field_summary_flags_mixed_values_and_counts_edits() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let ids = album(&pool, dir.path()).await;
    apply_edits(&pool, &ids[..1], &[edit(EditField::Genre, "House")]).await.unwrap();

    let summary = field_summary(&pool, &ids).await.unwrap();
    let get = |f: EditField| summary.iter().find(|s| s.field == f).unwrap();
    assert_eq!(get(EditField::Album).distinct, 1);
    assert_eq!(get(EditField::Album).value, "Old Album");
    assert_eq!(get(EditField::Title).distinct, 3);
    assert_eq!((get(EditField::Genre).distinct, get(EditField::Genre).edited), (2, 1));
}

#[tokio::test]
async fn edits_are_searchable_and_bulk_correct_then_undo_then_rescan_exit_demo() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let ids = album(&pool, dir.path()).await;

    let outcome = apply_edits(&pool, &ids, &[edit(EditField::Album, "Corrected Album")]).await.unwrap();
    let query = ListQuery { search: "Corrected", filter: None, filters: None, sort: None };
    assert_eq!(list_query(&pool, &query, 0).await.unwrap().total, 3, "the search index follows edits");
    restore_edits(&pool, &outcome.undo).await.unwrap();
    assert_eq!(list_query(&pool, &query, 0).await.unwrap().total, 0);

    apply_edits(&pool, &ids, &[edit(EditField::Album, "Final Album")]).await.unwrap();
    import_paths(&pool, (0..3).map(|i| dir.path().join(format!("{i}.wav"))).collect()).await;
    for id in &ids {
        assert_eq!(track(&pool, id).await.album, "Final Album");
    }
}

#[tokio::test]
async fn rating_color_and_tags_apply_undo_filter_and_sort() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let ids = album(&pool, dir.path()).await;

    set_rating(&pool, &ids[..1], 5).await.unwrap();
    let before = set_rating(&pool, &ids[1..2], 3).await.unwrap();
    assert_eq!(before[0].rating, 0);
    assert!(set_rating(&pool, &ids, 6).await.is_err());
    set_color(&pool, &ids[..2], "red").await.unwrap();
    assert!(set_color(&pool, &ids, "chartreuse").await.is_err());
    let tag_before = add_tag(&pool, &ids[..2], "  warm   up ").await.unwrap();
    assert!(tag_before.iter().all(|s| s.tags.is_empty()));
    add_tag(&pool, &ids[..1], "Peak").await.unwrap();

    let tags = list_tags(&pool).await.unwrap();
    assert_eq!(tags.iter().map(|t| (t.name.as_str(), t.tracks)).collect::<Vec<_>>(), vec![("Peak", 1), ("warm up", 2)]);

    let filters = TrackFilters { rating_min: Some(4), ..Default::default() };
    let query = ListQuery { search: "", filter: None, filters: Some(&filters), sort: None };
    assert_eq!(list_query(&pool, &query, 0).await.unwrap().total, 1);
    let filters = TrackFilters { color: Some("red".into()), tag: Some("WARM UP".into()), ..Default::default() };
    let query = ListQuery { search: "", filter: None, filters: Some(&filters), sort: None };
    assert_eq!(list_query(&pool, &query, 0).await.unwrap().total, 2, "tags match case-insensitively");
    let sort = TrackSort { column: SortColumn::Rating, descending: true };
    let query = ListQuery { search: "", filter: None, filters: None, sort: Some(&sort) };
    let ratings: Vec<i64> = list_query(&pool, &query, 0).await.unwrap().tracks.iter().map(|t| t.rating).collect();
    assert_eq!(ratings, vec![5, 3, 0]);

    // Undo everything for the first two tracks.
    let snapshots = crate::local_library::catalog::user_data(&pool, &ids[..2]).await.unwrap();
    assert_eq!(snapshots[0].tags, vec!["Peak", "warm up"]);
    restore_user_data(&pool, &tag_before).await.unwrap();
    let after = crate::local_library::catalog::user_data(&pool, &ids[..2]).await.unwrap();
    assert!(after.iter().all(|s| s.tags.is_empty()));
    assert!(list_tags(&pool).await.unwrap().is_empty(), "tags nobody carries disappear");

    remove_tag(&pool, &ids, "nothing").await.unwrap();
}

#[tokio::test]
async fn recording_a_play_counts_it_and_stamps_the_time() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let ids = album(&pool, dir.path()).await;
    record_play(&pool, &ids[0]).await.unwrap();
    record_play(&pool, &ids[0]).await.unwrap();
    let t = track(&pool, &ids[0]).await;
    assert_eq!(t.play_count, 2);
    assert!(t.last_played_at.is_some());
    assert_eq!(track(&pool, &ids[1]).await.play_count, 0);
}

#[tokio::test]
async fn duplicates_exact_by_hash_similar_by_metadata_never_confused() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    // Two byte-identical copies, plus two different recordings with the same name.
    let a = dir.path().join("a.wav");
    let b = dir.path().join("copy of a.wav");
    write_wav_tagged(&a, &[("INAM", "Song"), ("IART", "Band")]);
    std::fs::copy(&a, &b).unwrap();
    let c = dir.path().join("live.wav");
    write_wav_tagged(&c, &[("INAM", "Live Cut"), ("IART", "Band")]);
    let d = dir.path().join("live-2.wav");
    write_wav_tagged(&d, &[("INAM", "Live Cut"), ("IART", "Band"), ("ICMT", "different bytes")]);
    import_paths(&pool, vec![a, b, c, d]).await;

    // Before hashing nothing is claimed to be exact.
    let groups = duplicate_groups(&pool).await.unwrap();
    assert!(groups.iter().all(|g| g.kind == DuplicateKind::Similar && !g.confirmed_different));

    let result = hash_tracks(&pool, &[], &|| false, &|_| {}).await.unwrap();
    assert_eq!(result.hashed, 4);
    let again = hash_tracks(&pool, &[], &|| false, &|_| {}).await.unwrap();
    assert_eq!((again.hashed, again.already_current), (0, 4), "unchanged files are not hashed twice");

    let groups = duplicate_groups(&pool).await.unwrap();
    let exact: Vec<_> = groups.iter().filter(|g| g.kind == DuplicateKind::Exact).collect();
    assert_eq!(exact.len(), 1);
    assert_eq!(exact[0].tracks.len(), 2);
    let similar: Vec<_> = groups.iter().filter(|g| g.kind == DuplicateKind::Similar).collect();
    assert_eq!(similar.len(), 1, "the identical pair is not repeated as a suggestion");
    assert_eq!(similar[0].tracks.len(), 2);
    assert!(similar[0].confirmed_different, "same name, different bytes: reported as a non-duplicate");
    // Review only: every catalog row is still there.
    assert_eq!(all_tracks(&pool).await.len(), 4);
}

#[tokio::test]
async fn hashing_can_be_cancelled_and_a_changed_file_is_hashed_again() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let ids = album(&pool, dir.path()).await;
    let cancelled = hash_tracks(&pool, &ids, &|| true, &|_| {}).await.unwrap();
    assert!(cancelled.cancelled);
    assert_eq!(cancelled.hashed, 0);

    hash_tracks(&pool, &ids[..1], &|| false, &|_| {}).await.unwrap();
    let first: String = sqlx::query_scalar("SELECT content_hash FROM library_tracks WHERE id=?").bind(&ids[0]).fetch_one(&pool).await.unwrap();
    let path = dir.path().join("0.wav");
    write_wav_tagged(&path, &[("INAM", "One and a bit longer title"), ("IART", "Old Artist")]);
    hash_tracks(&pool, &ids[..1], &|| false, &|_| {}).await.unwrap();
    let second: String = sqlx::query_scalar("SELECT content_hash FROM library_tracks WHERE id=?").bind(&ids[0]).fetch_one(&pool).await.unwrap();
    assert_ne!(first, second);
}

/// Debug-build throughput of the duplicate hasher on ~1 GB of files; run with `--ignored --nocapture`.
#[tokio::test]
#[ignore = "writes ~1 GB; run explicitly"]
async fn hashing_throughput_on_large_files() {
    let dir = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let mut paths = Vec::new();
    for i in 0..4 {
        let path = dir.path().join(format!("big{i}.wav"));
        write_wav_tagged(&path, &[("INAM", &format!("Big {i}")), ("IART", "x")]);
        // Pad the file so the hash has real work to do (RIFF sizes are not validated by the importer).
        let mut file = std::fs::OpenOptions::new().append(true).open(&path).unwrap();
        let chunk = vec![7u8; 1 << 20];
        for _ in 0..256 {
            std::io::Write::write_all(&mut file, &chunk).unwrap();
        }
        paths.push(path);
    }
    import_paths(&pool, paths).await;
    let start = std::time::Instant::now();
    let result = hash_tracks(&pool, &[], &|| false, &|_| {}).await.unwrap();
    let secs = start.elapsed().as_secs_f64();
    println!("hashed {} files, 1 GiB in {secs:.2}s = {:.0} MiB/s (debug build)", result.hashed, 1024.0 / secs);
    assert_eq!(result.hashed, 4);
}
