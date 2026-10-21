use super::test_support::{import_into_root, pool, write_wav};
use super::{
    add_root, discover_new_paths, facets, get_root, import_paths, list, list_roots,
    list_unavailable, refresh_root_availability, relink_root, remove_root, resolve_path, FacetKind,
};

#[tokio::test]
async fn disconnected_root_leaves_other_roots_resolvable() {
    let dir = tempfile::tempdir().unwrap();
    let connected = dir.path().join("connected.wav");
    let removable_root = dir.path().join("removable-drive");
    std::fs::create_dir_all(&removable_root).unwrap();
    let disconnected = removable_root.join("disconnected.wav");
    write_wav(&connected, "Connected", "Artist");
    write_wav(&disconnected, "Disconnected", "Artist");

    let pool = pool().await;
    import_paths(&pool, vec![connected.clone(), disconnected.clone()]).await;
    let page = list(&pool, "", 0).await.unwrap();
    let connected_id = page
        .tracks
        .iter()
        .find(|track| track.title == "Connected")
        .unwrap()
        .id
        .clone();
    let disconnected_id = page
        .tracks
        .iter()
        .find(|track| track.title == "Disconnected")
        .unwrap()
        .id
        .clone();

    // Simulate the removable drive going away: only that root's file
    // resolves as unavailable; the rest of the catalog is unaffected.
    std::fs::remove_dir_all(&removable_root).unwrap();
    assert!(resolve_path(&pool, &connected_id).await.is_ok());
    assert!(resolve_path(&pool, &disconnected_id).await.is_err());
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 2);
}

#[tokio::test]
async fn add_root_is_idempotent_and_reports_counts() {
    let dir = tempfile::tempdir().unwrap();
    write_wav(&dir.path().join("a.wav"), "A", "Artist");
    let pool = pool().await;

    let first = add_root(&pool, dir.path()).await.unwrap();
    let second = add_root(&pool, dir.path()).await.unwrap();
    assert_eq!(first.id, second.id);
    assert_eq!(list_roots(&pool).await.unwrap().len(), 1);
    assert!(first.available);
    assert_eq!(first.track_count, 0);

    let (fresh, _) = discover_new_paths(&pool, &first).await.unwrap();
    import_into_root(&pool, &first.id, fresh).await;
    assert_eq!(get_root(&pool, &first.id).await.unwrap().track_count, 1);
}

