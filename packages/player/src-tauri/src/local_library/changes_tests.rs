use super::analysis_tests::write_kick_wav;
use super::catalog::{add_tag, record_play, set_rating};
use super::changes::change_version;
use super::smart_playlists::{save_smart, SmartDefinition};
use super::test_support::pool;
use super::{import_paths, SortColumn};

#[tokio::test]
async fn every_track_or_tag_write_moves_the_change_version() {
    let pool = pool().await;
    let dir = tempfile::tempdir().unwrap();
    let file = dir.path().join("track.wav");
    write_kick_wav(&file, 120.0, 2.0, "House");

    let start = change_version(&pool).await.unwrap();
    import_paths(&pool, vec![file.clone()]).await;
    let after_import = change_version(&pool).await.unwrap();
    assert!(after_import > start, "an import adds a track");

    let id: String = sqlx::query_scalar("SELECT id FROM library_tracks").fetch_one(&pool).await.unwrap();
    set_rating(&pool, std::slice::from_ref(&id), 4).await.unwrap();
    let after_rating = change_version(&pool).await.unwrap();
    assert!(after_rating > after_import, "a rating");

    add_tag(&pool, std::slice::from_ref(&id), "late night").await.unwrap();
    let after_tag = change_version(&pool).await.unwrap();
    assert!(after_tag > after_rating, "a tag");

    record_play(&pool, &id).await.unwrap();
    let after_play = change_version(&pool).await.unwrap();
    assert!(after_play > after_tag, "a play");

    let definition = SmartDefinition { name: "Any".into(), match_all: true, rules: vec![], sort: SortColumn::Title, descending: false, limit: None };
    save_smart(&pool, None, &definition).await.unwrap();
    assert_eq!(change_version(&pool).await.unwrap(), after_play, "saving a smart playlist changes no track");
}
