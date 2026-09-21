use std::path::Path;

use sqlx::SqlitePool;

use super::backup::{export_backup, restore_backup, restore_preview, RootMapping};
use super::catalog::{add_tag, apply_edits, set_color, set_rating, record_play, EditField, FieldEdit};
use super::playlists::{add_tracks, create_playlist, entries_page};
use super::tests::{pool, write_wav_tagged};
use super::{add_root, import_paths, list_query, remove, LibraryTrack, ListQuery};

async fn tracks(pool: &SqlitePool) -> Vec<LibraryTrack> {
    let query = ListQuery { search: "", filter: None, filters: None, sort: None };
    list_query(pool, &query, 0).await.unwrap().tracks
}

fn make_music(dir: &Path) {
    for (i, title) in ["Alpha", "Beta", "Gamma"].iter().enumerate() {
        write_wav_tagged(&dir.join(format!("{i}.wav")), &[("INAM", title), ("IART", "Band"), ("IPRD", "Record")]);
    }
}

fn mapping(from: &Path, to: &Path) -> Vec<RootMapping> {
    vec![RootMapping { from: from.to_string_lossy().into_owned(), to: to.to_string_lossy().into_owned() }]
}

#[tokio::test]
async fn backup_restores_into_a_fresh_profile_with_remapped_roots() {
    let old_dir = tempfile::tempdir().unwrap();
    make_music(old_dir.path());
    let source = pool().await;
    add_root(&source, old_dir.path()).await.unwrap();
    let paths: Vec<_> = (0..3).map(|i| old_dir.path().join(format!("{i}.wav"))).collect();
    import_paths(&source, paths).await;
    let all = tracks(&source).await;
    let ids: Vec<String> = all.iter().map(|t| t.id.clone()).collect();
    apply_edits(&source, &ids[..1], &[FieldEdit { field: EditField::Album, value: Some("Edited".into()) }]).await.unwrap();
    set_rating(&source, &ids[..2], 4).await.unwrap();
    set_color(&source, &ids[..1], "green").await.unwrap();
    add_tag(&source, &ids, "keeper").await.unwrap();
    record_play(&source, &ids[0]).await.unwrap();
    let playlist = create_playlist(&source, "Set").await.unwrap();
    add_tracks(&source, &playlist.id, &ids, None).await.unwrap();

    let backup_dir = tempfile::tempdir().unwrap();
    let backup = backup_dir.path().join("lib.tahti-backup");
    let summary = export_backup(&source, &backup).await.unwrap();
    assert_eq!((summary.tracks, summary.roots, summary.playlists, summary.edits), (3, 1, 1, 1));
    assert!(!backup_dir.path().join("lib.tmp-backup").exists());

    // The music now lives somewhere else.
    let new_dir = tempfile::tempdir().unwrap();
    for i in 0..3 {
        std::fs::copy(old_dir.path().join(format!("{i}.wav")), new_dir.path().join(format!("{i}.wav"))).unwrap();
    }
    let maps = mapping(old_dir.path(), new_dir.path());

    let unmapped = restore_preview(&backup, &[]).unwrap();
    assert_eq!(unmapped.files_found, 3, "the old folder still exists on this machine");
    std::fs::remove_dir_all(old_dir.path()).unwrap();
    let unmapped = restore_preview(&backup, &[]).unwrap();
    assert_eq!((unmapped.files_found, unmapped.files_missing), (0, 3));
    assert!(!unmapped.roots[0].exists);
    let preview = restore_preview(&backup, &maps).unwrap();
    assert_eq!((preview.files_found, preview.files_missing, preview.playlists, preview.playlist_entries), (3, 0, 1, 3));
    assert!(preview.roots[0].exists);
    assert_eq!(preview.roots[0].tracks, 3);

    let fresh = pool().await;
    let result = restore_backup(&fresh, &backup, &maps).await.unwrap();
    assert_eq!((result.tracks_restored, result.tracks_missing, result.roots_added), (3, 0, 1));
    assert_eq!((result.playlists_created, result.edits_applied), (1, 1));

    let restored = tracks(&fresh).await;
    assert_eq!(restored.len(), 3);
    let by_title = |t: &str| restored.iter().find(|x| x.title == t).unwrap().clone();
    assert_eq!(by_title("Alpha").album, "Edited");
    assert_eq!(by_title("Alpha").rating, 4);
    assert_eq!(by_title("Alpha").color, "green");
    assert_eq!(by_title("Alpha").play_count, 1);
    assert_eq!(by_title("Beta").rating, 4);
    assert_eq!(by_title("Gamma").rating, 0);
    assert_eq!(by_title("Beta").album, "Record");
    let root_id: Option<String> = sqlx::query_scalar("SELECT root_id FROM library_tracks WHERE title='Beta'").fetch_one(&fresh).await.unwrap();
    assert!(root_id.is_some(), "restored files join the restored watched folder");
    let tags: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM library_track_tags").fetch_one(&fresh).await.unwrap();
    assert_eq!(tags, 3);
    // The restored edit is still a proper override, so it survives a rescan.
    let path = new_dir.path().join("0.wav");
    import_paths(&fresh, vec![path]).await;
    assert_eq!(tracks(&fresh).await.iter().find(|t| t.title == "Alpha").unwrap().album, "Edited");

    let list = crate::local_library::playlists::list_playlists(&fresh).await.unwrap();
    assert_eq!(list.len(), 1);
    let page = entries_page(&fresh, &list[0].id, 0).await.unwrap();
    let order: Vec<&str> = page.entries.iter().map(|e| e.title.as_str()).collect();
    assert_eq!(order.len(), 3);
    assert!(page.entries.iter().all(|e| e.track.is_some()), "playlist entries link to the restored tracks");
}