#[tokio::test]
async fn rescan_discovers_only_new_files() {
    let dir = tempfile::tempdir().unwrap();
    write_wav(&dir.path().join("a.wav"), "A", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();

    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    assert_eq!(fresh.len(), 1);
    import_into_root(&pool, &root.id, fresh).await;

    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    assert!(fresh.is_empty(), "second scan with no changes finds nothing (idempotent)");

    let nested = dir.path().join("New Album");
    std::fs::create_dir_all(&nested).unwrap();
    write_wav(&nested.join("b.wav"), "B", "Artist");
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    assert_eq!(fresh.len(), 1, "only the newly added file is discovered");
}

#[tokio::test]
async fn ad_hoc_imports_under_a_root_are_adopted_on_scan() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("a.wav");
    write_wav(&path, "A", "Artist");
    let pool = pool().await;
    import_paths(&pool, vec![path]).await; // root_id NULL

    let root = add_root(&pool, dir.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    assert_eq!(fresh.len(), 1, "not yet a member, so re-read once");
    import_into_root(&pool, &root.id, fresh).await;

    assert_eq!(list(&pool, "", 0).await.unwrap().total, 1, "adopted, not duplicated");
    assert_eq!(get_root(&pool, &root.id).await.unwrap().track_count, 1);
}

#[tokio::test]
async fn root_availability_tracks_missing_and_recovered_files() {
    let dir = tempfile::tempdir().unwrap();
    let a = dir.path().join("a.wav");
    let b = dir.path().join("b.wav");
    write_wav(&a, "A", "Artist");
    write_wav(&b, "B", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;

    assert_eq!(refresh_root_availability(&pool, &root.id).await.unwrap(), (0, 0));

    let stash = dir.path().join("b.wav.bak");
    std::fs::rename(&b, &stash).unwrap();
    assert_eq!(refresh_root_availability(&pool, &root.id).await.unwrap(), (1, 0));
    assert_eq!(get_root(&pool, &root.id).await.unwrap().missing_count, 1);
    assert_eq!(list_unavailable(&pool).await.unwrap().len(), 1);
    assert_eq!(refresh_root_availability(&pool, &root.id).await.unwrap(), (0, 0), "no repeat flapping");

    std::fs::rename(&stash, &b).unwrap();
    assert_eq!(refresh_root_availability(&pool, &root.id).await.unwrap(), (0, 1));
    assert_eq!(get_root(&pool, &root.id).await.unwrap().missing_count, 0);
}

#[tokio::test]
async fn removing_a_root_keeps_its_tracks() {
    let dir = tempfile::tempdir().unwrap();
    write_wav(&dir.path().join("a.wav"), "A", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, dir.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;

    remove_root(&pool, &root.id).await.unwrap();

    assert!(list_roots(&pool).await.unwrap().is_empty());
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 1);
    assert!(get_root(&pool, &root.id).await.is_err());
}

#[tokio::test]
async fn relinking_a_root_moves_proven_tracks_and_keeps_ids() {
    let old = tempfile::tempdir().unwrap();
    std::fs::create_dir_all(old.path().join("Album")).unwrap();
    write_wav(&old.path().join("Album/one.wav"), "One", "Artist");
    write_wav(&old.path().join("two.wav"), "Two", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, old.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;
    let ids_before: Vec<String> = list(&pool, "", 0).await.unwrap().tracks.into_iter().map(|t| t.id).collect();

    // The drive "moves": same layout at a new location; one file is missing there.
    let new = tempfile::tempdir().unwrap();
    std::fs::create_dir_all(new.path().join("Album")).unwrap();
    std::fs::copy(old.path().join("Album/one.wav"), new.path().join("Album/one.wav")).unwrap();
    std::fs::remove_dir_all(old.path().join("Album")).unwrap();
    std::fs::remove_file(old.path().join("two.wav")).unwrap();

    let result = relink_root(&pool, &root.id, new.path()).await.unwrap();

    assert_eq!(result.relinked, 1);
    assert_eq!(result.unmatched, 1);
    assert!(result.root.path.starts_with(new.path().canonicalize().unwrap().to_str().unwrap()));
    let after = list(&pool, "", 0).await.unwrap().tracks;
    let ids_after: Vec<String> = after.iter().map(|t| t.id.clone()).collect();
    assert_eq!(ids_before.len(), ids_after.len());
    let one = after.iter().find(|t| t.title == "One").unwrap();
    assert!(one.available);
    assert!(one.path.starts_with(new.path().canonicalize().unwrap().to_str().unwrap()));
}

#[tokio::test]
async fn relinking_to_a_folder_with_no_matching_files_is_rejected() {
    let old = tempfile::tempdir().unwrap();
    write_wav(&old.path().join("a.wav"), "A", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, old.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;

    let wrong = tempfile::tempdir().unwrap();
    let error = relink_root(&pool, &root.id, wrong.path()).await.unwrap_err();
    assert!(error.contains("None of this root"), "{error}");
    assert_eq!(get_root(&pool, &root.id).await.unwrap().path, root.path, "root unchanged");
}

#[tokio::test]
async fn relinking_onto_another_existing_root_is_rejected() {
    let a = tempfile::tempdir().unwrap();
    let b = tempfile::tempdir().unwrap();
    let pool = pool().await;
    let root_a = add_root(&pool, a.path()).await.unwrap();
    add_root(&pool, b.path()).await.unwrap();
    assert!(relink_root(&pool, &root_a.id, b.path()).await.is_err());
}

#[tokio::test]
async fn folder_follows_a_root_relink() {
    let old = tempfile::tempdir().unwrap();
    std::fs::create_dir_all(old.path().join("Album")).unwrap();
    write_wav(&old.path().join("Album/one.wav"), "One", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, old.path()).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;

    let new = tempfile::tempdir().unwrap();
    std::fs::create_dir_all(new.path().join("Album")).unwrap();
    std::fs::copy(old.path().join("Album/one.wav"), new.path().join("Album/one.wav")).unwrap();
    relink_root(&pool, &root.id, new.path()).await.unwrap();

    let folders = facets(&pool, FacetKind::Folders).await.unwrap();
    assert_eq!(folders.len(), 1);
    assert!(folders[0].name.starts_with(new.path().canonicalize().unwrap().to_str().unwrap()));
}

#[tokio::test]
async fn a_root_on_an_unplugged_drive_goes_missing_and_recovers_with_ids_intact() {
    let dir = tempfile::tempdir().unwrap();
    let root_dir = dir.path().join("Külmä levy 🎧");
    std::fs::create_dir_all(&root_dir).unwrap();
    write_wav(&root_dir.join("楽曲.wav"), "A", "Artist");
    let pool = pool().await;
    let root = add_root(&pool, &root_dir).await.unwrap();
    let (fresh, _) = discover_new_paths(&pool, &root).await.unwrap();
    import_into_root(&pool, &root.id, fresh).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();

    let away = dir.path().join("unplugged");
    std::fs::rename(&root_dir, &away).unwrap();
    refresh_root_availability(&pool, &root.id).await.unwrap();
    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!((page.total, page.tracks[0].available), (1, false), "kept, marked missing");

    std::fs::rename(&away, &root_dir).unwrap();
    refresh_root_availability(&pool, &root.id).await.unwrap();
    let page = list(&pool, "", 0).await.unwrap();
    assert_eq!((page.tracks[0].id.clone(), page.tracks[0].available), (id, true));
}
