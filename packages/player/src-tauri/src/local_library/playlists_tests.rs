use sqlx::sqlite::SqlitePool;

use super::playlists::{
    add_tracks, create_playlist, delete_playlist, duplicate_playlist, entries_page, entry_ids,
    get_playlist, list_playlists, move_entries, playable_track_ids, remove_entries, rename_playlist,
    restore_entries, set_order,
};
use super::test_support::{entry_titles, pool, seed_generated_rows, seed_varied_rows, write_wav};
use super::{
    import_paths, list, matching_ids_query, relink, remove, ListQuery, SortColumn, TrackFilters,
    TrackSort,
};

/// `n` seeded tracks with ids gen-0..gen-n and titles "Generated Track 00000i".
async fn playlist_pool(n: usize) -> SqlitePool {
    let pool = pool().await;
    seed_generated_rows(&pool, n).await;
    pool
}

fn gen_ids(range: std::ops::Range<usize>) -> Vec<String> {
    range.map(|i| format!("gen-{i}")).collect()
}

fn short(title: &str) -> usize {
    title.rsplit(' ').next().unwrap().parse().unwrap()
}

#[tokio::test]
async fn playlists_are_created_renamed_and_kept_unique_ignoring_case() {
    let pool = pool().await;
    let a = create_playlist(&pool, "  Night drive  ").await.unwrap();
    assert_eq!(a.name, "Night drive");
    assert!(create_playlist(&pool, "night DRIVE").await.unwrap_err().contains("already exists"));
    assert!(create_playlist(&pool, "   ").await.unwrap_err().contains("name"));
    let b = create_playlist(&pool, "Focus").await.unwrap();
    assert!(rename_playlist(&pool, &b.id, "NIGHT drive").await.unwrap_err().contains("already exists"));
    assert_eq!(rename_playlist(&pool, &b.id, "Deep focus").await.unwrap().name, "Deep focus");
    assert!(rename_playlist(&pool, "nope", "x").await.is_err());
    let names: Vec<String> = list_playlists(&pool).await.unwrap().into_iter().map(|p| p.name).collect();
    assert_eq!(names, ["Deep focus", "Night drive"]);
}

#[tokio::test]
async fn adding_keeps_order_allows_repeats_and_can_insert_at_an_index() {
    let pool = playlist_pool(10).await;
    let p = create_playlist(&pool, "P").await.unwrap();
    let added = add_tracks(&pool, &p.id, &["gen-3".into(), "gen-1".into(), "gen-3".into(), "missing".into()], None).await.unwrap();
    assert_eq!(added, 3, "unknown ids skipped, repeats kept");
    assert_eq!(entry_titles(&pool, &p.id).await.iter().map(|t| short(t)).collect::<Vec<_>>(), [3, 1, 3]);

    add_tracks(&pool, &p.id, &["gen-8".into(), "gen-9".into()], Some(1)).await.unwrap();
    assert_eq!(entry_titles(&pool, &p.id).await.iter().map(|t| short(t)).collect::<Vec<_>>(), [3, 8, 9, 1, 3]);

    let ids = entry_ids(&pool, &p.id).await.unwrap();
    assert_eq!(ids.len(), 5);
    assert_eq!(ids.iter().collect::<std::collections::HashSet<_>>().len(), 5, "each entry has its own id");
    let summary = get_playlist(&pool, &p.id).await.unwrap();
    assert_eq!(summary.track_count, 5);
    assert!((summary.duration_sec - 900.0).abs() < 0.001);
}

#[tokio::test]
async fn moving_entries_keeps_the_block_order_and_counts_among_unmoved() {
    let pool = playlist_pool(8).await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &gen_ids(0..8), None).await.unwrap();
    let ids = entry_ids(&pool, &p.id).await.unwrap();
    let order = |pool: &SqlitePool| {
        let id = p.id.clone();
        let pool = pool.clone();
        async move { entry_titles(&pool, &id).await.iter().map(|t| short(t)).collect::<Vec<_>>() }
    };

    // Move 1 and 2 (given out of order) to sit before the entry that is 4th among the rest.
    move_entries(&pool, &p.id, &[ids[2].clone(), ids[1].clone()], 4).await.unwrap();
    assert_eq!(order(&pool).await, [0, 3, 4, 5, 1, 2, 6, 7]);
    move_entries(&pool, &p.id, &[ids[7].clone()], 0).await.unwrap();
    assert_eq!(order(&pool).await, [7, 0, 3, 4, 5, 1, 2, 6]);
    move_entries(&pool, &p.id, &[ids[7].clone()], 99).await.unwrap();
    assert_eq!(order(&pool).await, [0, 3, 4, 5, 1, 2, 6, 7], "past the end clamps");
    move_entries(&pool, &p.id, &[], 0).await.unwrap();
    move_entries(&pool, &p.id, &["nope".into()], 0).await.unwrap();
    assert_eq!(order(&pool).await, [0, 3, 4, 5, 1, 2, 6, 7]);
}