#[tokio::test]
async fn restore_reports_missing_files_and_never_overwrites_a_playlist_name() {
    let dir = tempfile::tempdir().unwrap();
    make_music(dir.path());
    let source = pool().await;
    import_paths(&source, (0..3).map(|i| dir.path().join(format!("{i}.wav"))).collect()).await;
    let ids: Vec<String> = tracks(&source).await.into_iter().map(|t| t.id).collect();
    set_rating(&source, &ids, 5).await.unwrap();
    let playlist = create_playlist(&source, "Set").await.unwrap();
    add_tracks(&source, &playlist.id, &ids, None).await.unwrap();
    let backup = dir.path().join("b.tahti-backup");
    export_backup(&source, &backup).await.unwrap();

    std::fs::remove_file(dir.path().join("1.wav")).unwrap();
    // Restoring into the same catalog: "Set" already exists.
    let result = restore_backup(&source, &backup, &[]).await.unwrap();
    assert_eq!((result.tracks_restored, result.tracks_missing), (2, 1));
    assert_eq!((result.playlists_created, result.playlists_renamed), (1, 1));
    let names: Vec<String> = crate::local_library::playlists::list_playlists(&source).await.unwrap().into_iter().map(|p| p.name).collect();
    assert_eq!(names, vec!["Set", "Set (restored)"]);
    // The restored copy keeps the vanished file as an unavailable entry, in place.
    let restored = crate::local_library::playlists::list_playlists(&source).await.unwrap().into_iter().find(|p| p.name == "Set (restored)").unwrap();
    assert_eq!(restored.track_count, 3);

    remove(&source, &ids[0]).await.unwrap();
    assert!(restore_preview(&dir.path().join("nope"), &[]).is_err());
    std::fs::write(dir.path().join("junk.tahti-backup"), b"{\"hello\":1}").unwrap();
    assert_eq!(restore_preview(&dir.path().join("junk.tahti-backup"), &[]).unwrap_err(), "This is not a Tahti library backup.");
}

