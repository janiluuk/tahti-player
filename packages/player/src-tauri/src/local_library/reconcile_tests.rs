use super::test_support::{import_into_root, pool, write_wav};
use super::{add_root, discover_new_paths, list};

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
async fn a_file_renamed_and_re_tagged_at_once_keeps_its_catalog_id() {
    use super::analysis_tests::write_kick_wav;
    let dir = tempfile::tempdir().unwrap();
    let old = dir.path().join("a.wav");
    write_kick_wav(&old, 120.0, 3.0, "House");
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;
    super::reconcile::refresh_changed(&pool, &root).await.unwrap();
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    let size_before = std::fs::metadata(&old).unwrap().len();

    // A tagger renames the file and rewrites its tags: new name, new size, new mtime.
    std::fs::remove_file(&old).unwrap();
    let new = dir.path().join("01 - Renamed.wav");
    write_kick_wav(&new, 120.0, 3.0, "Deep House Classics");
    assert_ne!(std::fs::metadata(&new).unwrap().len(), size_before);

    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    let (moved, rest) = super::reconcile::relink_moved(&pool, &root, fresh).await.unwrap();
    assert_eq!(moved, 1);
    assert!(rest.is_empty(), "not imported a second time");
    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!(page.total, 1);
    assert_eq!(page.tracks[0].id, id, "same catalog id, so playlists and ratings stay");
    assert!(page.tracks[0].path.ends_with("01 - Renamed.wav"));
}

#[test]
fn two_copies_of_one_recording_are_never_paired_by_their_audio() {
    use super::reconcile::{audio_key, pair_retagged};
    let key = audio_key("WAV", 44_100, 183.25).unwrap();
    let vanished = vec![("a".to_owned(), key.clone()), ("b".to_owned(), key.clone())];
    let fresh = vec![(std::path::PathBuf::from("x.wav"), key.clone())];
    assert!(pair_retagged(&vanished, &fresh).is_empty());
    assert_eq!(pair_retagged(&vanished[..1], &fresh).len(), 1);
    assert!(audio_key("wav", 44_100, 0.4).is_none(), "very short clips are too easy to confuse");
}

#[tokio::test]
async fn a_renamed_and_re_tagged_file_shows_its_new_tags_and_keeps_user_edits() {
    use super::analysis_tests::write_kick_wav;
    use super::catalog::{apply_edits, EditField, FieldEdit};
    let dir = tempfile::tempdir().unwrap();
    let old = dir.path().join("a.wav");
    write_kick_wav(&old, 120.0, 3.0, "House");
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;
    super::reconcile::refresh_changed(&pool, &root).await.unwrap();
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    let title = FieldEdit { field: EditField::Title, value: Some("My Title".into()) };
    apply_edits(&pool, &[id.clone()], &[title]).await.unwrap();

    std::fs::remove_file(&old).unwrap();
    write_kick_wav(&dir.path().join("01 - Renamed.wav"), 120.0, 3.0, "Deep House Classics");
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    let (moved, _) = super::reconcile::relink_moved(&pool, &root, fresh).await.unwrap();
    assert_eq!(moved, 1);

    let track = list(&pool, "", 0).await.unwrap().tracks.remove(0);
    assert_eq!(track.id, id);
    assert_eq!(track.genre, "Deep House Classics", "the new tags are read, not the old ones kept");
    assert_eq!(track.title, "My Title", "the user's edit still wins over the file");
    assert_eq!(super::reconcile::refresh_changed(&pool, &root).await.unwrap(), 0, "not read a second time");
}

async fn root_of(pool: &sqlx::SqlitePool, id: &str) -> Option<String> {
    sqlx::query_scalar("SELECT root_id FROM library_tracks WHERE id = ?").bind(id).fetch_one(pool).await.unwrap()
}

#[tokio::test]
async fn a_file_moved_to_another_watched_folder_keeps_its_catalog_id() {
    let a = tempfile::tempdir().unwrap();
    let b = tempfile::tempdir().unwrap();
    let old = a.path().join("song.wav");
    write_wav(&old, "Song", "Artist");
    let pool = pool().await;
    let root_a = add_root(&pool, a.path()).await.unwrap();
    let root_b = add_root(&pool, b.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root_a).await.unwrap();
    import_into_root(&pool, &root_a.id, fresh).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();

    std::fs::copy(&old, b.path().join("song.wav")).unwrap();
    std::fs::remove_file(&old).unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root_b).await.unwrap();
    let (moved, rest) = super::reconcile::relink_moved(&pool, &root_b, fresh).await.unwrap();
    assert_eq!(moved, 1);
    assert!(rest.is_empty(), "not imported a second time");
    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!(page.total, 1);
    assert_eq!(page.tracks[0].id, id, "same catalog id, so playlists and ratings stay");
    assert!(page.tracks[0].available);
    assert_eq!(root_of(&pool, &id).await, Some(root_b.id.clone()), "now belongs to the folder it moved to");
    assert_eq!(super::refresh_root_availability(&pool, &root_a.id).await.unwrap(), (0, 0), "the old folder has nothing missing");
}

#[tokio::test]
async fn tracks_on_a_disconnected_watched_folder_are_never_moved_away() {
    let drive = tempfile::tempdir().unwrap();
    let a = drive.path().join("music");
    std::fs::create_dir_all(&a).unwrap();
    let b = tempfile::tempdir().unwrap();
    write_wav(&a.join("song.wav"), "Song", "Artist");
    let pool = pool().await;
    let root_a = add_root(&pool, &a).await.unwrap();
    let root_b = add_root(&pool, b.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root_a).await.unwrap();
    import_into_root(&pool, &root_a.id, fresh).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();

    std::fs::copy(a.join("song.wav"), b.path().join("song.wav")).unwrap();
    std::fs::rename(&a, drive.path().join("unplugged")).unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root_b).await.unwrap();
    let (moved, rest) = super::reconcile::relink_moved(&pool, &root_b, fresh).await.unwrap();
    assert_eq!(moved, 0);
    assert_eq!(rest.len(), 1, "the copy is a new file");
    assert_eq!(root_of(&pool, &id).await, Some(root_a.id.clone()));
}