#[tokio::test]
async fn removing_returns_the_entries_and_restoring_undoes_it_exactly() {
    let pool = playlist_pool(6).await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &["gen-0".into(), "gen-1".into(), "gen-1".into(), "gen-2".into(), "gen-3".into()], None).await.unwrap();
    let before = entry_ids(&pool, &p.id).await.unwrap();

    let removed = remove_entries(&pool, &p.id, &[before[1].clone(), before[3].clone()]).await.unwrap();
    assert_eq!(removed.iter().map(|r| r.entry_id.clone()).collect::<Vec<_>>(), [before[1].clone(), before[3].clone()]);
    assert_eq!(entry_titles(&pool, &p.id).await.iter().map(|t| short(t)).collect::<Vec<_>>(), [0, 1, 3]);

    restore_entries(&pool, &p.id, &removed, &before).await.unwrap();
    assert_eq!(entry_ids(&pool, &p.id).await.unwrap(), before, "same ids, same order");
    restore_entries(&pool, &p.id, &removed, &before).await.unwrap();
    assert_eq!(entry_ids(&pool, &p.id).await.unwrap(), before, "idempotent");
}

#[tokio::test]
async fn set_order_undoes_a_move() {
    let pool = playlist_pool(5).await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &gen_ids(0..5), None).await.unwrap();
    let before = entry_ids(&pool, &p.id).await.unwrap();
    move_entries(&pool, &p.id, &[before[4].clone()], 0).await.unwrap();
    assert_ne!(entry_ids(&pool, &p.id).await.unwrap(), before);
    set_order(&pool, &p.id, &before).await.unwrap();
    assert_eq!(entry_ids(&pool, &p.id).await.unwrap(), before);
}

#[tokio::test]
async fn duplicating_copies_order_and_repeats_with_new_ids_and_unique_names() {
    let pool = playlist_pool(4).await;
    let p = create_playlist(&pool, "Mix").await.unwrap();
    add_tracks(&pool, &p.id, &["gen-2".into(), "gen-0".into(), "gen-2".into()], None).await.unwrap();

    let copy = duplicate_playlist(&pool, &p.id).await.unwrap();
    let copy2 = duplicate_playlist(&pool, &p.id).await.unwrap();
    assert_eq!((copy.name.as_str(), copy2.name.as_str()), ("Mix copy", "Mix copy 2"));
    assert_eq!(entry_titles(&pool, &copy.id).await, entry_titles(&pool, &p.id).await);
    let originals = entry_ids(&pool, &p.id).await.unwrap();
    assert!(entry_ids(&pool, &copy.id).await.unwrap().iter().all(|id| !originals.contains(id)));
    delete_playlist(&pool, &copy.id).await.unwrap();
    assert_eq!(entry_titles(&pool, &p.id).await.len(), 3, "deleting the copy leaves the original");
}

#[tokio::test]
async fn deleting_a_track_keeps_its_entries_visibly_unavailable_and_reimport_relinks_them() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("keep.wav");
    write_wav(&path, "Keep me", "Artist");
    let pool = pool().await;
    import_paths(&pool, vec![path.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &[id.clone(), id.clone()], None).await.unwrap();

    remove(&pool, &id).await.unwrap();
    let page = entries_page(&pool, &p.id, 1).await.unwrap(); // offset > 0: no relink pass
    assert_eq!(page.total, 2, "entries survive the track");
    assert!(page.entries.iter().all(|e| e.unavailable && e.track.is_none() && e.title == "Keep me"));
    assert_eq!(get_playlist(&pool, &p.id).await.unwrap().unavailable_count, 2);
    assert!(playable_track_ids(&pool, &p.id).await.unwrap().is_empty());

    import_paths(&pool, vec![path]).await; // same file comes back with a new track id
    let page = entries_page(&pool, &p.id, 0).await.unwrap();
    assert!(page.entries.iter().all(|e| !e.unavailable && e.track.is_some()), "relinked by path");
    assert_eq!(playable_track_ids(&pool, &p.id).await.unwrap().len(), 2);
}