#[test]
fn path_mapping_respects_folder_boundaries_and_unicode() {
    let maps = |from: &str, to: &str| vec![RootMapping { from: from.into(), to: to.into() }];
    let mapped = |path: &str, m: &[RootMapping]| super::backup::map_path_for_test(path, m);
    let m = maps("/Music", "/mnt/new");
    assert_eq!(mapped("/Music/a/b.wav", &m), std::path::PathBuf::from("/mnt/new/a/b.wav").to_string_lossy());
    assert_eq!(mapped("/MusicBox/a.wav", &m), "/MusicBox/a.wav", "a sibling folder with the same prefix is not remapped");
    assert_eq!(mapped("/music/a.wav", &m), std::path::PathBuf::from("/mnt/new/a.wav").to_string_lossy());
    // A multi-byte character where the prefix ends must not panic.
    let m = maps("/ab", "/x");
    assert_eq!(mapped("/aé/song.wav", &m), "/aé/song.wav");
    assert_eq!(mapped("/Müzik/ä.wav", &maps("/Müzik", "/y")), std::path::PathBuf::from("/y/ä.wav").to_string_lossy());
    // The longest matching folder wins.
    let m = vec![
        RootMapping { from: "/a".into(), to: "/one".into() },
        RootMapping { from: "/a/b".into(), to: "/two".into() },
    ];
    assert_eq!(mapped("/a/b/c.wav", &m), std::path::PathBuf::from("/two/c.wav").to_string_lossy());
    // Windows-style separators in the backup.
    let m = maps("C:\\Music", "/mnt/new");
    assert_eq!(mapped("C:\\Music\\Album\\a.wav", &m), std::path::PathBuf::from("/mnt/new/Album/a.wav").to_string_lossy());
}

#[tokio::test]
async fn backup_carries_bpm_key_corrections_and_smart_playlist_rules() {
    use super::analysis::{detail, set_corrections};
    use super::smart_playlists::{list_smart, save_smart, RuleField, RuleOp, SmartDefinition, SmartRule};
    use super::SortColumn;

    let dir = tempfile::tempdir().unwrap();
    make_music(dir.path());
    let source = pool().await;
    import_paths(&source, (0..3).map(|i| dir.path().join(format!("{i}.wav"))).collect()).await;
    let ids: Vec<String> = tracks(&source).await.into_iter().map(|t| t.id).collect();
    set_corrections(&source, &ids[..1], Some(126.5), Some("Bbm")).await.unwrap();
    let definition = SmartDefinition {
        name: "Fast".into(),
        match_all: true,
        rules: vec![SmartRule { field: RuleField::Bpm, op: RuleOp::AtLeast, value: "120".into(), value2: String::new() }],
        sort: SortColumn::Bpm,
        descending: true,
        limit: Some(50),
    };
    save_smart(&source, None, &definition).await.unwrap();

    let backup = tempfile::tempdir().unwrap().keep().join("lib.tahti-backup");
    export_backup(&source, &backup).await.unwrap();

    let target = pool().await;
    import_paths(&target, (0..3).map(|i| dir.path().join(format!("{i}.wav"))).collect()).await;
    restore_backup(&target, &backup, &[]).await.unwrap();
    // Restoring twice never overwrites the rule set that is already there.
    restore_backup(&target, &backup, &[]).await.unwrap();

    let restored = tracks(&target).await.into_iter().find(|t| t.path.ends_with("0.wav")).unwrap();
    let d = detail(&target, &restored.id).await.unwrap();
    assert_eq!((d.user_bpm, d.user_key.as_deref(), d.bpm), (Some(126.5), Some("A#m"), Some(126.5)));
    let names: Vec<String> = list_smart(&target).await.unwrap().into_iter().map(|s| s.definition.name).collect();
    assert_eq!(names, vec!["Fast", "Fast (restored)"]);
    let rules = &list_smart(&target).await.unwrap()[0].definition;
    assert_eq!((rules.limit, rules.descending, rules.rules.len()), (Some(50), true, 1));
}
