use super::test_support::write_wav;
use super::{import_paths, list};

#[tokio::test]
async fn reopening_the_catalog_file_keeps_its_data_and_migrations_are_idempotent() {
    let dir = tempfile::tempdir().unwrap();
    let db = dir.path().join("nested").join("library.db");
    let music = dir.path().join("a.wav");
    write_wav(&music, "A", "Artist");
    let first = super::open(&db).await.unwrap();
    assert_eq!(import_paths(&first, vec![music]).await.imported, 1);
    first.close().await;

    // Offline startup: no network or other file is needed to open the catalog.
    let second = super::open(&db).await.unwrap();
    let page = list(&second, "", 0).await.unwrap();
    assert_eq!((page.total, page.tracks[0].title.as_str()), (1, "A"));
}

#[tokio::test]
async fn a_corrupt_catalog_is_set_aside_and_the_library_starts_fresh() {
    let dir = tempfile::tempdir().unwrap();
    let db = dir.path().join("library.db");
    std::fs::write(&db, b"this is not a sqlite database, just noise").unwrap();

    let (pool, moved) = super::open_recovering(&db).await.unwrap();
    let moved = moved.expect("the damaged file is reported");
    assert_eq!(std::fs::read(&moved).unwrap(), b"this is not a sqlite database, just noise");
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 0);
    pool.close().await;

    // A healthy catalog is never touched.
    let (pool, moved) = super::open_recovering(&db).await.unwrap();
    assert!(moved.is_none());
    pool.close().await;
}

#[tokio::test]
async fn a_healthy_catalog_with_an_unknown_migration_is_not_treated_as_corrupt() {
    let dir = tempfile::tempdir().unwrap();
    let db = dir.path().join("library.db");
    let first = super::open(&db).await.unwrap();
    // As if a newer app version had migrated it further.
    sqlx::query("INSERT INTO _sqlx_migrations (version, description, success, checksum, execution_time) VALUES (99999, 'future', 1, x'00', 0)")
        .execute(&first)
        .await
        .unwrap();
    first.close().await;

    assert!(super::open_recovering(&db).await.is_err(), "left as an error, not wiped");
    assert!(db.exists(), "the newer catalog stays where it is");
    let leftovers = std::fs::read_dir(dir.path()).unwrap().filter_map(Result::ok)
        .filter(|e| e.file_name().to_string_lossy().contains("corrupt")).count();
    assert_eq!(leftovers, 0);
}
