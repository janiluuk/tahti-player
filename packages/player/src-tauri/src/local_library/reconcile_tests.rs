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
