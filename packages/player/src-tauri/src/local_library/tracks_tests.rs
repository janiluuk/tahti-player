use super::test_support::{pool, seed_generated_rows, write_wav};
use super::{
    import_paths, list, list_unavailable, matching_ids, relink, remove, remove_many,
    rescan_unavailable, resolve_path,
};

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
async fn resolve_path_persists_unavailable_state() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "Title", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    assert!(list(&pool, "", 0).await.unwrap().tracks[0].available);

    std::fs::remove_file(&path).unwrap();
    assert!(resolve_path(&pool, &id).await.is_err());

    // Unlike the transient error above, this must survive a fresh read --
    // Phase 1's relink UI needs to list missing tracks without re-resolving
    // every row on every page load.
    let row = list(&pool, "", 0)
        .await
        .unwrap()
        .tracks
        .into_iter()
        .next()
        .unwrap();
    assert!(!row.available);
    assert!(row.unavailable_since.is_some());

    let missing = list_unavailable(&pool).await.unwrap();
    assert_eq!(missing.len(), 1);
    assert_eq!(missing[0].id, id);
}

#[tokio::test]
async fn resolve_path_self_heals_once_file_returns() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "Title", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();

    std::fs::remove_file(&path).unwrap();
    assert!(resolve_path(&pool, &id).await.is_err());
    assert!(!list(&pool, "", 0).await.unwrap().tracks[0].available);

    // Reconnected drive / restored file: the next successful resolve clears
    // the missing state rather than leaving it stuck until a future re-scan.
    write_wav(&path, "Title", "Artist");
    assert!(resolve_path(&pool, &id).await.is_ok());
    let row = list(&pool, "", 0)
        .await
        .unwrap()
        .tracks
        .into_iter()
        .next()
        .unwrap();
    assert!(row.available);
    assert!(row.unavailable_since.is_none());
    assert_eq!(list_unavailable(&pool).await.unwrap().len(), 0);
}

#[tokio::test]
async fn reimporting_a_missing_track_clears_unavailable_state() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("song.wav");
    write_wav(&path, "First Title", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    std::fs::remove_file(&path).unwrap();
    resolve_path(&pool, &id).await.ok();
    assert!(!list(&pool, "", 0).await.unwrap().tracks[0].available);

    write_wav(&path, "Second Title", "Artist");
    import_paths(&pool, vec![path]).await;

    let row = list(&pool, "", 0)
        .await
        .unwrap()
        .tracks
        .into_iter()
        .next()
        .unwrap();
    assert!(row.available);
    assert!(row.unavailable_since.is_none());
    assert_eq!(row.title, "Second Title");
}

#[tokio::test]
async fn rescan_restores_returned_files_and_keeps_missing_files() {
    let dir = tempfile::tempdir().unwrap();
    let restored = dir.path().join("restored.wav");
    let missing = dir.path().join("missing.wav");
    write_wav(&restored, "Restored", "Artist");
    write_wav(&missing, "Missing", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![restored.clone(), missing.clone()]).await;
    let tracks = list(&pool, "", 0).await.unwrap().tracks;
    let restored_id = tracks
        .iter()
        .find(|track| track.title == "Restored")
        .unwrap()
        .id
        .clone();
    let missing_id = tracks
        .iter()
        .find(|track| track.title == "Missing")
        .unwrap()
        .id
        .clone();
    std::fs::remove_file(&restored).unwrap();
    std::fs::remove_file(&missing).unwrap();
    assert!(resolve_path(&pool, &restored_id).await.is_err());
    assert!(resolve_path(&pool, &missing_id).await.is_err());

    write_wav(&restored, "Restored", "Artist");
    let unavailable = rescan_unavailable(&pool).await.unwrap();

    assert_eq!(unavailable.len(), 1);
    assert_eq!(unavailable[0].id, missing_id);
    assert!(resolve_path(&pool, &restored_id).await.is_ok());
    assert_eq!(rescan_unavailable(&pool).await.unwrap().len(), 1);
}

#[tokio::test]
async fn relink_preserves_id_and_refreshes_metadata() {
    let dir = tempfile::tempdir().unwrap();
    let original = dir.path().join("original.wav");
    let replacement = dir.path().join("replacement.wav");
    write_wav(&original, "Old title", "Old artist");
    write_wav(&replacement, "New title", "New artist");

    let pool = pool().await;
    import_paths(&pool, vec![original.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    std::fs::remove_file(&original).unwrap();
    assert!(resolve_path(&pool, &id).await.is_err());

    let track = relink(&pool, &id, replacement.clone()).await.unwrap();

    assert_eq!(track.id, id);
    assert_eq!(
        std::fs::canonicalize(&track.path).unwrap(),
        std::fs::canonicalize(replacement).unwrap()
    );
    assert_eq!(track.title, "New title");
    assert_eq!(track.artist, "New artist");
    assert!(track.available);
    assert!(track.unavailable_since.is_none());
    assert_eq!(list_unavailable(&pool).await.unwrap().len(), 0);
    assert_eq!(resolve_path(&pool, &id).await.unwrap(), track.path);
}

#[tokio::test]
async fn relink_rejects_unknown_tracks_and_duplicate_paths() {
    let dir = tempfile::tempdir().unwrap();
    let first = dir.path().join("first.wav");
    let second = dir.path().join("second.wav");
    write_wav(&first, "First", "Artist");
    write_wav(&second, "Second", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![first.clone(), second.clone()]).await;
    let tracks = list(&pool, "", 0).await.unwrap().tracks;
    let first_id = tracks
        .iter()
        .find(|track| track.title == "First")
        .unwrap()
        .id
        .clone();

    assert_eq!(
        relink(&pool, "unknown", first).await.unwrap_err(),
        "Track is not in the library"
    );
    assert_eq!(
        relink(&pool, &first_id, second).await.unwrap_err(),
        "This file is already in your library as a different track."
    );
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 2);
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

#[tokio::test]
async fn remove_many_deletes_in_one_go_and_keeps_search_in_sync() {
    let pool = pool().await;
    seed_generated_rows(&pool, 1_200).await;
    let ids = matching_ids(&pool, "", None, None).await.unwrap();
    let doomed: Vec<String> = ids.iter().take(1_100).cloned().collect();

    let removed = remove_many(&pool, &doomed).await.unwrap();

    assert_eq!(removed, 1_100);
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 100);
    assert_eq!(remove_many(&pool, &doomed).await.unwrap(), 0, "already gone");
    assert_eq!(remove_many(&pool, &[]).await.unwrap(), 0);
    let kept = list(&pool, "Generated Track", 0).await.unwrap();
    assert_eq!(kept.total, 100, "search index followed the deletes");
}
