use std::path::{Path, PathBuf};

use sqlx::sqlite::SqlitePool;

use super::m3u::{
    commit_import, export_playlist, format_m3u, parse_m3u, preview_import, relative_path,
    relink_entry, EntryStatus, ExportEntry, ExportStyle,
};
use super::playlists::{add_tracks, create_playlist, entries_page, entry_ids, playable_track_ids};
use super::test_support::{entry_titles, pool, write_wav};
use super::{import_paths, list, remove};

#[test]
fn parses_extinf_names_comments_and_blank_lines() {
    let text = "\u{feff}#EXTM3U\r\n#PLAYLIST:Night drive\r\n\r\n#EXTINF:215,Vladislav Delay - Huone\r\n/music/a.flac\r\n# just a comment\r\n#EXTINF:-1,No artist here\r\n/music/b.flac\r\n/music/c.flac\r\n";
    let parsed = parse_m3u(text.as_bytes(), Path::new("/lists"));
    assert_eq!(parsed.name.as_deref(), Some("Night drive"));
    assert_eq!(parsed.entries.len(), 3);
    let first = &parsed.entries[0];
    assert_eq!((first.artist.as_deref(), first.title.as_deref(), first.duration), (Some("Vladislav Delay"), Some("Huone"), Some(215.0)));
    assert_eq!(first.path, PathBuf::from("/music/a.flac"));
    let second = &parsed.entries[1];
    assert_eq!((second.artist.as_deref(), second.title.as_deref(), second.duration), (None, Some("No artist here"), None), "negative length ignored");
    assert_eq!(parsed.entries[2].title, None, "EXTINF applies to one line only");
    assert_eq!(parsed.entries[2].line, 9);
}

#[test]
fn resolves_relative_file_url_windows_and_remote_lines() {
    let text = "songs/a.flac\n../other/b.flac\n./c.flac\nfile:///music/My%20Songs/d.flac\nC:\\Music\\e.flac\nhttps://radio.example/stream\n";
    let parsed = parse_m3u(text.as_bytes(), Path::new("/lists/mine"));
    let paths: Vec<String> = parsed.entries.iter().map(|e| e.path.to_string_lossy().replace('\\', "/")).collect();
    assert_eq!(paths[0], "/lists/mine/songs/a.flac");
    assert_eq!(paths[1], "/lists/other/b.flac");
    assert_eq!(paths[2], "/lists/mine/c.flac");
    assert_eq!(paths[3], "/music/My Songs/d.flac");
    assert!(paths[4].ends_with("C:/Music/e.flac"), "{}", paths[4]);
    assert!(parsed.entries[5].remote && !parsed.entries[0].remote);
}

#[test]
fn falls_back_to_latin1_for_old_m3u_files() {
    let bytes = b"#EXTM3U\n#EXTINF:10,Caf\xe9\n/music/caf\xe9.flac\n";
    let parsed = parse_m3u(bytes, Path::new("/"));
    assert_eq!(parsed.entries[0].title.as_deref(), Some("Caf\u{e9}"));
    assert_eq!(parsed.entries[0].path, PathBuf::from("/music/caf\u{e9}.flac"));
}

#[test]
fn relative_paths_use_dotdot_and_report_when_no_common_root() {
    let base = Path::new("/music/lists");
    assert_eq!(relative_path(Path::new("/music/lists/a.flac"), base), Some(PathBuf::from("a.flac")));
    assert_eq!(relative_path(Path::new("/music/lists/sub/a.flac"), base), Some(PathBuf::from("sub/a.flac")));
    assert_eq!(relative_path(Path::new("/music/albums/a.flac"), base), Some(PathBuf::from("../albums/a.flac")));
    assert_eq!(relative_path(Path::new("/data/a.flac"), base), Some(PathBuf::from("../../data/a.flac")));
}

#[test]
fn formats_absolute_and_relative_lists_with_portability_counts() {
    let entries = vec![
        ExportEntry { path: "/music/lists/in/a.flac".into(), title: "A".into(), artist: "Ann".into(), duration: 60.4 },
        ExportEntry { path: "/music/other/b.flac".into(), title: "B".into(), artist: String::new(), duration: 0.0 },
        ExportEntry { path: "/music/lists/in/a.flac".into(), title: "A".into(), artist: "Ann".into(), duration: 60.4 },
    ];
    let (relative, stats) = format_m3u("Mix", &entries, Path::new("/music/lists"), ExportStyle::Relative);
    assert_eq!(
        relative,
        "#EXTM3U\n#PLAYLIST:Mix\n#EXTINF:60,Ann - A\nin/a.flac\n#EXTINF:0,B\n../other/b.flac\n#EXTINF:60,Ann - A\nin/a.flac\n"
    );
    assert_eq!((stats.written, stats.outside_root, stats.absolute_fallback), (3, 1, 0));
    let (absolute, stats) = format_m3u("Mix", &entries, Path::new("/music/lists"), ExportStyle::Absolute);
    assert!(absolute.contains("\n/music/other/b.flac\n"));
    assert_eq!((stats.outside_root, stats.absolute_fallback), (0, 0));
}