#[tokio::test]
async fn missing_files_count_as_unavailable_but_keep_their_place() {
    let pool = playlist_pool(3).await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &gen_ids(0..3), None).await.unwrap();
    sqlx::query("UPDATE library_tracks SET available = 0 WHERE id = 'gen-1'").execute(&pool).await.unwrap();

    let page = entries_page(&pool, &p.id, 0).await.unwrap();
    assert_eq!(page.entries.iter().map(|e| e.unavailable).collect::<Vec<_>>(), [false, true, false]);
    assert_eq!(get_playlist(&pool, &p.id).await.unwrap().unavailable_count, 1);
    assert_eq!(playable_track_ids(&pool, &p.id).await.unwrap().len(), 3, "playback prep decides, entries stay");
}

#[tokio::test]
async fn relinking_a_track_keeps_playlist_membership() {
    let old = tempfile::tempdir().unwrap();
    let new = tempfile::tempdir().unwrap();
    let from = old.path().join("a.wav");
    let to = new.path().join("a.wav");
    write_wav(&from, "Moved", "Artist");
    std::fs::copy(&from, &to).unwrap();
    let pool = pool().await;
    import_paths(&pool, vec![from.clone()]).await;
    let id = list(&pool, "", 0).await.unwrap().tracks[0].id.clone();
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &[id.clone()], None).await.unwrap();
    std::fs::remove_file(&from).unwrap();

    relink(&pool, &id, to.clone()).await.unwrap();

    let page = entries_page(&pool, &p.id, 0).await.unwrap();
    assert_eq!(page.entries[0].track.as_ref().unwrap().id, id);
    assert!(page.entries[0].path.ends_with("a.wav") && !page.entries[0].unavailable);
}

#[tokio::test]
async fn deleting_a_playlist_removes_its_entries_but_never_tracks() {
    let pool = playlist_pool(3).await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &gen_ids(0..3), None).await.unwrap();
    delete_playlist(&pool, &p.id).await.unwrap();
    assert_eq!(sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM library_playlist_entries").fetch_one(&pool).await.unwrap(), 0);
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 3);
    assert!(get_playlist(&pool, &p.id).await.is_err());
}

#[tokio::test]
async fn long_playlists_page_in_order_without_gaps() {
    let pool = playlist_pool(450).await;
    let p = create_playlist(&pool, "Big").await.unwrap();
    add_tracks(&pool, &p.id, &gen_ids(0..450), None).await.unwrap();
    let ids = entry_ids(&pool, &p.id).await.unwrap();
    move_entries(&pool, &p.id, &[ids[449].clone()], 0).await.unwrap();
    let titles = entry_titles(&pool, &p.id).await;
    assert_eq!(titles.len(), 450);
    assert_eq!(short(&titles[0]), 449);
    assert_eq!(short(&titles[1]), 0);
    let first = entries_page(&pool, &p.id, 0).await.unwrap();
    assert_eq!((first.entries.len(), first.total, first.entries[0].position), (200, 450, 0));
}

/// Phase 3 exit demo, first half: a 50-track playlist from filtered results,
/// reordered, order and repeats intact.
#[tokio::test]
async fn exit_demo_fifty_tracks_from_filtered_results_reordered() {
    let pool = pool().await;
    seed_varied_rows(&pool, 2_000).await;
    let filters = TrackFilters { formats: vec!["flac".into()], year_min: Some(2000), year_max: Some(2005), ..Default::default() };
    let query = ListQuery { filters: Some(&filters), sort: Some(&TrackSort { column: SortColumn::Album, descending: false }), ..Default::default() };
    let ids: Vec<String> = matching_ids_query(&pool, &query).await.unwrap().into_iter().take(50).collect();
    assert_eq!(ids.len(), 50);

    let p = create_playlist(&pool, "From filters").await.unwrap();
    assert_eq!(add_tracks(&pool, &p.id, &ids, None).await.unwrap(), 50);
    let entries = entry_ids(&pool, &p.id).await.unwrap();
    move_entries(&pool, &p.id, &entries[40..45].to_vec(), 0).await.unwrap();
    move_entries(&pool, &p.id, &[entries[0].clone()], 49).await.unwrap();

    let page = entries_page(&pool, &p.id, 0).await.unwrap();
    assert_eq!(page.total, 50);
    let tracks: Vec<String> = page.entries.iter().map(|e| e.track.as_ref().unwrap().id.clone()).collect();
    assert_eq!(tracks[..5], ids[40..45]);
    assert_eq!(tracks[49], ids[0]);
    assert_eq!(playable_track_ids(&pool, &p.id).await.unwrap(), tracks);
}