/// Three real WAVs (a, b, c) in `root`, imported.
async fn m3u_library() -> (tempfile::TempDir, SqlitePool, Vec<String>, Vec<PathBuf>) {
    let dir = tempfile::tempdir().unwrap();
    let mut paths = Vec::new();
    for (name, title) in [("a", "Alpha"), ("b", "Beta"), ("c", "Gamma")] {
        let path = dir.path().join(format!("{name}.wav"));
        write_wav(&path, title, "Artist");
        paths.push(path);
    }
    let pool = pool().await;
    import_paths(&pool, paths.clone()).await;
    let mut ids = Vec::new();
    for title in ["Alpha", "Beta", "Gamma"] {
        ids.push(list(&pool, title, 0).await.unwrap().tracks.into_iter().find(|t| t.title == title).unwrap().id);
    }
    (dir, pool, ids, paths)
}

#[tokio::test]
async fn export_then_import_round_trips_order_and_repeats() {
    let (dir, pool, ids, _) = m3u_library().await;
    let original = create_playlist(&pool, "Round trip").await.unwrap();
    add_tracks(&pool, &original.id, &[ids[0].clone(), ids[1].clone(), ids[0].clone(), ids[2].clone()], None).await.unwrap();

    let file = dir.path().join("round trip.m3u8");
    let stats = export_playlist(&pool, &original.id, &file, ExportStyle::Relative).await.unwrap();
    assert_eq!((stats.written, stats.outside_root, stats.absolute_fallback), (4, 0, 0));
    let text = std::fs::read_to_string(&file).unwrap();
    assert!(text.starts_with("#EXTM3U\n#PLAYLIST:Round trip\n"), "{text}");
    assert!(text.contains("\na.wav\n"), "relative names: {text}");

    let preview = preview_import(&pool, &file, None).await.unwrap();
    assert_eq!((preview.total, preview.linked, preview.unresolved.len()), (4, 4, 0));
    assert_eq!(preview.suggested_name, "Round trip");

    let outcome = commit_import(&pool, &file, "Imported copy", true, None).await.unwrap();
    assert_eq!((outcome.linked, outcome.unresolved, outcome.imported), (4, 0, 0));
    assert_eq!(entry_titles(&pool, &outcome.playlist.id).await, entry_titles(&pool, &original.id).await);
    assert_eq!(playable_track_ids(&pool, &outcome.playlist.id).await.unwrap(), playable_track_ids(&pool, &original.id).await.unwrap());
}

#[tokio::test]
async fn import_keeps_unresolved_entries_and_relinks_them_when_the_file_arrives() {
    let (dir, pool, ids, _) = m3u_library().await;
    let _ = ids;
    let outside = dir.path().join("new");
    std::fs::create_dir_all(&outside).unwrap();
    let fresh = outside.join("fresh.wav");
    write_wav(&fresh, "Fresh", "Artist");
    let unsupported = outside.join("song.mp3");
    std::fs::write(&unsupported, b"not really mp3").unwrap();
    let missing = dir.path().join("gone.wav");
    let list_file = dir.path().join("mixed.m3u");
    std::fs::write(
        &list_file,
        format!(
            "#EXTM3U\n#EXTINF:5,Ann - Known\n{}\n{}\n{}\n{}\nhttps://radio.example/live\n",
            dir.path().join("a.wav").display(),
            fresh.display(),
            unsupported.display(),
            missing.display(),
        ),
    )
    .unwrap();

    let preview = preview_import(&pool, &list_file, None).await.unwrap();
    assert_eq!(
        (preview.total, preview.linked, preview.needs_import, preview.missing, preview.unsupported, preview.remote),
        (5, 1, 1, 1, 1, 1)
    );
    let statuses: Vec<EntryStatus> = preview.unresolved.iter().map(|u| u.status).collect();
    assert_eq!(statuses, [EntryStatus::NeedsImport, EntryStatus::Unsupported, EntryStatus::Missing, EntryStatus::Remote]);
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 3, "preview imports nothing");

    // Without importing files, the fresh one stays an unavailable entry.
    let kept = commit_import(&pool, &list_file, "No import", false, None).await.unwrap();
    assert_eq!((kept.linked, kept.unresolved, kept.imported), (1, 4, 0));
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 3);

    let outcome = commit_import(&pool, &list_file, "With import", true, None).await.unwrap();
    assert_eq!((outcome.linked, outcome.unresolved, outcome.imported), (2, 3, 1));
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 4, "fresh.wav joined the library");
    let page = entries_page(&pool, &outcome.playlist.id, 0).await.unwrap();
    assert_eq!(page.total, 5, "nothing dropped");
    assert_eq!(page.entries.iter().map(|e| e.unavailable).collect::<Vec<_>>(), [false, false, true, true, true]);
    assert_eq!(page.entries[0].title, "Alpha", "catalog metadata wins for linked entries");
    assert_eq!(page.entries[2].title, "song");

    // The missing file turns up later: the entry re-links by path on open.
    write_wav(&missing, "Gone", "Artist");
    import_paths(&pool, vec![missing.clone()]).await;
    let page = entries_page(&pool, &outcome.playlist.id, 0).await.unwrap();
    assert!(!page.entries[3].unavailable, "relinked by path");
}

#[tokio::test]
async fn import_rejects_a_taken_name_before_importing_anything() {
    let (dir, pool, _, _) = m3u_library().await;
    create_playlist(&pool, "Taken").await.unwrap();
    let fresh = dir.path().join("fresh.wav");
    write_wav(&fresh, "Fresh", "Artist");
    let file = dir.path().join("x.m3u8");
    std::fs::write(&file, format!("{}\n", fresh.display())).unwrap();

    let error = commit_import(&pool, &file, "taken", true, None).await.unwrap_err();
    assert!(error.contains("already exists"));
    assert_eq!(list(&pool, "", 0).await.unwrap().total, 3, "no files imported on failure");
}

#[tokio::test]
async fn relinking_by_folder_finds_moved_files_by_path_suffix_and_unique_name() {
    let (dir, pool, _, _) = m3u_library().await;
    // The list was made on another machine: /old/drive/Music/Album/x.wav and /old/drive/Music/y.wav
    let moved = dir.path().join("moved");
    std::fs::create_dir_all(moved.join("Album")).unwrap();
    std::fs::create_dir_all(moved.join("Elsewhere")).unwrap();
    write_wav(&moved.join("Album/x.wav"), "X", "Artist");
    write_wav(&moved.join("Elsewhere/y.wav"), "Y", "Artist");
    let list_file = dir.path().join("moved.m3u8");
    std::fs::write(&list_file, "/old/drive/Music/Album/x.wav\n/old/drive/Music/y.wav\n/old/drive/Music/none.wav\n").unwrap();

    let without = preview_import(&pool, &list_file, None).await.unwrap();
    assert_eq!((without.missing, without.needs_import), (3, 0));
    let with = preview_import(&pool, &list_file, Some(&moved)).await.unwrap();
    assert_eq!((with.needs_import, with.missing), (2, 1), "suffix match and unique-name match");

    let outcome = commit_import(&pool, &list_file, "Moved", true, Some(&moved)).await.unwrap();
    assert_eq!((outcome.linked, outcome.imported, outcome.unresolved), (2, 2, 1));
}

#[tokio::test]
async fn relinking_an_entry_to_a_chosen_file_imports_it_when_needed() {
    let (dir, pool, ids, _) = m3u_library().await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &[ids[0].clone()], None).await.unwrap();
    remove(&pool, &ids[0]).await.unwrap();
    let entry = entry_ids(&pool, &p.id).await.unwrap().remove(0);
    let replacement = dir.path().join("replacement.wav");
    write_wav(&replacement, "Replacement", "Artist");

    relink_entry(&pool, &p.id, &entry, &replacement).await.unwrap();

    let page = entries_page(&pool, &p.id, 0).await.unwrap();
    assert!(!page.entries[0].unavailable);
    assert_eq!(page.entries[0].title, "Replacement");
    assert!(relink_entry(&pool, &p.id, "nope", &replacement).await.is_err());
}

#[tokio::test]
async fn export_keeps_unavailable_entries_with_their_saved_path_and_name() {
    let (dir, pool, ids, _) = m3u_library().await;
    let p = create_playlist(&pool, "P").await.unwrap();
    add_tracks(&pool, &p.id, &[ids[1].clone()], None).await.unwrap();
    remove(&pool, &ids[1]).await.unwrap();
    let file = dir.path().join("p.m3u8");
    let stats = export_playlist(&pool, &p.id, &file, ExportStyle::Absolute).await.unwrap();
    assert_eq!(stats.written, 1);
    let text = std::fs::read_to_string(&file).unwrap();
    assert!(text.contains("Artist - Beta"), "{text}");
    assert!(text.contains("b.wav"), "{text}");
}
